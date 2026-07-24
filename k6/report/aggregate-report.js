// k6/report/aggregate-report.js
//
// Turns a raw k6 CSV output (produced by `--out csv=...`, see k6/run.js) into a
// JMeter-style "Aggregate Report": one row per endpoint label plus a TOTAL row,
// with the exact columns you'd see in JMeter's Aggregate/Summary report:
//
//   Label | # Samples | Average | Min | Max | Std. Dev. | Error % |
//   Throughput | Received KB/sec | Sent KB/sec | Avg. Bytes
//
// It writes two files next to the source CSV:
//   <base>-aggregate.csv   -> open in Excel/Google Sheets (looks like the sheet)
//   <base>-aggregate.html  -> styled table + a config box (VUs / duration / etc.)
//
// Usage:
//   node k6/report/aggregate-report.js                 (latest *.csv in k6/results)
//   node k6/report/aggregate-report.js smoke           (latest smoke-*.csv)
//   node k6/report/aggregate-report.js path/to/file.csv
//
// All timing stats come from http_req_duration (ms), errors from
// http_req_failed, and per-endpoint bytes from the recv_bytes/sent_bytes custom
// counters added in k6/lib/config.js. Everything is grouped by the request
// `name` tag, exactly like JMeter groups by sampler label.

const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.resolve(__dirname, '..', 'results');

// ---- locate the source CSV -------------------------------------------------

function resolveCsvPath(arg) {
  if (arg && arg.toLowerCase().endsWith('.csv')) {
    return path.resolve(arg);
  }

  if (!fs.existsSync(RESULTS_DIR)) {
    throw new Error(`No results directory found at ${RESULTS_DIR}. Run a k6 scenario first.`);
  }

  const csvs = fs
    .readdirSync(RESULTS_DIR)
    .filter((f) => f.endsWith('.csv') && !f.endsWith('-aggregate.csv'))
    .filter((f) => (arg ? f.startsWith(`${arg}-`) : true))
    .map((f) => {
      const full = path.join(RESULTS_DIR, f);
      return { full, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  if (csvs.length === 0) {
    throw new Error(
      `No k6 CSV output found in ${RESULTS_DIR}` +
        (arg ? ` matching "${arg}-*.csv"` : '') +
        '. Run e.g. "npm run k6:smoke" first.'
    );
  }
  return csvs[0].full;
}

// ---- CSV parsing (header-driven, tolerant of trailing empty columns) -------

function parseCsv(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) {
    throw new Error(`CSV "${csvPath}" has no data rows.`);
  }

  const header = lines[0].split(',');
  const idx = {
    metric: header.indexOf('metric_name'),
    ts: header.indexOf('timestamp'),
    value: header.indexOf('metric_value'),
    name: header.indexOf('name'),
    status: header.indexOf('status')
  };

  if (idx.metric < 0 || idx.value < 0 || idx.name < 0) {
    throw new Error(
      `CSV "${csvPath}" is missing expected k6 columns (metric_name/metric_value/name).`
    );
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    rows.push({
      metric: cols[idx.metric],
      ts: Number(cols[idx.ts]),
      value: Number(cols[idx.value]),
      name: cols[idx.name] || '(unnamed)',
      status: cols[idx.status]
    });
  }
  return rows;
}

// ---- aggregation -----------------------------------------------------------

function newBucket() {
  return {
    samples: 0,
    sum: 0,
    sumSq: 0,
    min: Infinity,
    max: -Infinity,
    failed: 0,
    recv: 0,
    sent: 0
  };
}

function aggregate(rows) {
  const byLabel = new Map();
  let minTs = Infinity;
  let maxTs = -Infinity;
  let maxVus = 0;
  let iterations = 0;

  const bucketFor = (name) => {
    if (!byLabel.has(name)) byLabel.set(name, newBucket());
    return byLabel.get(name);
  };

  for (const r of rows) {
    if (Number.isFinite(r.ts)) {
      if (r.ts < minTs) minTs = r.ts;
      if (r.ts > maxTs) maxTs = r.ts;
    }

    switch (r.metric) {
      case 'http_req_duration': {
        const b = bucketFor(r.name);
        b.samples += 1;
        b.sum += r.value;
        b.sumSq += r.value * r.value;
        if (r.value < b.min) b.min = r.value;
        if (r.value > b.max) b.max = r.value;
        break;
      }
      case 'http_req_failed':
        bucketFor(r.name).failed += r.value; // 1 = failed, 0 = ok
        break;
      case 'recv_bytes':
        bucketFor(r.name).recv += r.value;
        break;
      case 'sent_bytes':
        bucketFor(r.name).sent += r.value;
        break;
      case 'vus':
        if (r.value > maxVus) maxVus = r.value;
        break;
      case 'iterations':
        iterations += r.value;
        break;
      default:
        break;
    }
  }

  const elapsedSec = Number.isFinite(minTs) && maxTs > minTs ? maxTs - minTs : 1;

  const round = (n, d = 2) => (Number.isFinite(n) ? Number(n.toFixed(d)) : 0);

  const finalize = (label, b) => {
    const avg = b.samples ? b.sum / b.samples : 0;
    const variance = b.samples ? b.sumSq / b.samples - avg * avg : 0;
    const stddev = Math.sqrt(Math.max(0, variance));
    return {
      label,
      samples: b.samples,
      average: round(avg),
      min: b.samples ? round(b.min) : 0,
      max: b.samples ? round(b.max) : 0,
      stddev: round(stddev),
      errorPct: round((b.samples ? b.failed / b.samples : 0) * 100),
      throughput: round(b.samples / elapsedSec),
      recvKbSec: round(b.recv / elapsedSec / 1024),
      sentKbSec: round(b.sent / elapsedSec / 1024),
      avgBytes: round(b.samples ? b.recv / b.samples : 0, 1)
    };
  };

  const labels = [...byLabel.keys()]
    .filter((name) => byLabel.get(name).samples > 0)
    .sort((a, b) => byLabel.get(b).samples - byLabel.get(a).samples);

  const perLabel = labels.map((name) => finalize(name, byLabel.get(name)));

  // TOTAL row: combine every bucket that actually recorded request timings.
  const total = newBucket();
  for (const name of labels) {
    const b = byLabel.get(name);
    total.samples += b.samples;
    total.sum += b.sum;
    total.sumSq += b.sumSq;
    total.min = Math.min(total.min, b.min);
    total.max = Math.max(total.max, b.max);
    total.failed += b.failed;
    total.recv += b.recv;
    total.sent += b.sent;
  }

  return {
    perLabel,
    total: finalize('TOTAL', total),
    meta: {
      elapsedSec: round(elapsedSec),
      maxVus,
      iterations,
      startedAt: Number.isFinite(minTs) ? new Date(minTs * 1000) : null
    }
  };
}

// ---- output: CSV -----------------------------------------------------------

const COLUMNS = [
  ['label', 'Label'],
  ['samples', '# Samples'],
  ['average', 'Average'],
  ['min', 'Min'],
  ['max', 'Max'],
  ['stddev', 'Std. Dev.'],
  ['errorPct', 'Error %'],
  ['throughput', 'Throughput'],
  ['recvKbSec', 'Received KB/sec'],
  ['sentKbSec', 'Sent KB/sec'],
  ['avgBytes', 'Avg. Bytes']
];

function toCsvValue(key, row) {
  if (key === 'errorPct') return `${row[key].toFixed(2)}%`;
  const v = row[key];
  if (typeof v === 'string' && v.includes(',')) return `"${v}"`;
  return v;
}

function writeCsv(outPath, result) {
  const head = COLUMNS.map(([, label]) => label).join(',');
  const body = result.perLabel
    .map((row) => COLUMNS.map(([key]) => toCsvValue(key, row)).join(','))
    .join('\n');
  const totalLine = COLUMNS.map(([key]) => toCsvValue(key, result.total)).join(',');
  fs.writeFileSync(outPath, `${head}\n${body}\n${totalLine}\n`, 'utf8');
}

// ---- output: HTML ----------------------------------------------------------

function fmt(key, row) {
  if (key === 'errorPct') return `${row[key].toFixed(2)}%`;
  if (key === 'label') return row[key];
  return typeof row[key] === 'number' ? row[key].toLocaleString('en-US') : row[key];
}

function writeHtml(outPath, result, sourceName) {
  const { meta } = result;
  const bodyRows = result.perLabel
    .map(
      (row) =>
        '<tr>' +
        COLUMNS.map(([key], i) => {
          const cls = i === 0 ? ' class="label"' : '';
          const err = key === 'errorPct' && row.errorPct > 0 ? ' style="color:#c0392b"' : '';
          return `<td${cls}${err}>${fmt(key, row)}</td>`;
        }).join('') +
        '</tr>'
    )
    .join('\n');

  const totalRow =
    '<tr class="total">' +
    COLUMNS.map(([key]) => `<td>${fmt(key, result.total)}</td>`).join('') +
    '</tr>';

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>k6 Aggregate Report - ${sourceName}</title>
<style>
  :root { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
  body { margin: 24px; color: #1f2933; background: #f7f8fa; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
  table { border-collapse: collapse; width: 100%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.08); font-size: 13px; }
  th, td { border: 1px solid #e5e7eb; padding: 7px 10px; text-align: right; white-space: nowrap; }
  th { background: #2563eb; color: #fff; font-weight: 600; position: sticky; top: 0; }
  td.label, th:first-child { text-align: left; }
  tbody tr:nth-child(even) { background: #f9fafb; }
  tr.total td { font-weight: 700; background: #eef2ff; border-top: 2px solid #2563eb; }
  .config { display: inline-block; margin-top: 22px; border: 1px solid #cbd5e1; background: #fff; padding: 14px 22px; text-align: center; line-height: 1.7; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
  .config b { display: block; margin-bottom: 6px; color: #2563eb; }
</style>
</head>
<body>
  <h1>k6 Aggregate Report</h1>
  <div class="sub">Source: ${sourceName} &nbsp;•&nbsp; generated ${new Date().toLocaleString()}</div>
  <table>
    <thead>
      <tr>${COLUMNS.map(([, label]) => `<th>${label}</th>`).join('')}</tr>
    </thead>
    <tbody>
${bodyRows}
${totalRow}
    </tbody>
  </table>

  <div class="config">
    <b>Test Configuration</b>
    Virtual Users (peak): ${meta.maxVus}<br />
    Iterations: ${meta.iterations.toLocaleString('en-US')}<br />
    Duration: ${meta.elapsedSec}sec<br />
    ${meta.startedAt ? `Started: ${meta.startedAt.toLocaleString()}` : ''}
  </div>
</body>
</html>`;

  fs.writeFileSync(outPath, html, 'utf8');
}

// ---- console table ---------------------------------------------------------

function printConsole(result) {
  const table = result.perLabel.concat([result.total]).map((r) => ({
    Label: r.label,
    '# Samples': r.samples,
    Average: r.average,
    Min: r.min,
    Max: r.max,
    'Std. Dev.': r.stddev,
    'Error %': `${r.errorPct.toFixed(2)}%`,
    Throughput: r.throughput,
    'Recv KB/s': r.recvKbSec,
    'Sent KB/s': r.sentKbSec,
    'Avg. Bytes': r.avgBytes
  }));
  console.table(table);
}

// ---- main ------------------------------------------------------------------

function main() {
  const arg = process.argv[2];
  const csvPath = resolveCsvPath(arg);
  const rows = parseCsv(csvPath);
  const result = aggregate(rows);

  if (result.perLabel.length === 0) {
    console.warn(
      `[aggregate] No HTTP request samples found in ${path.basename(csvPath)}.\n` +
        '[aggregate] (The browser scenario has no protocol-level http_req_* metrics, ' +
        'so there is nothing to aggregate - this is expected for "browser" runs.)'
    );
    return;
  }

  const base = csvPath.replace(/\.csv$/i, '');
  const outCsv = `${base}-aggregate.csv`;
  const outHtml = `${base}-aggregate.html`;

  writeCsv(outCsv, result);
  writeHtml(outHtml, result, path.basename(csvPath));

  printConsole(result);
  console.log(`\n[aggregate] JMeter-style report written:`);
  console.log(`  CSV:  ${outCsv}`);
  console.log(`  HTML: ${outHtml}`);
}

// Exported so k6/run.js can generate the report automatically after each run.
module.exports = { resolveCsvPath, parseCsv, aggregate, writeCsv, writeHtml };

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`[aggregate] ${err.message}`);
    process.exit(1);
  }
}
