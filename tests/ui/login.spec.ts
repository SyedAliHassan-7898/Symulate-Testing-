import { test } from '@core';

test('Super Admin Login', async ({ page, homePage }) => {
  await page.goto('/');
  await homePage.verifyHomePage();
});
