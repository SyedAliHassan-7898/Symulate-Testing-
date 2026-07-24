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
    await this.page
      .getByRole("button", {
        name: "Save & Finish",
      })
      .click();

    await this.verifyCreated();
  }

  private async verifyCreated(): Promise<void> {
    // Wait until save request completes
    
    await this.page.waitForLoadState("networkidle");
    console.log("RolePlayTask: save request completed");  
    // Wait until Create Task button appears again
    await expect(
      this.page.getByRole("button", {
        name: "Create Task",
      }),
    ).toBeVisible({
      timeout: 30000,
    });
  }
  
}
