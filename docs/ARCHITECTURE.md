# Architecture

## Two independent test layers

- **Playwright** (`tests/`, `src/`) - correctness: does the UI/flow actually work.
- **k6** (`k6/`) - performance: does it hold up under load. Entirely
  separate tooling, config, and commands - see [`README.md`](../README.md)
  for how they're run together or apart.

## Playwright layer

```
src/
├── core/          BasePage, BaseComponent, and the shared `test`/`expect`
│                   re-export (src/core/BaseFixture.ts) that every spec
│                   imports via the `@core` path alias
├── fixtures/       Playwright fixtures: auth, client, api
├── pages/          Page Object Model - one class per screen/flow
├── config/         environment.ts, credentials.ts, urls.ts, constants.ts
│                   (all read from `.env`)
├── data/           Test data / factories (e.g. TaskFactory)
├── helpers/        Cross-cutting flows (e.g. LoginHelper)
└── utils/          Logger, waits, retries, screenshots, file/date helpers

tests/
├── auth/           login.setup.ts - the `setup` project, runs once,
│                   stores session in playwright/.auth/user.json
├── tests/          Business-flow specs (client, project, task, interview)
└── ui/             UI-focused specs (login, board-meeting persona)
```

**Auth flow:** `login.setup.ts` runs as Playwright's `setup` project (see
`playwright.config.ts` → `projects`), logs in once, and every spec in the
`chromium` project depends on that setup and reuses the stored session -
specs don't each pay the cost of logging in.

**Page Object Model:** every screen has a class extending `BasePage`
(`src/core/BasePage.ts`), centralizing waits/clicks/fills/assertions.
Watch for **class name collisions across folders** - e.g. there are two
different `ProjectPage` classes (`src/pages/project/ProjectPage.ts` and
`src/pages/client/ProjectPage.ts`) with different constructors and method
signatures. Specs must import the one matching the `.create(...)` call
they make; a mismatch produces a runtime `TypeError: ... is not a
function` that TypeScript won't always catch if both classes happen to
share a method name with different signatures. When adding a new Page
Object, prefer a name that doesn't collide with an existing one elsewhere
in `src/pages/`.

## k6 layer

```
k6/
├── lib/config.js       ENDPOINTS / FRONTEND_ROUTES / thresholds - the
│                         single source of truth for what gets load-tested
├── run.js                CLI wrapper: CSV/log/summary/HTML report +
│                         optional Grafana/Cloud output (see docs/K6.md)
└── scenarios/
    ├── api-smoke.js        fast pass over ENDPOINTS + FRONTEND_ROUTES
    ├── load-test.js         same routes, ramping load
    └── browser-login.js      real headless-Chromium flow (k6/browser)
```

## Docker layer

```
docker/
├── Dockerfile              Playwright + k6 preinstalled, containerized runner
├── docker-compose.yml        influxdb + grafana + (profile) runner
└── grafana/
    ├── provisioning/           datasource + dashboard-provider config
    └── dashboards/               the actual dashboard JSON
```

See [`docs/DOCKER.md`](DOCKER.md) and [`docs/GRAFANA.md`](GRAFANA.md).

## CI

`.github/workflows/deploy-tests.yml` runs the entire Playwright suite and
the entire k6 suite as two separate, parallel jobs on every push to `main`
/ successful deployment.
