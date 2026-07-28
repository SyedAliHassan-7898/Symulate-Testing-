import { expect, Page } from "@playwright/test";
import { TaskPage } from "./TaskPage";
import { Task } from "src/models";

export class RolePlayTask extends TaskPage {
  constructor(page: Page) {
    super(page);
  }

  async create(task: Task): Promise<void> {
    // =========================
    // STEP 1
    // =========================
    console.log("RolePlayTask: creating role play task");
    await this.clickCreateTask();

    await this.selectTaskType("Role Play");

    await this.fillTaskName(task.taskName);

    await this.fillScenario(task.description);

    await this.selectPermissionLevel(task.permissionLevel);

    // Skills - select multiple skills
    for (const skill of task.skills) {
      await this.selectSkillOption(skill);
    }

    await this.page.keyboard.press("Escape");
    await this.uploadThumbnail(task.thumbnail);

    await this.clickNext();

    // =========================
    // STEP 2 - PERSONA
    // =========================

    await this.selectPersonaOption(task.persona);

    await this.clickNext();

    // =========================
    // STEP 3 - CONTACT
    // =========================

    await this.configureContact(task);

    await this.save();
  }

  private async configureContact(task: Task): Promise<void> {
    const titleTextbox = this.page.getByRole("textbox", {
      name: /Title/i,
    });

    await expect(titleTextbox).toBeVisible();

    await titleTextbox.fill(task.contactTitle);

    const behaviouralRules = this.page.getByRole("textbox", {
      name: /behavioural rules/i,
    });

    if (
      task.behaviouralRules &&
      (await behaviouralRules.isVisible({ timeout: 5000 }).catch(() => false))
    ) {
      await behaviouralRules.fill(task.behaviouralRules);
    }
  }

  private async save(): Promise<void> {
    const saveButton = this.page.getByRole("button", {
      name: "Save & Finish",
    });

    // Modal/step transitions can leave the button attached but not yet
    // interactive, which is what produced the earlier flaky visibility
    // failures. Confirm it is on-screen and enabled before clicking.
    await expect(saveButton).toBeVisible({ timeout: 15000 });
    await saveButton.scrollIntoViewIfNeeded().catch(() => {});
    await expect(saveButton).toBeEnabled({ timeout: 15000 });
    await saveButton.click();

    await this.verifyCreated();
  }

  private async verifyCreated(): Promise<void> {
    // The save fires a network request, then the task wizard/modal closes and
    // the list view (with "Create Task") comes back. Wait for the modal to
    // actually detach first -- that is the real completion signal -- instead
    // of racing the "Create Task" button while the modal is still animating.
    const saveButton = this.page.getByRole("button", {
      name: "Save & Finish",
    });
    await expect(saveButton).toBeHidden({ timeout: 30000 }).catch(() => {});

    // Best-effort settle for the save request; networkidle can occasionally
    // never fully quiesce, so don't let it throw here.
    await this.page.waitForLoadState("networkidle").catch(() => {});
    console.log("RolePlayTask: save request completed");

    // Only now assert the list view is back. Scroll it into view before the
    // visibility check so a below-the-fold button doesn't cause a false miss.
    const createTaskButton = this.page.getByRole("button", {
      name: "Create Task",
    });
    await createTaskButton.scrollIntoViewIfNeeded().catch(() => {});
    await expect(createTaskButton).toBeVisible({
      timeout: 30000,
    });
  }
  
}
