import { Page } from '@playwright/test';
import LoginPage from '@pages/auth/LoginPage';

export default class LoginHelper {
  static async login(page: Page): Promise<void> {
    const loginPage = new LoginPage(page);

    await loginPage.loginAsSuperAdmin();
  }
}