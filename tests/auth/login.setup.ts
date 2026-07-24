import fs from 'fs';
import path from 'path';

import { test as setup } from '@playwright/test';
import { Environment } from '@config/environment';
import LoginHelper from '@helpers/LoginHelper';
import { Urls } from '@config/urls';
console.log(Environment.baseUrl)
const authFile = path.resolve('playwright/.auth/user.json');

setup('Authenticate Super Admin', async ({ browser, page }) => {
  if (fs.existsSync(authFile)) {
    const context = await browser.newContext({
      baseURL: Environment.baseUrl,
      storageState: authFile
    });
    const cachedPage = await context.newPage();

    await cachedPage.goto(Urls.home);

    const hasAuthenticatedShell = await cachedPage
      .getByRole('link', { name: /clients|tasks/i })
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (!/\/login(?:\?|$)/.test(cachedPage.url()) && hasAuthenticatedShell) {
      await context.close();
      return;
    }

    await context.close();
  }

  await LoginHelper.login(page);

  await page.context().storageState({
    path: authFile
  });
});
