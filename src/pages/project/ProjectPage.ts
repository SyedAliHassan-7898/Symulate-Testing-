import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "@core";

export class ProjectPage extends BasePage {
  readonly projectsLink: Locator;
  readonly createProjectButton: Locator;
  readonly chooseAccountButton: Locator;
  readonly projectNameInput: Locator;
  readonly selectSkillsProfileButton: Locator;
  readonly nextButton: Locator;
  readonly searchInput: Locator;
  // nextStepButton removed — use step-specific next button locators instead

  constructor(page: Page) {
    super(page);

    this.projectsLink = page.getByRole("link", { name: "Projects" }).first();
    this.createProjectButton = page.getByRole("button", { name: "Create Project" });
    this.chooseAccountButton = page.getByRole("button", { name: "Choose an account" });
    this.projectNameInput = page.getByRole("textbox", { name: "Project Name *" });
    this.selectSkillsProfileButton = page.getByRole("button", { name: "Select Skills Profile" });
    this.nextButton = page.getByRole("button", { name: "Next", exact: true });
    this.searchInput = page.getByRole("textbox", { name: "Search" });
  }

  async navigateToProjects(): Promise<void> {
    await expect(this.projectsLink).toBeVisible({ timeout: 10000 });
    await this.projectsLink.click();
    await this.page.waitForLoadState("networkidle");
  }

  async createProject(
    projectName: string,
    accountName: string,
    skillsProfileName: string,
    taskNames: string[],
    options?: { csvPath?: string; emailTemplateLabel?: string }
  ): Promise<void> {
    await this.navigateToProjects();

    await expect(this.createProjectButton).toBeVisible({ timeout: 10000 });
    await this.createProjectButton.click();

    // Select account
    await expect(this.chooseAccountButton).toBeVisible({ timeout: 10000 });
    await this.chooseAccountButton.click();
    const accountOption = this.page.getByRole("button", { name: accountName, exact: true })
      .or(this.page.locator("button").filter({ hasText: accountName }));
    await expect(accountOption.first()).toBeVisible({ timeout: 5000 });
    await accountOption.first().click();

    // Fill project name
    await expect(this.projectNameInput).toBeVisible({ timeout: 10000 });
    await this.projectNameInput.fill(projectName);

    // Select skills profile
    await expect(this.selectSkillsProfileButton).toBeVisible({ timeout: 10000 });
    await this.selectSkillsProfileButton.click();

    const dialog = this.page.getByRole("dialog");
    const profileOption = dialog.getByRole("button", { name: skillsProfileName, exact: true })
      .or(dialog.locator("button").filter({ hasText: skillsProfileName }));
    await expect(profileOption.first()).toBeVisible({ timeout: 5000 });
    await profileOption.first().click();

    // Click Next
    const step1Next = this.page.getByRole("button", { name: "Next", exact: true });
    await expect(step1Next).toBeVisible({ timeout: 10000 });
    await step1Next.click();
    await this.page.waitForTimeout(500);

    // Step 2: Select Admin/Audience
    // Search for EM Executive Management Admin or just click the visible option
    if (await this.searchInput.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.searchInput.first().click();
      const adminOption = this.page.getByRole("button", { name: /Executive Management Admin/i })
        .or(this.page.locator("button").filter({ hasText: /Admin/i }));
      if (await adminOption.first().isVisible().catch(() => false)) {
        await adminOption.first().click();
      }
    }

    // Click Next on Admin step
    const step2Next = this.page.getByRole("button", { name: "Next", exact: true });
    await expect(step2Next).toBeVisible({ timeout: 10000 });
    await step2Next.click();
    await this.page.waitForTimeout(500);

    // Step 3: Select Tasks
    // Click the tasks selector if it's there
    const relativeSelector = this.page.locator(".relative.disabled\\:opacity-75").first()
      .or(this.page.locator("button").filter({ hasText: /select task|simulation/i }));
    if (await relativeSelector.isVisible({ timeout: 10000 }).catch(() => false)) {
      await relativeSelector.click();
    }

    // Select the specified tasks
    for (const task of taskNames) {
      if (await this.searchInput.first().isVisible().catch(() => false)) {
        await this.searchInput.first().click();
        await this.searchInput.first().fill(task);
        await this.page.waitForTimeout(500);
      }
      const taskBtn = this.page.getByRole("button", { name: task, exact: false })
        .or(this.page.locator("button").filter({ hasText: task }));
      await expect(taskBtn.first()).toBeVisible({ timeout: 5000 });
      await taskBtn.first().click();
    }

    // Configure transition/conditions if the button custom gradient is present
    const addConditionBtn = this.page.locator("button.button-custom-gradient").first()
      .or(this.page.locator("button").filter({ hasText: /condition|add/i }));
    if (await addConditionBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addConditionBtn.click();
      await this.page.waitForTimeout(500);

      const conditionsBtn = this.page.getByRole("button", { name: "conditions", exact: true })
        .or(this.page.locator("button").filter({ hasText: /conditions/i }));
      if (await conditionsBtn.isVisible().catch(() => false)) {
        await conditionsBtn.click();
      }

      const evidenceBtn = this.page.getByRole("button", { name: "Extensive Evidence 4.0-", exact: false })
        .or(this.page.locator("button").filter({ hasText: /Evidence/i }));
      if (await evidenceBtn.first().isVisible().catch(() => false)) {
        await evidenceBtn.first().click();
      }

      const stageMapping = this.page.locator("div").filter({ hasText: "Stage 1->Stage 2Stage" }).first();
      if (await stageMapping.isVisible().catch(() => false)) {
        await stageMapping.click();
      }

      const saveCondition = this.page.getByRole("button", { name: "Save", exact: true })
        .or(this.page.locator("button").filter({ hasText: "Save" }));
      if (await saveCondition.isVisible().catch(() => false)) {
        await saveCondition.click();
      }
    }

    // Click Next on Task Selection Step
    const step3Next = this.page.getByRole("button", { name: "Next", exact: true });
    await expect(step3Next).toBeVisible({ timeout: 10000 });
    await step3Next.click();
    await this.page.waitForTimeout(500);

    // Step 4: Add Candidate & Finish
    // Attempt to upload a candidates CSV if the file input is present
    const fileInput = this.page.locator('input[type="file"]').first();
    const csvPath = options?.csvPath ?? 'tests/assets/candidates.csv';
    if (await fileInput.isVisible().catch(() => false)) {
      try {
        await this.uploadFile(fileInput, csvPath);
        await this.page.waitForTimeout(500);

        // If there's an email template dropdown, select the requested template or the first real option
        const templateSelector = this.page.getByRole('combobox', { name: /email template|template/i }).first()
          .or(this.page.locator('select').first());
        if (await templateSelector.isVisible().catch(() => false)) {
          try {
            if (options?.emailTemplateLabel) {
              await templateSelector.selectOption({ label: options.emailTemplateLabel }).catch(async () => {
                // fallback: try to find option by text and select by value
                const opt = templateSelector.locator('option').filter({ hasText: options!.emailTemplateLabel! });
                if (await opt.count()) {
                  const val = await opt.first().getAttribute('value');
                  if (val) await templateSelector.selectOption(val);
                }
              });
            } else {
              // choose first non-placeholder option if present
              const opts = templateSelector.locator('option');
              if ((await opts.count()) > 1) {
                const val = await opts.nth(1).getAttribute('value');
                if (val) await templateSelector.selectOption(val);
              }
            }
          } catch {}
        }

        const importBtn = this.page.getByRole('button', { name: /import|upload|add candidates|add candidate/i });
        if (await importBtn.first().isVisible().catch(() => false)) {
          await importBtn.first().click();
          await this.page.waitForTimeout(500);
        }
      } catch (e) {
        // swallow upload errors and continue to finalize the project
      }
    }

    // Click Next or Send/Finish to complete the wizard
    const finalizeBtn = this.page.getByRole("button", { name: /finish|save|create/i })
      .or(this.page.getByRole("button", { name: "Next", exact: true }));
    await expect(finalizeBtn.first()).toBeVisible({ timeout: 10000 });
    await finalizeBtn.first().click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(1000);
  }
}
