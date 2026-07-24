import { Locator, Page } from '@playwright/test';
import { BasePage } from '@core/BasePage';

export class HomePage extends BasePage {
  // =========================================================
  // Locators
  // =========================================================

  readonly dashboardHeading: Locator;
  readonly profileMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);

    // Update these locators if UI changes
    this.dashboardHeading = page.getByRole('heading').first();

    this.profileMenu = page.locator('[data-testid="profile-menu"]');

    this.logoutButton = page.getByRole('menuitem', {
      name: /logout/i
    });
  }

  // =========================================================
  // Verification
  // =========================================================

  async verifyHomePage(): Promise<void> {
    await this.waitForPageLoad();
    await this.expectVisible(this.dashboardHeading);
  }

  // =========================================================
  // Actions
  // =========================================================

  async openProfileMenu(): Promise<void> {
    await this.click(this.profileMenu);
  }

  async logout(): Promise<void> {
    await this.openProfileMenu();
    await this.click(this.logoutButton);
    await this.waitForPageLoad();
  }

  // =========================================================
  // Generic Navigation
  // =========================================================

  async navigate(path: string): Promise<void> {
    await this.goto(path);
    await this.waitForPageLoad();
  }
}

export default HomePage;