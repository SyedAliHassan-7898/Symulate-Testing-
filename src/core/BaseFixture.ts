import { test as base, expect, Page } from '@playwright/test';

import LoginPage from '@pages/auth/LoginPage';
import HomePage from '@pages/home/HomePage';

type PageFixtures = {
  page: Page;
  loginPage: LoginPage;
  homePage: HomePage;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  }
});

export { expect };