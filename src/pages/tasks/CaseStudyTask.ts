import { expect, Page } from "@playwright/test";
import { Task } from "src/models";
import { TaskPage } from "./TaskPage";
import path from "path";

export class CaseStudyTask extends TaskPage {
  constructor(page: Page) {
    super(page);
  }

  async create(task: Task): Promise<void> {
    await this.clickCreateTask();
    await this.uploadThumbnail(task.thumbnail);
    await this.selectTaskType("Case Exercise");
    await this.fillTaskName(task.taskName);
    await this.selectPermissionLevel(task.permissionLevel);
    await this.fillScenario(task.description);
    console.log("CaseStudyTask: filling optional duration");
    if (task.duration) {
      await this.fillOptionalDuration(task.duration);
    }

    for (const skill of task.skills) {
      await this.selectSkillOption(skill);
    }

    // Go to Email Exercise
    await this.clickNext();
    await this.addEmailExercise(task);

    // Go to Assets
    await this.clickNext();
    await this.addAssets(task);

    // Go to Contacts
    await this.clickNext();
    await this.addContacts(task);

    // Save & Finish
    await this.save(task);
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

  private async addEmailExercise(task: Task): Promise<void> {
    const addEmailButton = this.page.getByRole("button", {
      name: /add email/i,
    });

    if (
      !(await addEmailButton.isVisible({ timeout: 10000 }).catch(() => false))
    ) {
      return;
    }

    await addEmailButton.click();

    await this.page
      .getByRole("textbox", { name: /sender name/i })
      .fill(task.emailName ?? "Customer Retention Update");
    await this.page
      .getByRole("textbox", { name: /sender email/i })
      .fill(task.emailSender ?? "case.exercise@yopmail.com");
    await this.page
      .getByRole("textbox", { name: /job title/i })
      .fill(task.emailJobTitle ?? "Customer Success Lead");
    await this.page
      .getByRole("textbox", { name: /subject line/i })
      .fill(task.emailSubject ?? "Retention metrics need review");

    const bodyEditor = this.page.locator(".tiptap").last();
    if (await bodyEditor.isVisible({ timeout: 5000 }).catch(() => false)) {
      await bodyEditor.fill(task.emailBody ?? task.description);
    }

    const priorityButton = this.page.getByRole("button", {
      name: /select priority/i,
    });
    if (await priorityButton.isVisible().catch(() => false)) {
      await priorityButton.click();
      await this.page
        .locator("button")
        .filter({ hasText: /medium|normal/i })
        .first()
        .click();
    }

    await this.page
      .getByRole("dialog", { name: /add email/i })
      .getByRole("button", { name: "Create" })
      .click();
    await expect(
      this.page.getByText(task.emailName ?? "Customer Retention Update"),
    ).toBeVisible({
      timeout: 15000,
    });
  }

  private async addAssets(task: Task): Promise<void> {
    const addAssetButton = this.page.getByRole("button", {
      name: /add asset/i,
    });

    if (
      !(await addAssetButton.isVisible({ timeout: 5000 }).catch(() => false))
    ) {
      return;
    }

    // Add first asset
    await addAssetButton.click();
    await this.page.waitForTimeout(300);

    const resolvedThumbnail = path.resolve(task.thumbnail);

    const fileInput = this.page.getByTestId("file-upload-input").last();
    if (await fileInput.count()) {
      await fileInput.setInputFiles(resolvedThumbnail);
      await this.page.waitForTimeout(800);
    } else {
      const uploadButton = this.page
        .getByRole("button", { name: "Upload File", exact: true })
        .last();
      if (await uploadButton.isVisible().catch(() => false)) {
        const fileChooserPromise = this.page.waitForEvent("filechooser");
        await uploadButton.click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(resolvedThumbnail);
        await this.page.waitForTimeout(800);
      }
    }

    const assetNameInput = this.page
      .getByRole("textbox", { name: /name/i })
      .last();
    if (await assetNameInput.isVisible().catch(() => false)) {
      await assetNameInput.fill("Market Analysis Document");
    }

    const createAssetButton = this.page
      .getByRole("button", { name: /create asset/i })
      .last();
    if (await createAssetButton.isVisible().catch(() => false)) {
      await createAssetButton.click();
      await this.page.waitForTimeout(500);
    }

    // Add second asset
    const addAssetButton2 = this.page.getByRole("button", {
      name: /add asset/i,
    });
    if (await addAssetButton2.isVisible().catch(() => false)) {
      await addAssetButton2.click();
      await this.page.waitForTimeout(300);

      const resolvedThumbnail2 = path.resolve(task.thumbnail);

      const fileInput2 = this.page.getByTestId("file-upload-input").last();
      if (await fileInput2.count()) {
        await fileInput2.setInputFiles(resolvedThumbnail2);
        await this.page.waitForTimeout(800);
      } else {
        const uploadButton2 = this.page
          .getByRole("button", { name: "Upload File", exact: true })
          .last();
        if (await uploadButton2.isVisible().catch(() => false)) {
          const fileChooserPromise = this.page.waitForEvent("filechooser");
          await uploadButton2.click();
          const fileChooser = await fileChooserPromise;
          await fileChooser.setFiles(resolvedThumbnail2);
          await this.page.waitForTimeout(800);
        }
      }

      const assetNameInput2 = this.page
        .getByRole("textbox", { name: /name/i })
        .last();
      if (await assetNameInput2.isVisible().catch(() => false)) {
        await assetNameInput2.fill("Executive Summary Video");
      }

      const createAssetButton2 = this.page
        .getByRole("button", { name: /create asset/i })
        .last();
      if (await createAssetButton2.isVisible().catch(() => false)) {
        await createAssetButton2.click();
        await this.page.waitForTimeout(500);
      }
    }
  }

  private async addContacts(task: Task): Promise<void> {
    const addContactButton = this.page.getByRole("button", {
      name: /add contact/i,
    });

    if (
      !(await addContactButton.isVisible({ timeout: 5000 }).catch(() => false))
    ) {
      return;
    }

    await addContactButton.click();
    await this.page.waitForTimeout(500);

    const titleInput = this.page
      .getByRole("textbox", { name: /title/i })
      .last();
    if (await titleInput.isVisible().catch(() => false)) {
      await titleInput.fill(task.contactTitle || "Chief Strategy Officer");
    }

    const nextButton1 = this.page.getByRole("button", { name: /next/i }).last();
    if (await nextButton1.isVisible().catch(() => false)) {
      await nextButton1.click();
      await this.page.waitForTimeout(500);

      await this.selectPersonaOption(task.persona || "Gabriel");

      const nextButton2 = this.page.getByRole("button", { name: /next/i }).last();
      if (await nextButton2.isVisible().catch(() => false)) {
        await expect(nextButton2).toBeEnabled({ timeout: 10000 });
        await nextButton2.click();
        await this.page.waitForTimeout(500);
      }
    }

    const behavioralInput = this.page.locator("textarea").last();
    if (await behavioralInput.isVisible().catch(() => false)) {
      await behavioralInput.fill(
        task.behaviouralRules || "Ask critical questions about ROI",
      );
    }

    const createContactButton = this.page
      .locator("button")
      .filter({ hasText: /create/i })
      .last();
    if (await createContactButton.isVisible().catch(() => false)) {
      await expect(createContactButton).toBeEnabled({ timeout: 10000 });
      await createContactButton.click();
      await expect(createContactButton).toBeHidden({ timeout: 15000 });
    }
  }

  private async clickOptionalNext(): Promise<void> {
    if (
      await this.nextButton.isVisible({ timeout: 10000 }).catch(() => false)
    ) {
      await this.clickNext();
    }
  }

  private async save(task: Task): Promise<void> {
    const timeInputs = this.page.getByPlaceholder(/enter minutes/i);
    await timeInputs.first().waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
    
    const timeCount = await timeInputs.count();
    if (timeCount > 0) {
      for (let i = 0; i < timeCount; i++) {
        const input = timeInputs.nth(i);
        if (await input.isVisible().catch(() => false)) {
          await input.click();
          await input.press("ControlOrMeta+a");
          await input.press("Backspace");
          await input.fill("5");
        }
      }
    }
    console.log("CaseStudyTask: saving task");
    await this.page.getByRole("button", { name: "Save & Finish" }).click();
    await this.page.waitForLoadState("networkidle");
  }
}
