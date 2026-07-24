// k6/scenarios/load-test.js
//
// Ramping load profile against both the API and frontend routes, covering
// the same real endpoint list as api-smoke.js, to catch performance
// regressions under sustained/increasing traffic across the whole surface.
//
// Run directly:
//   k6 run k6/scenarios/load-test.js
//
// Run as part of the full suite:
//   npm run k6:load

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { ENDPOINTS, FRONTEND_ROUTES, DEFAULT_THRESHOLDS, recordBytes } from '../lib/config.js';

export const options = {
  scenarios: {
    ramping_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 25 },
        { duration: '30s', target: 0 }
      ],
      gracefulRampDown: '10s'
    }
  },
  thresholds: DEFAULT_THRESHOLDS
};

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
        [`${endpoint.name} - reachable`]: (r) => r.status === 200 || r.status === 404
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
        [`${route.name} - reachable`]: (r) => [200, 301, 302, 304, 404].includes(r.status)
      });
    }
  });

  sleep(Math.random() * 2);
}
