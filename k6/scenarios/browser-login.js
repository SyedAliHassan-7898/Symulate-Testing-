// k6/scenarios/browser-login.js
//
// Real-browser (Chromium via k6/browser) load test of the login -> dashboard
// flow. This exercises actual frontend rendering/JS, not just the HTTP
// requests, which is why it's driven through the browser module rather than
// plain http.js. Runs headless (see k6/lib/config.js HEADLESS).
//
// Run directly:
//   k6 run k6/scenarios/browser-login.js
//
// Run as part of the full suite:
//   npm run k6:browser

import { browser } from 'k6/browser';
import { check } from 'k6';
import { BASE_URL, CREDENTIALS, HEADLESS } from '../lib/config.js';

export const options = {
  scenarios: {
    ui_login: {
      executor: 'shared-iterations',
      vus: Number(__ENV.K6_BROWSER_VUS) || 3,
      iterations: Number(__ENV.K6_BROWSER_ITERATIONS) || 6,
      maxDuration: '5m',
      options: {
        browser: {
          type: 'chromium'
        }
      }
    }
  },
  thresholds: {
    checks: ['rate>0.95'],
    browser_http_req_duration: ['p(95)<3000']
  }
};

export default async function () {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

    const emailInput = page.locator(
      'input[type="email"], input[name*="email" i], [role="textbox"][aria-label*="email" i]'
    );
    const passwordInput = page.locator(
      'input[type="password"], input[name*="password" i]'
    );
    const loginButton = page.locator('button:has-text("Login"), button[type="submit"]');

    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.fill(CREDENTIALS.email);
    await passwordInput.fill(CREDENTIALS.password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }),
      loginButton.click()
    ]);

    const url = page.url();

    check(url, {
      'redirected away from /login': (u) => !/\/login(?:\?|$)/.test(u)
    });

    const heading = page.locator('h1, h2, [role="heading"]').first();
    const headingVisible = await heading.isVisible().catch(() => false);

    check(headingVisible, {
      'dashboard heading rendered': (v) => v === true
    });
  } finally {
    await page.close();
    await context.close();
  }
}

// Surface the effective headless mode once per run for CI logs.
export function setup() {
  console.log(`[k6/browser] running against ${BASE_URL} (headless=${HEADLESS})`);
}
