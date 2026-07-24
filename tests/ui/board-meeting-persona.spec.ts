import { expect, test } from "@playwright/test";

import { TaskFactory } from "@data/factories/TaskFactory";
import { BoardMeetingTask } from "@pages/tasks/BoardMeetingTask";
import { TaskPage } from "@pages/tasks/TaskPage";

test.setTimeout(180000);

test("create board meeting and verify selected personas in tasks list", async ({
  page,
}) => {
  const taskPage = new TaskPage(page);
  const boardMeetingTask = new BoardMeetingTask(page);
  const task = TaskFactory.createBoardMeeting();

  await taskPage.open();
  await boardMeetingTask.create(task);

  await taskPage.open();

  const searchTasksBox = page
    .getByPlaceholder(/search tasks/i)
    .or(page.locator('input[placeholder*="Search"]'))
    .first();

  if (await searchTasksBox.isVisible({ timeout: 5000 }).catch(() => false)) {
    await searchTasksBox.fill(task.taskName);
    await page.waitForTimeout(1500);
  }

  const taskRow = page
    .getByRole("row", { name: new RegExp(task.taskName, "i") })
    .first();
  await expect(taskRow).toBeVisible({ timeout: 15000 });

  const selectedPersonas = Array.isArray(task.persona)
    ? task.persona
    : [task.persona];

  // Personas render as avatar images in the task row, so their names live in
  // the img alt text (accessible name) rather than as visible text nodes.
  // toContainText only sees rendered text, so assert on the avatar instead.
  for (const persona of selectedPersonas) {
    const personaAvatar = taskRow
      .getByRole("img", { name: new RegExp(thisEscapeRegex(persona), "i") })
      .first();
    await expect(
      personaAvatar,
      `${persona} should be present in the task row`,
    ).toBeVisible({ timeout: 10000 });
  }
});

function thisEscapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}
