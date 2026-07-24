import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '@core/BasePage';
import { Credentials } from '@config/credentials';
import { Urls } from '@config/urls';

export class LoginPage extends BasePage {
  // =========================
  // Locators
  // =========================

  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);

    this.emailInput = page.getByRole('textbox', {
      name: /email/i
    });

    this.passwordInput = page.getByRole('textbox', {
      name: /password/i
    });

    this.loginButton = page.getByRole('button', {
      name: /login/i
    });
  }

  // =========================
  // Navigation
  // =========================

  async open(): Promise<void> {
    await this.goto(Urls.login);

    await this.waitForPageLoad();

    await this.expectVisible(this.emailInput);

    await this.expectVisible(this.passwordInput);

    await this.expectVisible(this.loginButton);
  }

  // =========================
  // Actions
  // =========================

  async enterEmail(email: string): Promise<void> {
    await this.fill(this.emailInput, email);
  }

  async enterPassword(password: string): Promise<void> {
    await this.fill(this.passwordInput, password);
  }

  async clickLogin(): Promise<void> {
    await this.click(this.loginButton);
  }

  // =========================
  // Business Methods
  // =========================

  async login(email: string, password: string): Promise<void> {
    await this.open();

    await this.enterEmail(email);

    await this.enterPassword(password);

    await this.clickLogin();

    await this.waitForPageLoad();

    await expect(this.page).not.toHaveURL(/\/login(?:\?|$)/, {
      timeout: 30000
    });
  }

  async loginAsSuperAdmin(): Promise<void> {
    await this.login(
      Credentials.superAdmin.email,
      Credentials.superAdmin.password
    );
  }

  // =========================
  // Verification
  // =========================

  async verifyLoginPage(): Promise<void> {
    await this.expectVisible(this.emailInput);

    await this.expectVisible(this.passwordInput);

    await this.expectVisible(this.loginButton);
  }
}

export default LoginPage;
