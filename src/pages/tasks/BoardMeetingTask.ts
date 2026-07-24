import { expect, Locator, Page } from "@playwright/test";
import { Task } from "src/models";
import { TaskPage } from "./TaskPage";

type BoardMeetingPersonaConfig = {
  name: string;
  title: string;
  behaviouralRules: string;
};

export class BoardMeetingTask extends TaskPage {
  constructor(page: Page) {
    super(page);
  }

  async create(task: Task): Promise<void> {
    await this.clickCreateTask();
    await this.uploadThumbnail(task.thumbnail);
    await this.selectTaskType("Board Meeting");
    await this.fillTaskName(task.taskName);
    await this.selectPermissionLevel(task.permissionLevel);
console.log("BoardMeetingTask: filling optional duration");
    if (task.duration) {
      await this.fillOptionalDuration(task.duration);
    }

    for (const skill of task.skills) {
      await this.selectSkillOption(skill);
    }

    await this.clickBoardMeetingNext();
    await this.fillScenario(task.description);
    await this.clickBoardMeetingNext();
    await this.selectBoardMeetingPersonas(task);
    await this.configureSelectedPersonas(task);
    await this.configureTimeAllocation(task);
    await this.save();
    await this.verifyPersonasInTaskList(task);
  }

  /**
   * Verifies that, after creation, the Persona column for this task in the
   * task list shows the personas that were actually selected during setup.
   *
   * NOTE: The exact locator for the Persona cell/avatars depends on the real
   * DOM of the task list, which wasn't available when writing this. Three
   * fallback strategies are tried in order:
   *   1. A cell marked with data-column="persona" (common data-testid pattern)
   *   2. Avatar <img> elements whose alt/title includes the persona name
   *   3. Plain text match of the persona name inside the row
   *
   * Once you inspect the real markup, trim this down to the one strategy
   * that actually applies and delete the others.
   */
  private async verifyPersonasInTaskList(task: Task): Promise<void> {
    const personaNames = this.getPersonaNames(task);

    // Task list may live on a different route after Save & Finish redirects.
    await this.page.waitForLoadState("networkidle").catch(() => {});

    const taskRow = this.page.getByRole("row", {
      name: new RegExp(this.escapeRegex(task.taskName), "i"),
    });
    await expect(taskRow).toBeVisible({ timeout: 15000 });

    for (const personaName of personaNames) {
      await this.assertPersonaVisibleInRow(taskRow, personaName);
    }
  }

  private async assertPersonaVisibleInRow(taskRow: Locator, personaName: string): Promise<void> {
    const personaNameRegex = new RegExp(this.escapeRegex(personaName), "i");

    // Strategy 1: dedicated persona column cell
    const personaCell = taskRow.locator('[data-column="persona"], [data-testid="persona-column"]');
    if (await personaCell.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      const avatarInCell = personaCell.getByRole("img", { name: personaNameRegex });
      if (await avatarInCell.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        return;
      }
      await expect(personaCell.getByText(personaNameRegex).first()).toBeVisible({ timeout: 5000 });
      return;
    }

    // Strategy 2: avatar image anywhere in the row, identified by alt/title
    const avatarInRow = taskRow.getByRole("img", { name: personaNameRegex });
    if (await avatarInRow.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      return;
    }

    // Strategy 3: fall back to plain text match within the row
    await expect(taskRow.getByText(personaNameRegex).first()).toBeVisible({ timeout: 5000 });
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

  private getPersonaNames(task: Task): string[] {
    return Array.isArray(task.persona) ? task.persona : [task.persona];
  }
  
  private getPersonaConfigs(task: Task): BoardMeetingPersonaConfig[] {
    const configs: BoardMeetingPersonaConfig[] = [
      {
        name: "Gabriel",
        title: "Board Chair",
        behaviouralRules: "Ask concise executive-level questions. Challenge assumptions respectfully and keep the meeting focused on decisions.",
      },
      {
        name: "Sophie Adams",
        title: "Strategy Lead",
        behaviouralRules: "Ask concise executive-level questions. Challenge assumptions respectfully and keep the meeting focused on decisions.",
      },
      {
        name: "Adams",
        title: "Chief Financial Officer",
        behaviouralRules: "Ask concise executive-level questions. Challenge assumptions respectfully and keep the meeting focused on decisions.",
      },
    ];

    const selectedNames = this.getPersonaNames(task);
    return configs.filter((config) => selectedNames.includes(config.name));
  }

  private async selectBoardMeetingPersonas(task: Task): Promise<void> {
    for (const persona of this.getPersonaConfigs(task).map((config) => config.name)) {
      await this.selectBoardMeetingPersonaOption(persona);
    }

    await this.clickBoardMeetingNext();
  }

  private async selectBoardMeetingPersonaOption(persona: string): Promise<void> {
    const personaRegex = new RegExp(`^${this.escapeRegex(persona)}\\s+${this.escapeRegex(persona)}$`, "i");
    const exactPersonaCard = this.page.getByRole("button", { name: personaRegex }).first();

    if (await exactPersonaCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exactPersonaCard.scrollIntoViewIfNeeded();
      await exactPersonaCard.click();
      await this.page.waitForTimeout(300);
      return;
    }

    await this.selectPersonaOption(persona);
  }

  private async configureSelectedPersonas(task: Task): Promise<void> {
    for (const personaConfig of this.getPersonaConfigs(task)) {
      await this.configurePersonaStep(personaConfig);
      await this.clickBoardMeetingNext();
      await this.page.waitForTimeout(500);
    }
  }

  private async configurePersonaStep(personaConfig: BoardMeetingPersonaConfig): Promise<void> {
    await expect(
      this.page.getByRole("heading", {
        name: new RegExp(this.escapeRegex(personaConfig.name), "i"),
      }),
    ).toBeVisible({ timeout: 15000 });

    const titleInput = this.page.getByRole("textbox", { name: /title/i }).first();
    await expect(titleInput).toBeVisible({ timeout: 15000 });
    await this.replaceInputValue(titleInput, personaConfig.title);

    await this.fillTextboxIfVisible(/behavioural rules/i, personaConfig.behaviouralRules);
  }

  private async fillTextboxIfVisible(name: RegExp, value: string): Promise<void> {
    const textbox = this.page.getByRole("textbox", { name }).last();
    if (await textbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.replaceInputValue(textbox, value);
    }
  }

  private async replaceInputValue(input: Locator, value: string): Promise<void> {
    await input.click();
    await input.press("ControlOrMeta+a");
    await input.fill(value);
  }

  private async clickBoardMeetingNext(): Promise<void> {
    const nextButton = this.page.getByRole("button", { name: /next|continue/i }).last();
    await expect(nextButton).toBeVisible({ timeout: 15000 });
    await expect(nextButton).toBeEnabled({ timeout: 15000 });
    await nextButton.click();
    await this.page.waitForLoadState("networkidle").catch(() => {});
    await this.page.waitForTimeout(700);
  }

  private async configureTimeAllocation(task: Task): Promise<void> {
    const personaConfigs = this.getPersonaConfigs(task);
    const totalDuration = Number.parseInt(task.duration || "15", 10);
    let remaining = totalDuration;

    for (let i = 0; i < personaConfigs.length; i++) {
      const { name, title } = personaConfigs[i];
      const row = this.page.getByRole("row", {
        name: new RegExp(`${this.escapeRegex(name)}\\s+${this.escapeRegex(title)}`, "i"),
      });
      const input = row.getByPlaceholder(/enter minutes/i);
      const allocate =
        i === personaConfigs.length - 1
          ? remaining
          : Math.max(1, Math.floor(totalDuration / personaConfigs.length));

      await expect(input).toBeVisible({ timeout: 15000 });
      await this.replaceInputValue(input, allocate.toString());
      remaining -= allocate;
    }
  }

  private async save(): Promise<void> {
    const actionButton = this.page.getByRole("button", { name: "Save & Finish" });

    await expect(actionButton).toBeVisible({ timeout: 10000 });
    await expect(actionButton).toBeEnabled({ timeout: 10000 });
    await actionButton.click();
    console.log("BoardMeetingTask: saving task");
    await this.page.waitForLoadState("networkidle");
  }
}