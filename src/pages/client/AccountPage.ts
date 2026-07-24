import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "@core";

export class AccountPage extends BasePage {
  readonly accountsLink: Locator;
  readonly createAccountButton: Locator;
  readonly accountNameInput: Locator;
  readonly createButton: Locator;

  constructor(page: Page) {
    super(page);

    this.accountsLink = page.getByRole("link", { name: /accounts/i }).first();
    this.createAccountButton = page.getByRole("button", { name: "Create Account" });
    this.accountNameInput = page.getByRole("textbox", { name: "Account Name *" });
    this.createButton = page.getByRole("button", { name: "Create", exact: true });
  }

  async navigateToAccounts(): Promise<void> {
    await expect(this.accountsLink).toBeVisible({ timeout: 10000 });
    await this.accountsLink.click();
    await this.page.waitForLoadState("networkidle");
  }

  async createAccount(name: string): Promise<void> {
    await this.navigateToAccounts();
    console.log("Navigated to accounts");
    console.log(this.page.url());
   

    await expect(this.createAccountButton).toBeVisible({ timeout: 10000 });
    await this.createAccountButton.click();

    await expect(this.accountNameInput).toBeVisible({ timeout: 10000 });
    await this.accountNameInput.fill(name);

    await expect(this.createButton).toBeVisible({ timeout: 10000 });
    await this.createButton.click();
    console.log("Clicked create button, waiting for dialog to close and cell to appear");

    // Wait for dialog to disappear if it is present
    const dialog = this.page.getByRole("dialog");
    await expect(dialog).toBeHidden({ timeout: 10000 });

    // Verify the newly created account is visible in the list
    await expect(
      this.page.getByRole("cell", { name: name, exact: false }).first()
    ).toBeVisible({ timeout: 10000 });

    console.log("Created account successfully verified:", name);
    console.log(this.page.url());

    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(1000);
  }
}
