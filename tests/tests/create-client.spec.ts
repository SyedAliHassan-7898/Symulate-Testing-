import { expect, test } from '@playwright/test';

import { ClientPage } from '@pages/client/ClientPage';
import { CreateClientPage } from '@pages/client/CreateClientPage';

test('Step 1: Create a New Unique Client Only Once', async ({ page }) => {
  const clientPage = new ClientPage(page);
  const createClientPage = new CreateClientPage(page);
  const uniqueId = Date.now(); 
  const dynamicClientName = `Automated Org ${uniqueId}`;
  const dynamicAdminEmail = `org_${uniqueId}@yopmail.com`;

  await clientPage.open();
  await expect(page).toHaveURL(/.*organizations/);

  await clientPage.clickCreateClient();
  await createClientPage.create({
    clientName: dynamicClientName,
    adminName: 'Executive Management Admin',
    adminEmail: dynamicAdminEmail
  });

  await expect(page.getByText('Created Successfully')).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('cell', { name: dynamicClientName, exact: true })).toBeVisible();

  console.log(`>>> CLIENT CREATED SUCCESSFULLY: ${dynamicClientName}`);
});
