// k6/run.js
//
// Thin, cross-platform (Windows/macOS/Linux) wrapper around `k6 run` that:
//   1. Picks the scenario script from a short name (smoke | load | browser)
//   2. Writes every raw metric sample to a timestamped CSV under k6/results/
//   3. Writes the full console output (checks, thresholds, summary) to a
//      timestamped .log file under k6/results/
//   4. Asks k6 for a machine-readable JSON summary (--summary-export)
//   5. Generates k6's own built-in HTML report (the "default" k6 report,
//      via K6_WEB_DASHBOARD) - works fully offline, no Docker required.
//   6. If --grafana is passed (or GRAFANA=true), and only if InfluxDB is
//      actually reachable at INFLUXDB_URL, also streams metrics there live
//      for the local Grafana dashboard. If it's NOT reachable, this step is
//      skipped with a warning - it never fails or blocks the test run.
//   7. If --cloud is passed (or K6_CLOUD=true), streams results to Grafana
//      Cloud k6 instead (--out cloud) - a hosted dashboard URL, no Docker or
//      local services required. Needs `k6 login cloud` run once beforehand.
//
// Usage:
//   node k6/run.js smoke
//   node k6/run.js load
//   node k6/run.js browser
//   node k6/run.js smoke --grafana     (local dashboard, requires: npm run grafana:up)
//   node k6/run.js smoke --cloud        (hosted dashboard, requires: k6 login cloud)
//
// All k6/env vars (BASE_URL, API_URL, HEADLESS, K6_BROWSER_HEADLESS, etc.)
// are inherited from the current shell / .env - same as running k6 directly.

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const aggregateReport = require('./report/aggregate-report');

const SCENARIOS = {
  smoke: 'k6/scenarios/api-smoke.js',
  load: 'k6/scenarios/load-test.js',
  browser: 'k6/scenarios/browser-login.js'
};

const key = process.argv[2];
const script = SCENARIOS[key];
const wantsGrafana =
  process.argv.includes('--grafana') || String(process.env.GRAFANA || '').toLowerCase() === 'true';
const wantsCloud =
  process.argv.includes('--cloud') || String(process.env.K6_CLOUD || '').toLowerCase() === 'true';

if (!script) {
  console.error(`Unknown k6 scenario "${key}". Valid options: ${Object.keys(SCENARIOS).join(', ')}`);
  process.exit(1);
}

const resultsDir = path.resolve(__dirname, 'results');
fs.mkdirSync(resultsDir, { recursive: true });

// Timestamp like 2026-07-22_14-05-30, safe for filenames on Windows too.
const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '').replace('T', '_');

const csvPath = path.join(resultsDir, `${key}-${timestamp}.csv`);
const logPath = path.join(resultsDir, `${key}-${timestamp}.log`);
const summaryPath = path.join(resultsDir, `${key}-${timestamp}-summary.json`);
const reportPath = path.join(resultsDir, `${key}-${timestamp}-report.html`);
const aggregateCsvPath = path.join(resultsDir, `${key}-${timestamp}-aggregate.csv`);
const aggregateHtmlPath = path.join(resultsDir, `${key}-${timestamp}-aggregate.html`);

// Builds the JMeter-style aggregate report (per-endpoint table + TOTAL row)
// from the raw CSV k6 just wrote. Best-effort: a failure here (or a browser
// run with no http_req_* samples) must never change the k6 exit code.
function buildAggregateReport() {
  try {
    if (!fs.existsSync(csvPath)) return;
    const rows = aggregateReport.parseCsv(csvPath);
    const result = aggregateReport.aggregate(rows);
    if (result.perLabel.length === 0) return;
    aggregateReport.writeCsv(aggregateCsvPath, result);
    aggregateReport.writeHtml(aggregateHtmlPath, result, path.basename(csvPath));
    console.log(
      `  Aggregate CSV:  ${aggregateCsvPath}\n` +
        `  Aggregate HTML: ${aggregateHtmlPath}`
    );
  } catch (err) {
    console.warn(`\n[k6] Could not build aggregate report: ${err.message}`);
  }
}

const influxdbUrl = process.env.INFLUXDB_URL || 'http://localhost:8086';

// Quick, short-timeout reachability check so an unreachable InfluxDB never
// hangs or fails the actual k6 run - it just means Grafana output is skipped.
function checkInfluxReachable(url, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.get(`${url}/ping`, { timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 300);
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.on('error', () => resolve(false));
  });
}

async function main() {
  const args = [
    'run',
    '--out', `csv=${csvPath}`,
    '--summary-export', summaryPath
  ];

  let grafanaEnabled = false;

  if (wantsGrafana) {
    const reachable = await checkInfluxReachable(influxdbUrl);
    if (reachable) {
      args.push('--out', `influxdb=${influxdbUrl}/k6`);
      grafanaEnabled = true;
    } else {
      console.warn(
        `\n[k6] --grafana requested but InfluxDB is not reachable at ${influxdbUrl}.` +
          `\n[k6] Run "npm run grafana:up" first. Continuing WITHOUT live Grafana output ` +
          `(CSV/log/HTML report still produced normally).\n`
      );
    }
  }

  let cloudEnabled = false;

  if (wantsCloud) {
    args.push('--out', 'cloud');
    cloudEnabled = true;
  }

  args.push(script);

  console.log(`\n[k6] scenario: ${key}`);
  console.log(`[k6] script:   ${script}`);
  console.log(`[k6] csv:      ${csvPath}`);
  console.log(`[k6] log:      ${logPath}`);
  console.log(`[k6] summary:  ${summaryPath}`);
  console.log(`[k6] report:   ${reportPath}`);
  console.log(`[k6] grafana:  ${grafanaEnabled ? `live @ ${influxdbUrl} (view at http://localhost:3000)` : 'disabled'}`);
  console.log(`[k6] cloud:    ${cloudEnabled ? 'enabled (dashboard URL will be printed by k6 below)' : 'disabled'}\n`);

  const logStream = fs.createWriteStream(logPath, { flags: 'a' });

  const child = spawn('k6', args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: {
      ...process.env,
      K6_WEB_DASHBOARD: 'true',
      K6_WEB_DASHBOARD_EXPORT: reportPath
    }
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
    logStream.write(chunk);
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
    logStream.write(chunk);
  });

  child.on('error', (err) => {
    console.error('\nFailed to start k6. Is it installed and on your PATH? (`k6 version` to check)');
    console.error(err.message);
    logStream.end();
    process.exit(1);
  });

  child.on('close', (code) => {
    logStream.end();
    const status = code === 0 ? 'Passed' : `Finished with exit code ${code}`;
    console.log(
      `\n[k6] ${status}. Results saved:\n` +
        `  CSV:     ${csvPath}\n` +
        `  Log:     ${logPath}\n` +
        `  Summary: ${summaryPath}\n` +
        `  Report:  ${reportPath}` +
        (grafanaEnabled ? `\n  Grafana: http://localhost:3000 (dashboard: "Symulate - k6 Load & Performance Testing")` : '') +
        (cloudEnabled ? `\n  Cloud:   see the "output: cloud (...)" URL k6 printed above, or https://app.k6.io/runs` : '')
    );
    buildAggregateReport();
    process.exit(code);
  });
}

main();
