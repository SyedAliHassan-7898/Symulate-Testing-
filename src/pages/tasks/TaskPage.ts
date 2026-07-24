import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "@core";
import { Urls } from "@config";
import path from "path";

export class TaskPage extends BasePage {
  readonly tasksMenu: Locator;
  readonly createTaskButton: Locator;

  readonly uploadButton: Locator;
  readonly taskTypeDropdown: Locator;
  readonly taskNameTextbox: Locator;
  readonly permissionLevelDropdown: Locator;
  readonly scenarioEditor: Locator;
  readonly nextButton: Locator;

  constructor(page: Page) {
    super(page);

    this.tasksMenu = page.getByRole("link", {
      name: /tasks/i,
      exact: false,
    });

    this.createTaskButton = page.getByRole("button", {
      name: /create task/i,
      exact: false,
    });

    this.uploadButton = page.getByRole("button", {
      name: "Upload File",
      exact: true,
    });

    this.taskTypeDropdown = page.getByRole("button", {
      name: /select type/i,
      exact: false,
    });

    this.taskNameTextbox = page.getByRole("textbox", {
      name: /task name/i,
    });

    this.permissionLevelDropdown = page.getByRole("button", {
      name: /select level/i,
      exact: false,
    });

    this.scenarioEditor = page.locator(".tiptap").first();

    this.nextButton = page.getByRole("button", {
      name: /next/i,
    });
  }

  protected escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  }

  protected firstPersonaName(persona: string | string[] | undefined): string {
    if (Array.isArray(persona)) {
      return persona[0] ?? "";
    }

    return persona ?? "";
  }

  async open(): Promise<void> {
    await this.goto(Urls.tasks);

    await expect(this.createTaskButton).toBeVisible({
      timeout: 30000,
    });
  }

  async clickCreateTask(): Promise<void> {
    await this.createTaskButton.click();
  }

  async uploadThumbnail(filePath: string): Promise<void> {
    await this.page.waitForTimeout(500);
    const resolvedPath = path.resolve(filePath);

    const scopedInput = this.page.getByTestId("file-upload-input").first();
    const fileInput = this.page.locator('input[type="file"]').first();

    if (await scopedInput.count()) {
      await scopedInput.setInputFiles(resolvedPath);
    } else if (await fileInput.count()) {
      await fileInput.setInputFiles(resolvedPath);
    } else {
      const uploadButton = this.page
        .getByRole("button", { name: "Upload File", exact: true })
        .first();
      if (await uploadButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        const fileChooserPromise = this.page.waitForEvent("filechooser");
        await uploadButton.click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(resolvedPath);
      }
    }

    await this.page.waitForTimeout(800);
  }

  async selectTaskType(type: string): Promise<void> {
    await this.taskTypeDropdown.click();
    await this.page.waitForTimeout(500);

    const typeOption = this.page
      .locator("button")
      .filter({ hasText: type })
      .first();
    await expect(typeOption).toBeVisible({ timeout: 10000 });
    await typeOption.click();
  }

  async fillTaskName(name: string): Promise<void> {
    await this.taskNameTextbox.fill(name);
  }

  async selectPermissionLevel(level: string): Promise<void> {
    await this.permissionLevelDropdown.click();
    await this.page.waitForTimeout(500);

    const permissionOption = this.page
      .locator("button")
      .filter({ hasText: level })
      .first();
    await expect(permissionOption).toBeVisible({ timeout: 10000 });
    await permissionOption.click();
  }

  async fillScenario(description: string): Promise<void> {
    await this.scenarioEditor.click();
    await this.scenarioEditor.fill(description);
  }

  protected async selectSkillOption(skill: string): Promise<void> {
    const escapedSkill = this.escapeRegex(skill);
    const skillRegex = new RegExp(escapedSkill, "i");

    const searchBox = this.page
      .getByRole("textbox", { name: /search/i })
      .first();

    await expect(searchBox).toBeVisible({ timeout: 10000 });

    const query = skill.split(" ")[0].slice(0, 4).toLowerCase();
    await searchBox.click();
    await searchBox.fill(query);

    const searchResult = this.page
      .getByRole("button", { name: skillRegex })
      .or(this.page.locator("button").filter({ hasText: skillRegex }))
      .first();

    await expect(searchResult).toBeVisible({ timeout: 10000 });
    await searchResult.click();

    await expect(
      this.page.getByText("Atleast one skill is required"),
    ).toBeHidden({
      timeout: 5000,
    });

    if (await searchBox.isVisible().catch(() => false)) {
      await searchBox.click();
      await searchBox.fill("");
    }
  }

  async selectSkill(skill: string): Promise<void> {
    await this.selectSkillOption(skill);
  }

  async selectPersonaOption(persona: string | string[]): Promise<void> {
    if (Array.isArray(persona)) {
      for (const p of persona) {
        await this.selectPersonaOption(p);
      }
      return;
    }

    const escapedPersona = this.escapeRegex(persona);
    const exactRegex = new RegExp(`^${escapedPersona}$`, "i");
    const containsRegex = new RegExp(escapedPersona, "i");

    const personaButton = this.page
      .getByRole("button", { name: exactRegex })
      .or(this.page.getByRole("button", { name: containsRegex }))
      .or(this.page.locator("button").filter({ hasText: containsRegex }))
      .first();

    await expect(personaButton, `Persona option "${persona}" should be visible`).toBeVisible({
      timeout: 20000,
    });

    await personaButton.scrollIntoViewIfNeeded();
    await personaButton.click();
    await this.page.waitForTimeout(300);
  }

  async clickNext(): Promise<void> {
    await this.page.waitForTimeout(600);
    await this.page.keyboard.press("Escape");
    await expect(this.nextButton.first()).toBeEnabled({ timeout: 15000 });
    await this.nextButton.first().click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(1500);
  }

  async assignTaskToClient(taskName: string, clientName: string): Promise<void> {
    await this.goto(Urls.tasks);
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(1000);

    // Search for the task first so pagination doesn't hide it
    const searchTasksBox = this.page.getByPlaceholder(/search tasks/i)
      .or(this.page.locator('input[placeholder*="Search"]'))
      .first();
    if (await searchTasksBox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchTasksBox.fill(taskName);
      await this.page.waitForTimeout(1500);
    }

    const taskRow = this.page.getByRole("row", { name: new RegExp(taskName, "i") }).first();
    
    const menuButton = taskRow.locator("td").last().locator("button").first();
    await expect(menuButton).toBeVisible({ timeout: 10000 });
    await menuButton.click();
    await this.page.waitForTimeout(500);

    const assignMenuOption = this.page.getByRole("button", { description: "Assign to Clients" })
      .or(this.page.getByRole("menuitem", { name: /assign/i }))
      .or(this.page.getByText("Assign to Clients"));
      
    if (await assignMenuOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await assignMenuOption.first().click();
      await this.page.waitForTimeout(500);
    }

    const searchBox = this.page.getByRole("textbox", { name: /search/i }).last();
    const clientOption = this.page.getByRole("button", { name: new RegExp(clientName, "i") }).first();

    // A just-created client can take a few seconds to become searchable in the
    // assign dialog. Re-issue the search a few times instead of failing on the
    // first short wait, so this step doesn't rely on a lucky retry.
    for (let attempt = 0; attempt < 4; attempt++) {
      if (await searchBox.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchBox.fill("");
        await searchBox.fill(clientName);
        await this.page.waitForTimeout(1500); // wait for search debounce
      }

      if (await clientOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        break;
      }
    }

    await expect(clientOption).toBeVisible({ timeout: 10000 });
    await clientOption.click();
    console.log("TaskPage: clicked assign button");
    const assignButton = this.page.getByRole("button", { name: "Assign", exact: true }).last();
    await assignButton.click();
    

    await expect(assignButton).toBeHidden({ timeout: 10000 });

  }
}
