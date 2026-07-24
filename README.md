# Symulate Enterprise Test Framework

Enterprise-grade automated testing framework for **Symulate**, covering UI
end-to-end flows, API checks, and load/performance testing — built with
[Playwright](https://playwright.dev) (TypeScript) and [k6](https://k6.io).

Playwright and k6 are **entirely separate test suites** with separate
commands - Playwright checks correctness (does the UI/flow work), k6 checks
performance (does it hold up under load). Run either independently, or
both together.

## Project structure

```
├── src/            # Page Objects, fixtures, config, helpers, utils
├── tests/          # Playwright specs (UI, API, business flows)
├── k6/
│   ├── lib/config.js           # ENDPOINTS / FRONTEND_ROUTES / thresholds - the load-test coverage list
│   ├── run.js                    # wrapper: CSV/log/summary/HTML report + optional Grafana/Cloud output
│   └── scenarios/
│       ├── api-smoke.js           # fast API + frontend-route check
│       ├── load-test.js           # ramping-VU load test, same routes
│       └── browser-login.js       # headless-Chromium real-browser scenario
├── docker/
│   ├── Dockerfile                 # containerized runner: Playwright + k6 preinstalled
│   ├── docker-compose.yml          # Grafana + InfluxDB + optional containerized runner
│   └── grafana/                     # dashboard + datasource provisioning
├── docs/           # SETUP, ARCHITECTURE, TESTING, K6, GRAFANA, DOCKER, TROUBLESHOOTING
├── .github/workflows/deploy-tests.yml   # runs both suites, separately, on every deployment
├── playwright.config.ts
└── package.json
```

## Getting started

```bash
npm install
npx playwright install --with-deps chromium
```
Configure `.env` (`BASE_URL`, `API_URL`, credentials, `HEADLESS`).

## Running Playwright (correctness)

```bash
npm test              # default: tests/tests/create-task.spec.ts
npm run test:client / test:project / test:task / test:interview / test:login / test:board
npm run test:all:full   # the ENTIRE Playwright suite, every spec
npm run headed / debug / ui
npm run report          # open the last HTML report
```

Or target anything directly:
```bash
npx playwright test tests/tests/create-client.spec.ts
npx playwright test -g "Create all task types"
npx playwright test tests/tests/create-task.spec.ts:19
```

`HEADLESS` in `.env` controls headed/headless locally; CI always forces
`HEADLESS=true`.

## Running k6 (performance) - separately from Playwright

```bash
npm run k6:smoke     # API + UI routes, fast pass (~30s)
npm run k6:load      # same routes, ramping load (~2 min)
npm run k6:browser   # headless-Chromium real-browser flow
npm run k6:all       # all three k6 scenarios
```

Every run writes a CSV, a log, a JSON summary, and k6's own built-in HTML
report to `k6/results/` - open the `.html` file directly, no setup needed.
See [`docs/K6.md`](docs/K6.md) for the full endpoint coverage list and
report details.

### Live Grafana dashboard (optional)

```bash
npm run grafana:up             # local Docker stack
npm run k6:smoke:grafana        # or :load:grafana / :browser:grafana / :all:grafana
# open http://localhost:3000
```
Or hosted, no Docker: `k6 login cloud` then `npm run k6:smoke:cloud`. Full
details, including the datasource/dashboard provisioning, in
[`docs/GRAFANA.md`](docs/GRAFANA.md).

## Running BOTH suites together

```bash
npm run test:all      # entire Playwright suite (headless) + entire k6 suite
```

## Running everything inside Docker (no host Node/Chromium/k6 needed)

If your machine struggles with memory running Chromium + k6 natively:
```bash
npm run docker:build
npm run docker:test
```
Runs the full Playwright suite + full k6 suite inside an isolated
container - see [`docs/DOCKER.md`](docs/DOCKER.md).

## CI - runs on every deployment

`.github/workflows/deploy-tests.yml` runs the entire Playwright suite and
the entire k6 suite as two **separate, parallel** jobs on every push to
`main` / successful deployment, uploading both as build artifacts.
Repository secrets needed: `BASE_URL`, `API_URL`, `SUPER_ADMIN_EMAIL`,
`SUPER_ADMIN_PASSWORD`.

## Further reading

- [`docs/SETUP.md`](docs/SETUP.md) · [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/TESTING.md`](docs/TESTING.md)
- [`docs/K6.md`](docs/K6.md) · [`docs/GRAFANA.md`](docs/GRAFANA.md) · [`docs/DOCKER.md`](docs/DOCKER.md)
- [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)
# Symulate-Testing-
