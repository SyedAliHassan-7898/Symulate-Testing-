# Setup

## Prerequisites

- Node.js 18+ and npm
- [k6](https://k6.io/docs/get-started/installation/) (separate binary, not an npm package)
- Docker Desktop (optional - only for the local Grafana dashboard or the containerized runner)

## Install

```bash
npm install
npx playwright install --with-deps chromium
```

## Configure `.env`

Copy or edit the root `.env`:

```ini
BASE_URL=https://superadmin.symulate-dev.weuno.co
API_URL=https://api.symulate.weuno.co/dev

BROWSER=chromium
HEADLESS=false
TIMEOUT=60000

SUPER_ADMIN_EMAIL="superadmin@yopmail.com"
SUPER_ADMIN_PASSWORD="Test@123"
```

| Variable | Used by | Notes |
|---|---|---|
| `BASE_URL` | Playwright + k6 (`browser-login.js`, `FRONTEND_ROUTES`) | Frontend origin |
| `API_URL` | k6 (`ENDPOINTS`) | Backend origin |
| `HEADLESS` | Playwright | `false` = watch the browser locally. Full-suite scripts (`test:all`, `test:all:full`) force `true` regardless, to keep memory use down over long runs. |
| `TIMEOUT` | Playwright (`src/config/environment.ts`) | Default per-action timeout; individual specs can override with `test.setTimeout(...)` |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | Playwright auth setup + k6 `browser-login.js` | Shared credentials across both suites |

## Verify the install

```bash
npm run test:login    # fastest smoke check - just logs in and checks the home page
npm run k6:smoke        # fastest k6 check - ~30s
```

If both pass, you're set up correctly. See [`docs/TROUBLESHOOTING.md`](TROUBLESHOOTING.md) if either fails.
