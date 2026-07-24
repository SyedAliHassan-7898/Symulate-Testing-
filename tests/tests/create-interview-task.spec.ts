import { expect, test } from '@playwright/test';

import { TaskFactory } from '@data/factories/TaskFactory';
import { ClientPage } from '@pages/client/ClientPage';
import { CreateClientPage } from '@pages/client/CreateClientPage';
import { InterviewTask } from '@pages/tasks/InterviewTask';
import { TaskPage } from '@pages/tasks/TaskPage';

test('Step 3: Create Professional Interview Task', async ({ page }) => {
  const taskPage = new TaskPage(page);
  const interviewTask = new InterviewTask(page);
  const clientPage = new ClientPage(page);
  const createClientPage = new CreateClientPage(page);
  const task = TaskFactory.createInterview();

  const uniqueId = Date.now();
  const dynamicClientName = `Automated Interview Org ${uniqueId}`;
  const dynamicAdminEmail = `interview_org_${uniqueId}@yopmail.com`;

  await clientPage.open();
  await clientPage.clickCreateClient();
  await createClientPage.create({
    clientName: dynamicClientName,
    adminName: 'Interview Management Admin',
    adminEmail: dynamicAdminEmail
  });

  await expect(page.getByText('Created Successfully')).toBeVisible({
    timeout: 10000
  });
  await expect(page.getByRole('cell', { name: dynamicClientName, exact: true })).toBeVisible();

  await taskPage.open();
  await interviewTask.create(task);

  console.log(`>>> INTERVIEW TASK CREATED: ${task.taskName}`);
});
