import { expect, Page } from "@playwright/test";
import { Task } from "src/models";
import { TaskPage } from "./TaskPage";

export class InterviewTask extends TaskPage {
  constructor(page: Page) {
    super(page);
  }

  async create(task: Task): Promise<void> {
    console.log(">>> STARTING INTERVIEW TASK CREATION");

    await this.clickCreateTask();

    await this.uploadThumbnail(task.thumbnail);

    await this.selectTaskType("Interview");
    await this.verifyInterviewTaskTypeStarted();

    await this.fillTaskName(task.taskName);

    await this.selectPermissionLevel(task.permissionLevel);

    await this.fillCandidateInstructions(task.description);

    await this.fillTimeLimit(task.duration ?? "15");

    for (const skill of task.skills) {
      await this.selectSkillOption(skill);
    }

    await this.clickNext();

    await this.selectPersonaOption(task.persona);

    await this.clickNext();

    await this.configurePersona(task);

    await this.save();
  }

  private async verifyInterviewTaskTypeStarted(): Promise<void> {
    await expect(
      this.page.getByRole("button", { name: /interview/i }),
    ).toBeVisible({
      timeout: 10000,
    });
    await expect(this.page.getByText("Candidate Instructions")).toBeVisible({
      timeout: 10000,
    });

    console.log(">>> INTERVIEW TASK TYPE SELECTED SUCCESSFULLY");
  }

  private async fillCandidateInstructions(description: string): Promise<void> {
    await this.scenarioEditor.click();
    await this.scenarioEditor.fill(description);
  }

  private async fillTimeLimit(duration: string): Promise<void> {
    await this.page.locator('input:not([type="file"])').nth(1).fill(duration);
  }

  private async configurePersona(task: Task): Promise<void> {
    await expect(this.page.getByRole("textbox", { name: /title/i })).toBeVisible(
      { timeout: 30000 },
    );

    await this.page
      .getByRole("textbox", { name: /title/i })
      .fill(task.contactTitle);

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
    await expect(this.page.getByText("Task Saved Successfully!")).toBeVisible({
      timeout: 30000,
    });

    console.log(">>> INTERVIEW TASK CREATED SUCCESSFULLY");

    await this.page.waitForLoadState("networkidle");
  }
}
