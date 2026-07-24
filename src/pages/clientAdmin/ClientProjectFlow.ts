import { expect, Locator, Page } from "@playwright/test";

export type SkillsProfileConfig = {
  title: string;
  description: string;
  permissionLevel: string;
  skills: string[];
};

export type ProjectConfig = {
  accountTitle: string;
  projectName: string;
  skillsProfileTitle: string;
  taskNames: string[];
  candidateFile: string;
  inviteTemplate: string;
};

/**
 * Drives the client-admin flow that starts after impersonating a client
 * from the Super Admin "Clients" page:
 *   Skills Profile creation -> Project creation -> task selection ->
 *   candidate upload -> invite send.
 *
 * NOTE: paths/imports here assume this file will sit alongside your other
 * page objects (see chat for confirming the exact folder). Adjust the
 * import of Page/Locator/expect only if your project re-exports its own
 * wrapped versions elsewhere.
 */
export class ClientProjectFlow {
  constructor(private readonly page: Page) {}

  /**
   * From the Super Admin Clients list, clicks the given organisation to
   * open the client-admin app in a new tab/popup and returns that page.
   */
  async impersonateClient(orgName: string): Promise<Page> {
    await this.page.getByRole("link", { name: "Clients" }).click();

    const popupPromise = this.page.waitForEvent("popup");
    await this.page
      .getByRole("button", { name: new RegExp(this.escapeRegex(orgName), "i") })
      .click();
    const clientPage = await popupPromise;
    await clientPage.waitForLoadState();

    return clientPage;
  }

  async createSkillsProfile(clientPage: Page, config: SkillsProfileConfig): Promise<void> {
    await clientPage.getByRole("link", { name: "Accounts", exact: false }).click();
    await clientPage.getByRole("link", { name: "Skills Profile" }).click();
    await clientPage.getByRole("button", { name: "Create Skills Profile" }).click();

    await clientPage.getByRole("textbox", { name: "Permission Title" }).click();
    await clientPage.getByRole("textbox", { name: "Permission Title" }).fill(config.title);
    await clientPage.getByRole("textbox", { name: "Permission Description" }).click();
    await clientPage.getByRole("textbox", { name: "Permission Description" }).fill(config.description);
    await clientPage.getByRole("button", { name: "Next" }).click();

    await clientPage.getByRole("button", { name: /e\.g\. Entry-level individual/i }).click();
    await clientPage.getByRole("button", { name: config.permissionLevel, exact: true }).click();
    await clientPage.getByRole("button", { name: "Next" }).click();

    await this.expandAllSkillCategories(clientPage);

    for (const skill of config.skills) {
      await this.selectSkillBySearch(clientPage, skill);
    }

    await clientPage.getByRole("button", { name: "Create Skills Profile" }).click();
  }

  async createProject(clientPage: Page, config: ProjectConfig): Promise<void> {
    await clientPage.getByRole("link", { name: "Projects" }).click();
    await clientPage.getByRole("button", { name: "Create Project" }).click();

    await clientPage.getByRole("button", { name: "Choose an account" }).click();
    await clientPage.getByRole("button", { name: config.accountTitle, exact: false }).click();

    await clientPage.getByRole("textbox", { name: "Project Name *" }).click();
    await clientPage.getByRole("textbox", { name: "Project Name *" }).fill(config.projectName);

    await clientPage.getByRole("button", { name: "Select Skills Profile" }).click();
    await clientPage
      .getByRole("dialog")
      .getByRole("button", { name: config.skillsProfileTitle, exact: false })
      .click();
    await clientPage.getByRole("button", { name: "Next" }).click();

    for (const taskName of config.taskNames) {
      await this.selectProjectTask(clientPage, taskName);
    }
    await clientPage.getByRole("button", { name: "Next" }).click();

    await clientPage.getByRole("tab", { name: "Upload New" }).click();
    await clientPage.getByRole("button", { name: "Choose File" }).click();
    await clientPage.getByRole("button", { name: "File input" }).setInputFiles(config.candidateFile);
    await clientPage.getByRole("button", { name: "Upload File" }).click();

    await clientPage.getByRole("checkbox", { name: "select_all" }).check();
    await clientPage.getByRole("button", { name: "Next" }).click();

    await clientPage.getByRole("button", { name: "Choose Template" }).click();
    await clientPage.getByRole("button", { name: config.inviteTemplate, exact: false }).click();
    await clientPage.getByRole("button", { name: "Send" }).click();
  }

  private async expandAllSkillCategories(clientPage: Page): Promise<void> {
    // The captured flow repeatedly opens the 3rd unlabeled toggle button to
    // expand each skill category before search becomes usable. Re-query
    // fresh each time since indexes shift as sections expand/collapse.
    for (let i = 0; i < 15; i++) {
      const toggle = clientPage.getByRole("button").filter({ hasText: /^$/ }).nth(2);
      if (!(await toggle.isVisible({ timeout: 1000 }).catch(() => false))) {
        break;
      }
      await toggle.click();
    }
  }

  private async selectSkillBySearch(clientPage: Page, skill: string): Promise<void> {
    const searchBox = clientPage.getByRole("textbox", { name: "Search Skills..." });
    await searchBox.click();
    await searchBox.press("ControlOrMeta+a");
    await searchBox.fill(skill.slice(0, 4).toLowerCase());
    await clientPage.getByRole("button", { name: skill, exact: true }).click();
  }

  private async selectProjectTask(clientPage: Page, taskName: string): Promise<void> {
    const searchBox = clientPage.getByRole("textbox", { name: "Search" });
    await searchBox.click();

    const taskButton = clientPage.getByRole("button", { name: taskName, exact: false }).first();

    // Some task types are hidden behind a paginated "reveal more" control
    // until it's clicked (seen with "Leadership Communication" in the
    // recorded flow). Try it once if the target isn't visible yet.
    if (!(await taskButton.isVisible({ timeout: 2000 }).catch(() => false))) {
      const revealMore = clientPage.locator(".relative.disabled\\:opacity-75").first();
      if (await revealMore.isVisible({ timeout: 2000 }).catch(() => false)) {
        await revealMore.click();
      }
    }

    await expect(taskButton).toBeVisible({ timeout: 10000 });
    await taskButton.click();
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}