import { expect, Page } from "@playwright/test";
import { Task } from "src/models";
import { TaskPage } from "./TaskPage";
import path from "path";

export class SituationTask extends TaskPage {
  constructor(page: Page) {
    super(page);
  }
  
  async create(task: Task): Promise<void> {
    await this.clickCreateTask();
    await this.uploadThumbnail(task.thumbnail);
    await this.selectTaskType("Situations");
    await this.fillTaskName(task.taskName);
    await this.selectPermissionLevel(task.permissionLevel);
    await this.fillScenario(task.description);
console.log("SituationTask: filling optional duration");
    if (task.duration) {
      await this.fillOptionalDuration(task.duration);
    }

    await this.clickNext();
    await this.addSituation(task);
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

  private async addSituation(task: Task): Promise<void> {
    const addSituationButton = this.page.getByRole("button", {
      name: /add situation/i,
    });

    if (
      !(await addSituationButton
        .isVisible({ timeout: 5000 })
        .catch(() => false))
    ) {
      return;
    }

    await addSituationButton.click();
    await this.page.waitForTimeout(500);

    const videoFile = task.situationVideo ?? task.thumbnail;
    const resolvedVideoFile = path.resolve(videoFile);

    const fileInput = this.page.getByTestId("file-upload-input").last();
    if (await fileInput.count()) {
      await fileInput.setInputFiles(resolvedVideoFile);
      await expect(this.page.getByText("Video is required")).toBeHidden({
        timeout: 15000,
      });
    } else {
      const uploadButton = this.page
        .getByRole("button", { name: "Upload File", exact: true })
        .last();
      if (await uploadButton.isVisible().catch(() => false)) {
        const fileChooserPromise = this.page.waitForEvent("filechooser");
        await uploadButton.click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(resolvedVideoFile);
        await expect(this.page.getByText("Video is required")).toBeHidden({
          timeout: 15000,
        });
      }
    }

    const questionInput = this.page.getByRole("textbox", {
      name: /question/i,
    });
    if (await questionInput.isVisible().catch(() => false)) {
      await questionInput.fill(
        task.description || "How would you handle this situation?",
      );
    }

    if (task.skills && task.skills.length > 0) {
      const skillSearchInput = this.page
        .getByRole("textbox", { name: /search/i })
        .last();
      if (await skillSearchInput.isVisible().catch(() => false)) {
        for (const skill of task.skills) {
          await skillSearchInput.fill(skill.substring(0, 3));
          await this.page.waitForTimeout(300);
          const skillButton = this.page
            .getByRole("button", { name: new RegExp(skill, "i") })
            .first();
          if (await skillButton.isVisible().catch(() => false)) {
            await skillButton.click();
            await this.page.waitForTimeout(300);
          }
        }
      }
    }

    const createButton = this.page.getByRole("button", {
      name: /create/i,
    });
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      await expect(createButton).toBeHidden({ timeout: 15000 });
    }
  }

  private async completeOptionalPersonaFlow(task: Task): Promise<void> {
    const personaName = this.firstPersonaName(task.persona);
    const personaRegex = new RegExp(this.escapeRegex(personaName), "i");
    const personaButton = this.page
      .locator("main")
      .nth(1)
      .locator("button")
      .filter({ hasText: personaRegex })
      .first();

    if (await personaButton.isVisible({ timeout: 10000 }).catch(() => false)) {
      await personaButton.click();
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
    await this.page.waitForLoadState("networkidle");
console.log("SituationTask: saving task");

  }
}
