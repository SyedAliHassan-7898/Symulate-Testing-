import { expect, Page } from "@playwright/test";

export type ProjectConfig = {
  accountTitle: string;
  projectName: string;
  skillsProfileTitle: string;
  taskNames: string[];
  candidateFile: string;
  inviteTemplate: string;
};

/**
 * Drives Project creation in the client-admin portal:
 * choose account -> name project -> choose skills profile -> select tasks ->
 * upload candidates -> select all -> choose invite template -> send.
 *
 * Constructed with the impersonated client-admin page (the page returned by
 * ClientPage.impersonateClient(...) in your spec).
 */
export class ProjectPage {
  constructor(private readonly page: Page) {}

  async create(config: ProjectConfig): Promise<void> {
    await this.page.getByRole("link", { name: "Projects", exact: true }).click();
    await this.page.getByRole("button", { name: "Create Project" }).click();
    console.log("ProjectPage: create project");
    await this.page.getByRole("button", { name: "Choose an account", exact: true }).click();
    await this.page.getByRole("button", { name: config.accountTitle, exact: false }).click();

    await this.page.getByRole("textbox", { name: "Project Name *" }).click();
    await this.page.getByRole("textbox", { name: "Project Name *" }).fill(config.projectName);

    await this.page.getByRole("button", { name: "Select Skills Profile" }).click();
    await this.page
      .getByRole("dialog")
      .getByRole("button", { name: config.skillsProfileTitle, exact: false })
      .click();
    await this.page.getByRole("button", { name: "Next" }).click();

    for (const taskName of config.taskNames) {
      await this.selectProjectTask(taskName);
    }
    await this.page.getByRole("button", { name: "Next" }).click();

    await this.page.getByRole("tab", { name: "Upload New" }).click();
    // Set the file directly on the underlying input rather than clicking
    // "Choose File" first — clicking it can trigger a real OS file picker
    // that Playwright won't auto-handle.
    await this.page.locator('input[type="file"]').setInputFiles(config.candidateFile);
    await this.page.getByRole("button", { name: "Upload File" }).click();

    await this.page.getByRole("checkbox", { name: "select_all" }).check();
    await this.page.getByRole("button", { name: "Next" }).click();

    await this.page.getByRole("button", { name: "Choose Template" }).click();
    await this.page.getByRole("button", { name: config.inviteTemplate, exact: false }).click();
    await this.page.getByRole("button", { name: "Send" }).click();
  }

  private async selectProjectTask(taskName: string): Promise<void> {
    const searchBox = this.page.getByRole("textbox", { name: "Search" });
    await searchBox.click();

    // Task buttons render as "<taskName> – <category>" (e.g. two-line text),
    // so a substring match on the generated task name is enough.
    const taskButton = this.page.getByRole("button", { name: taskName, exact: false }).first();

    // Some task types are hidden behind a paginated "reveal more" control
    // until it's clicked (seen with the Role Play task in the recorded flow).
    if (!(await taskButton.isVisible({ timeout: 2000 }).catch(() => false))) {
      const revealMore = this.page.locator(".relative.disabled\\:opacity-75").first();
      if (await revealMore.isVisible({ timeout: 2000 }).catch(() => false)) {
        await revealMore.click();
      }
    }
    console.log(`ProjectPage: select task ${taskName}`);
    await expect(taskButton).toBeVisible({ timeout: 10000 });
    await taskButton.click();
  }
}