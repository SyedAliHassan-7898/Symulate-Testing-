import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',

  timeout: Number(process.env.TIMEOUT) || 120000,

  expect: {
    timeout: 10000
  },

  retries: 1,

  fullyParallel: false,

  workers: Number(process.env.WORKERS) || 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }]
  ],

  use: {
    baseURL: process.env.BASE_URL,

    browserName: 'chromium',

    headless: process.env.HEADLESS === 'false',
    

    viewport: {
      width: 1366,
      height: 768
    },

    screenshot: 'only-on-failure',

    video: 'retain-on-failure',

    trace: 'retain-on-failure',

    // Reduces Chromium's memory footprint - helps avoid the
    // VirtualAlloc/"Zone Allocation failed" OOM crashes seen on
    // memory-constrained machines (especially Windows). Safe no-ops on
    // Linux/CI where they're less critical.
    launchOptions: {
      args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions']
    }
  },

  projects: [
    {
      name: 'setup',

      testMatch: /.*login\.setup\.ts/
    },

    {
      name: 'chromium',

      use: {
        ...devices['Desktop Chrome'],

        storageState: 'playwright/.auth/user.json'
      },

      dependencies: ['setup']
    }
  ]
});
