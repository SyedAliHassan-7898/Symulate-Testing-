# Troubleshooting

## Playwright: `FATAL ERROR: Zone Allocation failed - process out of memory` / `VirtualAlloc failed`

This is a Windows/Node/Chromium memory exhaustion, not a project bug.
Common causes, in order of likelihood:

1. **Running headed for a long/full-suite run.** `npm run test:all:full`
   and `npm run test:all` force `HEADLESS=true` for this reason - headed
   mode uses substantially more memory per browser instance. If you're
   invoking `playwright test` directly without one of those scripts,
   headed mode (whatever `.env` → `HEADLESS` is set to) applies.
2. **Docker Desktop / WSL2 still holding memory** from a previous session
   (especially after a crashed `docker compose` pull). Run `wsl --shutdown`,
   fully quit Docker Desktop, and check:
   ```bash
   systeminfo | findstr /C:"Available Physical Memory"
   ```
   You want several GB free before running tests.
3. **Orphaned processes** from a previous crashed run:
   ```bash
   taskkill /F /IM node.exe
   taskkill /F /IM chrome.exe
   ```
4. **Low overall RAM / small pagefile.** Check Available Physical Memory
   as above; if consistently low, consider running the suite inside Docker
   instead (see [`docs/DOCKER.md`](DOCKER.md)) - the container gets its
   own isolated memory space.
5. If none of the above helps, **reboot** - this reliably clears stuck
   WSL2/Docker memory that doesn't release on its own.

## `TypeError: <pageObject>.<method> is not a function`

The spec is calling a method that doesn't exist on the imported Page
Object class - usually a rename, or importing the wrong same-named class
from a different folder (see
[`docs/ARCHITECTURE.md`](ARCHITECTURE.md#page-object-model)). Confirm the
actual method and its signature:
```bash
grep -n "async " src/pages/.../ThatPage.ts
```
and update the call site to match.

## Docker: env vars show as blank (`"BASE_URL" variable is not set`)

`docker compose -f docker/docker-compose.yml ...` looks for `.env` next to
the compose file by default, not your project root. All npm scripts
(`grafana:up`, `docker:test`, etc.) already pass `--env-file .env` to fix
this - if you're invoking `docker compose` manually, add that flag too.

## Docker: `error during connect ... dockerDesktopLinuxEngine`

Docker Desktop isn't running. Open it from the Start menu and wait for it
to report "running" before retrying.

## Docker: `unexpected EOF` / stalls mid-pull

A dropped connection to the registry (flaky network/VPN/proxy), not a
config problem. Just retry - Docker resumes from the last completed
layer. If it keeps failing at the same layer, try capping concurrent
downloads:
```json
// Docker Desktop -> Settings -> Docker Engine
"max-concurrent-downloads": 1
```

## Grafana dashboard shows "datasource not found" / panels empty

The dashboard JSON pins `datasource: { uid: "k6-influxdb" }` on every
panel; the datasource provisioning file must declare that exact same
`uid`. This repo's `docker/grafana/provisioning/datasources/influxdb.yml`
already does - if you ever edit or replace that file, keep the
`uid: k6-influxdb` line intact, or every panel breaks silently.

## k6 threshold `http_req_failed` fails even though checks pass

k6's `http_req_failed` metric only counts `2xx`/`3xx` as success by
default. If an endpoint legitimately returns e.g. `404` or a redirect,
declare it expected via `http.expectedStatuses(...)` and pass it as
`responseCallback` on the request - already done in
`k6/scenarios/api-smoke.js` / `load-test.js` for the routes currently
covered. Extend it the same way for any new route you add that doesn't
answer with a plain `2xx`.

## k6 load test shows failures the smoke test doesn't

This usually isn't a test bug - it means the backend degrades under
concurrent load, which is exactly what the load test is designed to
catch. Check backend/API logs around the failure timestamps rather than
the test script.
