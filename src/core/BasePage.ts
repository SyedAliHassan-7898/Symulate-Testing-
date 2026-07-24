import { expect, Locator, Page } from '@playwright/test';

export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // =========================================================
  // Navigation
  // =========================================================

  async goto(url: string): Promise<void> {
    await this.page.goto(url, {
      waitUntil: 'networkidle'
    });
  }

  async reload(): Promise<void> {
    await this.page.reload({
      waitUntil: 'networkidle'
    });
  }

  async goBack(): Promise<void> {
    await this.page.goBack();
  }

  async goForward(): Promise<void> {
    await this.page.goForward();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
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

  async doubleClick(locator: Locator): Promise<void> {
    await locator.waitFor({
      state: 'visible'
    });

    await locator.dblclick();
  }

  async rightClick(locator: Locator): Promise<void> {
    await locator.click({
      button: 'right'
    });
  }

  // =========================================================
  // Input
  // =========================================================

  async fill(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({
      state: 'visible'
    });

    await locator.fill(value);
  }

  async clear(locator: Locator): Promise<void> {
    await locator.clear();
  }

  async type(locator: Locator, value: string): Promise<void> {
    await locator.type(value);
  }

  async press(locator: Locator, key: string): Promise<void> {
    await locator.press(key);
  }

  // =========================================================
  // Dropdown
  // =========================================================

  async selectOption(
    locator: Locator,
    value: string
  ): Promise<void> {
    await locator.selectOption(value);
  }

  // =========================================================
  // Checkbox
  // =========================================================

  async check(locator: Locator): Promise<void> {
    await locator.check();
  }

  async uncheck(locator: Locator): Promise<void> {
    await locator.uncheck();
  }

  // =========================================================
  // Hover
  // =========================================================

  async hover(locator: Locator): Promise<void> {
    await locator.hover();
  }

  // =========================================================
  // Scroll
  // =========================================================

  async scrollIntoView(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
    });
  }

  // =========================================================
  // Upload
  // =========================================================

  async uploadFile(
    locator: Locator,
    filePath: string
  ): Promise<void> {
    await locator.setInputFiles(filePath);
  }

  // =========================================================
  // Keyboard
  // =========================================================

  async keyboardPress(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  // =========================================================
  // Mouse
  // =========================================================

  async mouseMove(x: number, y: number): Promise<void> {
    await this.page.mouse.move(x, y);
  }

  // =========================================================
  // Screenshot
  // =========================================================

  async takeScreenshot(path: string): Promise<void> {
    await this.page.screenshot({
      path,
      fullPage: true
    });
  }

  // =========================================================
  // Alerts
  // =========================================================

  async acceptAlert(): Promise<void> {
    this.page.once('dialog', async dialog => {
      await dialog.accept();
    });
  }

  async dismissAlert(): Promise<void> {
    this.page.once('dialog', async dialog => {
      await dialog.dismiss();
    });
  }

  // =========================================================
  // Get Values
  // =========================================================

  async getText(locator: Locator): Promise<string> {
    return (await locator.textContent()) ?? '';
  }

  async getValue(locator: Locator): Promise<string> {
    return await locator.inputValue();
  }

  async getAttribute(
    locator: Locator,
    attribute: string
  ): Promise<string | null> {
    return await locator.getAttribute(attribute);
  }

  // =========================================================
  // State
  // =========================================================

  async isVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }

  async isHidden(locator: Locator): Promise<boolean> {
    return await locator.isHidden();
  }

  async isEnabled(locator: Locator): Promise<boolean> {
    return await locator.isEnabled();
  }

  async isDisabled(locator: Locator): Promise<boolean> {
    return await locator.isDisabled();
  }

  async isChecked(locator: Locator): Promise<boolean> {
    return await locator.isChecked();
  }

  // =========================================================
  // Waits
  // =========================================================

  async waitForVisible(locator: Locator): Promise<void> {
    await locator.waitFor({
      state: 'visible'
    });
  }

  async waitForHidden(locator: Locator): Promise<void> {
    await locator.waitFor({
      state: 'hidden'
    });
  }

  async waitForURL(url: string): Promise<void> {
    await this.page.waitForURL(url);
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
    expected: string
  ): Promise<void> {
    await expect(locator).toHaveText(expected);
  }

  async expectURL(expected: string): Promise<void> {
    await expect(this.page).toHaveURL(expected);
  }

  async expectTitle(expected: string): Promise<void> {
    await expect(this.page).toHaveTitle(expected);
  }
}