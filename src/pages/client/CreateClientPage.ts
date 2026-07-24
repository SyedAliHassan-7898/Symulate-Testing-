import { expect, Locator, Page } from '@playwright/test';

import { BasePage } from '@core';
import { Client } from '@models';

export class CreateClientPage extends BasePage {
  readonly clientName: Locator;
  readonly adminName: Locator;
  readonly adminEmail: Locator;
  readonly createButton: Locator;

  constructor(page: Page) {
    super(page);
    console.log('CreateClientPage: constructor');
    this.clientName = page.getByRole('textbox', {
      name: 'Client Name *'
    });

    this.adminName = page.getByRole('textbox', {
      name: 'Admin Name *'
    });

    this.adminEmail = page.getByRole('textbox', {
      name: 'Admin Email *'
    });

    this.createButton = page.getByRole('button', {
      name: 'Create'
    });
  }

  /**
   * Fill Create Client form
   */
  async fillClientForm(client: Client): Promise<void> {
    await this.clientName.fill(client.clientName);
    await this.adminName.fill(client.adminName);
    await this.adminEmail.fill(client.adminEmail);
  }

  /**
   * Submit Create Client form
   */
  async submit(): Promise<void> {
    await this.createButton.click();
    console.log('CreateClientPage: submitted form');
  }

  /**
   * Complete Create Client flow
   */
  async create(client: Client): Promise<void> {
    await this.fillClientForm(client);
    await this.submit();
  }

  /**
   * Verify Create Client form is loaded
   */
  async verifyLoaded(): Promise<void> {
    await expect(this.clientName).toBeVisible();
    await expect(this.adminName).toBeVisible();
    await expect(this.adminEmail).toBeVisible();
    await expect(this.createButton).toBeVisible();
  }
}