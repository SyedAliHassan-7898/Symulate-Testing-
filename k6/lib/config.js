// k6/lib/config.js
// Central place to read environment configuration for all k6 scripts.
// Values fall back to the same defaults used by the Playwright suite (see .env).

import { Counter } from 'k6/metrics';

export const BASE_URL = __ENV.BASE_URL || 'https://superadmin.symulate-dev.weuno.co';
export const API_URL = __ENV.API_URL || 'https://api.symulate.weuno.co/dev';

export const CREDENTIALS = {
  email: __ENV.SUPER_ADMIN_EMAIL || 'superadmin@yopmail.com',
  password: __ENV.SUPER_ADMIN_PASSWORD || 'Test@123'
};

// k6/browser always drives a real (Chromium) browser. HEADLESS=true is the
// default for CI/deployment runs; set HEADLESS=false locally if you want to
// watch the browser while debugging a scenario.
export const HEADLESS = (__ENV.HEADLESS || 'true') !== 'false';

// Shared thresholds so every scenario fails the build consistently when the
// app regresses, instead of every script inventing its own budget.
export const DEFAULT_THRESHOLDS = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<1500'],
  checks: ['rate>0.99']
};

// Real endpoints the API scenarios hit. Each entry's `name` becomes the k6
// metric tag, so both the HTML report and the Grafana dashboard show
// per-endpoint rows instead of one lumped-together bucket.
//
// This list mirrors the app's actual routes (see src/config/urls.ts on the
// Playwright side) so the load test gives meaningful coverage of the real
// surface area, not just a single health check.
export const ENDPOINTS = [
  { name: 'API - GET /health', method: 'GET', url: `${API_URL}/health` }
  // Add real backend routes as they become available, e.g.:
  // { name: 'API - GET /organizations', method: 'GET', url: `${API_URL}/organizations` },
  // { name: 'API - GET /projects', method: 'GET', url: `${API_URL}/projects` },
  // { name: 'API - GET /simulations/task', method: 'GET', url: `${API_URL}/simulations/task` },
];

// Real frontend routes the app serves (mirrors src/config/urls.ts). Hitting
// these with plain HTTP GETs is a lightweight way to load-test page
// delivery/routing without a full browser - complements the heavier,
// real-Chromium browser-login.js scenario.
export const FRONTEND_ROUTES = [
  { name: 'UI - GET /', url: `${BASE_URL}/` },
  { name: 'UI - GET /login', url: `${BASE_URL}/login` },
  { name: 'UI - GET /organizations', url: `${BASE_URL}/organizations` },
  { name: 'UI - GET /projects', url: `${BASE_URL}/projects` },
  { name: 'UI - GET /simulations/task', url: `${BASE_URL}/simulations/task` }
];

// Per-endpoint byte counters. k6's built-in data_received/data_sent metrics
// are network-level and are NOT tagged with the request `name`, so they can't
// give a per-endpoint bytes breakdown. These custom counters are incremented
// after every request WITH the { name } tag, which lets the JMeter-style
// aggregate report (k6/report/aggregate-report.js) compute per-row
// "Received KB/sec", "Sent KB/sec" and "Avg. Bytes" from the raw CSV.
export const recvBytes = new Counter('recv_bytes');
export const sentBytes = new Counter('sent_bytes');

// Records the response/request size of a single k6 http response against the
// per-endpoint byte counters, tagged with the endpoint name so the aggregate
// report can break bytes down per row. Safe to call for every request.
export function recordBytes(res, name) {
  const received = res && res.body ? res.body.length : 0;
  const sent = res && res.request && res.request.body ? res.request.body.length : 0;
  recvBytes.add(received, { name });
  sentBytes.add(sent, { name });
}
