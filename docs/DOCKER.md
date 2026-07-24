# Docker

`docker/docker-compose.yml` defines three things:

| Service | Purpose |
|---|---|
| `influxdb` | Stores k6 metrics for the live Grafana dashboard |
| `grafana` | Pre-provisioned dashboard reading from InfluxDB - see [`docs/GRAFANA.md`](GRAFANA.md) |
| `runner` | Runs the **entire test suite** (Playwright, all specs, headless + full k6 suite) inside a container, built from `docker/Dockerfile` |

## Monitoring stack (Grafana + InfluxDB)

```bash
npm run grafana:up      # start
npm run grafana:down    # stop
npm run grafana:logs    # follow logs
```

## Containerized test runner

Runs everything - Playwright (all specs) then the full k6 suite - inside a
container with Node, Chromium, and k6 all preinstalled. Useful if the host
machine struggles to run these natively (low RAM, unstable local Docker
Desktop causing Node/Chromium OOM crashes, etc.) - the container gets its
own clean, predictable memory space independent of the host.

```bash
npm run docker:build    # build the runner image (docker/Dockerfile)
npm run docker:test     # run it - executes `npm run test:all:full` by default
```

To run just one part instead of everything:

```bash
docker compose -f docker/docker-compose.yml --profile runner run --rm runner npm run k6:all
docker compose -f docker/docker-compose.yml --profile runner run --rm runner npm run test:all:full
```

Environment variables (`BASE_URL`, `API_URL`, `SUPER_ADMIN_EMAIL`,
`SUPER_ADMIN_PASSWORD`) are read from your shell/`.env` and passed through
automatically (see the `runner` service's `environment:` block).

Results land on the host via mounted volumes: `reports/`, `test-results/`,
`k6/results/` - so you can open the HTML reports normally after the
container exits.
