import { expect, Locator, Page } from '@playwright/test';

export class BaseComponent {
  protected readonly page: Page;
  protected readonly root: Locator;

  constructor(page: Page, root: Locator) {
    this.page = page;
    this.root = root;
  }

  // =========================================================
  // Root
  // =========================================================

  getRoot(): Locator {
    return this.root;
  }

  // =========================================================
  // Child Locator
  // =========================================================

  locator(selector: string): Locator {
    return this.root.locator(selector);
  }

  // =========================================================
  // Click
  // =========================================================

  async click(locator: Locator): Promise<void> {
    await locator.waitFor({
      state: 'visible'
    });

    await locator.click();
  }

  // =========================================================
  // Fill
  // =========================================================

  async fill(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({
      state: 'visible'
    });

    await locator.fill(value);
  }

  // =========================================================
  // Hover
  // =========================================================

  async hover(locator: Locator): Promise<void> {
    await locator.hover();
  }

  // =========================================================
  // Select
  // =========================================================

  async select(locator: Locator, value: string): Promise<void> {
    await locator.selectOption(value);
  }

  // =========================================================
  // Checkboxes
  // =========================================================

  async check(locator: Locator): Promise<void> {
    await locator.check();
  }

  async uncheck(locator: Locator): Promise<void> {
    await locator.uncheck();
  }

  // =========================================================
  // Wait
  // =========================================================

  async waitUntilVisible(locator: Locator): Promise<void> {
    await locator.waitFor({
      state: 'visible'
    });
  }

  async waitUntilHidden(locator: Locator): Promise<void> {
    await locator.waitFor({
      state: 'hidden'
    });
  }

  // =========================================================
  // State
  // =========================================================

  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  async isHidden(locator: Locator): Promise<boolean> {
    return locator.isHidden();
  }

  async isEnabled(locator: Locator): Promise<boolean> {
    return locator.isEnabled();
  }

  async isDisabled(locator: Locator): Promise<boolean> {
    return locator.isDisabled();
  }

  // =========================================================
  // Get Values
  // =========================================================

  async getText(locator: Locator): Promise<string> {
    return (await locator.textContent()) ?? '';
  }

  async getValue(locator: Locator): Promise<string> {
    return locator.inputValue();
  }

  async getAttribute(
    locator: Locator,
    attribute: string
  ): Promise<string | null> {
    return locator.getAttribute(attribute);
  }

  // =========================================================
  // Assertions
  // =========================================================

  async expectVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  async expectHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden();
  }

  async expectEnabled(locator: Locator): Promise<void> {
    await expect(locator).toBeEnabled();
  }

  async expectDisabled(locator: Locator): Promise<void> {
    await expect(locator).toBeDisabled();
  }

  async expectText(
    locator: Locator,
    expectedText: string
  ): Promise<void> {
    await expect(locator).toHaveText(expectedText);
  }

  async expectContainsText(
    locator: Locator,
    expectedText: string
  ): Promise<void> {
    await expect(locator).toContainText(expectedText);
  }

  // =========================================================
  // Screenshot
  // =========================================================

  async takeScreenshot(path: string): Promise<void> {
    await this.root.screenshot({
      path
    });
  }
}