import { expect, Page } from "@playwright/test";
import { Task } from "src/models";
import { TaskPage } from "./TaskPage";

export class WelcomeTask extends TaskPage {
  constructor(page: Page) {
    super(page);
  }

  async create(task: Task): Promise<void> {
    await this.clickCreateTask();
    await this.uploadThumbnail(task.thumbnail);
    await this.selectTaskType("Welcome");
    await this.fillTaskName(task.taskName);
    await this.selectPermissionLevel(task.permissionLevel);
    await this.fillScenario(task.description);
    console.log("WelcomeTask: filling  duration for welcome task");
    if (task.duration) {
      await this.fillOptionalDuration(task.duration);
    }

    await this.clickNext();
    await this.completeOptionalPersonaFlow(task);
    await this.save();
  }

  private async fillOptionalDuration(duration: string): Promise<void> {
    const inputs = this.page.locator('input:not([type="file"])');

    if (
      await inputs
        .nth(1)
        .isVisible()
        .catch(() => false)
    ) {
      await inputs.nth(1).fill(duration);
    }
  }

  private async completeOptionalPersonaFlow(task: Task): Promise<void> {
    const choosePersonaHeading = this.page.getByRole("heading", {
      name: /choose persona/i,
    });
    const personaName = this.firstPersonaName(task.persona);
    const personaRegex = new RegExp(this.escapeRegex(personaName), "i");
    const personaButton = this.page
      .getByRole("button", { name: personaRegex })
      .first();

    if (
      await choosePersonaHeading
        .isVisible({ timeout: 10000 })
        .catch(() => false)
    ) {
      if (await personaButton.isVisible().catch(() => false)) {
        await personaButton.click();
      }
      await this.clickNext();
    }

    const titleTextbox = this.page.getByRole("textbox", { name: /title/i });

    if (await titleTextbox.isVisible({ timeout: 10000 }).catch(() => false)) {
      await titleTextbox.fill(task.contactTitle);
    }

    const textareas = this.page.locator("textarea");
    const textareaCount = await textareas.count();

    if (textareaCount > 0 && task.welcomeMessage)
      await textareas.nth(0).fill(task.welcomeMessage);
    if (textareaCount > 1 && task.personaRole)
      await textareas.nth(1).fill(task.personaRole);
    if (textareaCount > 2 && task.behaviouralRules)
      await textareas.nth(2).fill(task.behaviouralRules);
  }

  private async save(): Promise<void> {
    await this.page.getByRole("button", { name: "Save & Finish" }).click();
    console.log("WelcomeTask: saving task");
    await this.page.waitForLoadState("networkidle");
  }
}
