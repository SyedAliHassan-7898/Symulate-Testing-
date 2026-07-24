// k6/scenarios/api-smoke.js
//
// Fast, cheap HTTP-level check of both the API and the frontend routing
// layer. Covers every entry in ENDPOINTS (API) and FRONTEND_ROUTES (UI
// pages), each tagged with its real name/URL so results/report/dashboard
// break down per actual route hit - this is the "test coverage" surface
// for the load-testing side of the suite.
//
// Run directly:
//   k6 run k6/scenarios/api-smoke.js
//
// Run as part of the full suite:
//   npm run k6:smoke

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { ENDPOINTS, FRONTEND_ROUTES, DEFAULT_THRESHOLDS, recordBytes } from '../lib/config.js';

export const options = {
  vus: Number(__ENV.K6_SMOKE_VUS) || 5,
  duration: __ENV.K6_SMOKE_DURATION || '30s',
  thresholds: DEFAULT_THRESHOLDS
};

// k6's http_req_failed metric only treats 2xx/3xx as success by default.
// API health checks may legitimately answer 404; frontend routes may
// legitimately redirect (301/302) to /login when unauthenticated. Declare
// both as expected so the metric reflects real reachability, not an
// artificial mismatch with our own checks below.
const apiExpected = http.expectedStatuses(200, 404);
const uiExpected = http.expectedStatuses(200, 301, 302, 304, 404);

export default function () {
  group('API endpoints', function () {
    for (const endpoint of ENDPOINTS) {
      const res = http.get(endpoint.url, {
        tags: { name: endpoint.name, url: endpoint.url },
        responseCallback: apiExpected
      });
      recordBytes(res, endpoint.name);

      check(res, {
        [`${endpoint.name} - reachable (200/404)`]: (r) => r.status === 200 || r.status === 404,
        [`${endpoint.name} - responded within 1.5s`]: (r) => r.timings.duration < 1500
      });
    }
  });

  group('Frontend routes', function () {
    for (const route of FRONTEND_ROUTES) {
      const res = http.get(route.url, {
        tags: { name: route.name, url: route.url },
        responseCallback: uiExpected
      });
      recordBytes(res, route.name);

      check(res, {
        [`${route.name} - reachable`]: (r) => [200, 301, 302, 304, 404].includes(r.status),
        [`${route.name} - responded within 2s`]: (r) => r.timings.duration < 2000
      });
    }
  });

  sleep(1);
}
