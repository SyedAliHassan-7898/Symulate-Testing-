import { expect, Locator, Page } from "@playwright/test";

import { Urls } from "@config";
import { BasePage } from "@core";

export class ClientPage extends BasePage {
  readonly clientsMenu: Locator;
  readonly createClientButton: Locator;
  readonly pageHeading: Locator;

  constructor(page: Page) {
    super(page);

    this.clientsMenu = page.getByRole("link", {
      name: "Clients",
      exact: true,
    });

    this.createClientButton = page.getByRole("button", {
      name: "Create Client",
    });

    this.pageHeading = page.getByRole("heading", {
      name: "Clients",
    });
  }

  /**
   * Navigate to Clients page
   */
  async open(): Promise<void> {
    await this.goto(Urls.clients);

    await expect(this.pageHeading).toBeVisible();
  }

  /**
   * Click Create Client button
   */
  async clickCreateClient(): Promise<void> {
    await this.createClientButton.click();
  }

  /**
   * Verify Clients page is loaded
   */
  async verifyLoaded(): Promise<void> {
    await expect(this.pageHeading).toBeVisible();

    await expect(this.createClientButton).toBeVisible();
  }

  async enableIntelligenceForClient(clientName: string): Promise<void> {
    await this.open();

    const clientRow = await this.findClientRow(clientName);

    const intelligenceToggle = clientRow
      .locator('button, [role="switch"], input[type="checkbox"]')
      .filter({ hasText: /intelligence/i })
      .first();

    if (await intelligenceToggle.count()) {
      const isChecked = await intelligenceToggle
        .getAttribute("aria-checked")
        .catch(() => null);
      if (isChecked !== "true") {
        await intelligenceToggle.click();
      }
      return;
    }

    const fallbackToggle = clientRow
      .locator('button, [role="switch"], input[type="checkbox"]')
      .first();
    if (await fallbackToggle.count()) {
      const isChecked = await fallbackToggle
        .getAttribute("aria-checked")
        .catch(() => null);
      if (isChecked !== "true") {
        await fallbackToggle.click();
      }
    }

    await this.page.waitForTimeout(1000);
  }

  async impersonateClient(clientName: string): Promise<Page> {
    await this.open();

    const clientRow = await this.findClientRow(clientName);

    const pagePromise = this.page.waitForEvent("popup", { timeout: 15000 }).catch(() => null);

    const clientButton = this.page.getByRole("button", { name: new RegExp(clientName, "i") }).first();
    
    if (await clientButton.isVisible().catch(() => false)) {
      await clientButton.click();
    } else {
      const impersonateAction = clientRow
        .locator('button, a, [role="button"]')
        .first();
      await impersonateAction.click();
    }

    const newPage = await pagePromise;
    if (!newPage) {
       throw new Error("Popup for client impersonation did not open.");
    }
    
    await newPage.waitForLoadState("networkidle");
    await newPage.waitForTimeout(1500);
    return newPage;
  }

  private async findClientRow(clientName: string): Promise<Locator> {
    const rowCandidates = [
      this.page.locator("table tbody tr").filter({ hasText: clientName }),
      this.page.locator("tbody tr").filter({ hasText: clientName }),
      this.page.locator("tr").filter({ hasText: clientName }),
      this.page.locator("li").filter({ hasText: clientName }),
      this.page
        .locator("div")
        .filter({ hasText: clientName })
        .filter({ has: this.page.locator("button, a") }),
    ];

    for (const row of rowCandidates) {
      if (await row.count()) {
        const firstRow = row.first();
        if (await firstRow.isVisible().catch(() => false)) {
          return firstRow;
        }
      }
    }

    return this.page.locator("body").first();
  }
}
