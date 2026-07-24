# Grafana Monitoring Dashboard (k6 live metrics)

Two ways to get a live/visual Grafana dashboard for k6 results, both
optional - every `npm run k6:*` script (no suffix) works standalone with
zero setup, producing CSV/log/summary/HTML report on its own.

---

## Option 1: Grafana Cloud k6 (hosted, no Docker)

Best if you don't want to run Docker locally at all.

1. Sign up free: https://grafana.com/auth/sign-up/create-user
2. Get a token: https://app.k6.io/account/api-token
3. One-time login: `k6 login cloud`

Then:
```bash
npm run k6:smoke:cloud
npm run k6:load:cloud
npm run k6:browser:cloud
npm run k6:all:cloud
```
k6 prints a live dashboard URL (`https://app.k6.io/runs/...`) directly in
the terminal.

---

## Option 2: Local Grafana + InfluxDB (Docker)

```bash
npm run grafana:up
```
Starts InfluxDB (`localhost:8086`) and Grafana (`localhost:3000`),
pre-provisioned with:
- a datasource pinned to `uid: k6-influxdb` (`docker/grafana/provisioning/datasources/influxdb.yml`)
- a dashboard, **"Symulate - k6 Load & Performance Testing"**, whose panels
  reference that exact same `uid` (`docker/grafana/dashboards/k6-load-testing.json`)

> Both the datasource and every dashboard panel must reference the *same*
> `uid` or Grafana shows "datasource not found" and the dashboard appears
> empty/broken even though the stack is running. This is provisioned
> correctly out of the box in this repo - if you ever edit the datasource
> config, keep the `uid: k6-influxdb` line intact.

Run with live output:
```bash
npm run k6:smoke:grafana
npm run k6:load:grafana
npm run k6:browser:grafana
npm run k6:all:grafana
```
Refresh http://localhost:3000 while a run is in progress to watch it live.

### What the dashboard shows

| Panel | What it is |
|---|---|
| Virtual Users (VUs) | Active VUs over time |
| Request Rate | Requests/sec |
| Error Rate | `http_req_failed` rate |
| Response Time by Endpoint (p95) | Grouped by the real hit URL/name tag |
| Hit URLs table | Every real URL hit, with request count and avg duration |
| Browser Scenario - Real-Page Load Time | From the headless-Chromium scenario |
| Checks - Pass vs Fail | Check pass/fail counts over time |

### If Grafana isn't running

`k6/run.js` does a quick reachability check before adding Grafana output.
If InfluxDB isn't reachable, it warns and continues normally - CSV, log,
summary, and the built-in k6 HTML report are still produced. Grafana never
blocks a test from passing or failing.

### Stopping / resetting

```bash
npm run grafana:down                                    # stop, keep data
docker compose -f docker/docker-compose.yml down -v      # stop, wipe data
```

### Adding more endpoints to the dashboard

Add routes to `ENDPOINTS`/`FRONTEND_ROUTES` in `k6/lib/config.js` - the
dashboard's per-URL panels and table pick them up automatically, no
dashboard changes needed.
