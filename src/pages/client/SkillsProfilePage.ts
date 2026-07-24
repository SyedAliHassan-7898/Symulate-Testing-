import { Page } from "@playwright/test";

export type SkillsProfileConfig = {
  title: string;
  description: string;
  permissionLevel: string;
  skills: string[];
};

/**
 * Drives Skills Profile creation in the client-admin portal
 * (Accounts -> Skills Profile -> Create Skills Profile), a distinct entity
 * from the Account created by AccountPage. This must run before
 * ProjectPage.create(...), since the project wizard's "Select Skills
 * Profile" dialog looks up profiles created here.
 */
export class SkillsProfilePage {
  constructor(private readonly page: Page) {}

  async create(config: SkillsProfileConfig): Promise<void> {
    await this.page.getByRole("link", { name: "Accounts", exact: true }).click();
    await this.page.getByRole("link", { name: "Skills Profile", exact: true }).click();
    await this.page.getByRole("button", { name: "Create Skills Profile" }).click();

    await this.page.getByRole("textbox", { name: "Permission Title" }).click();
    await this.page.getByRole("textbox", { name: "Permission Title" }).fill(config.title);
    await this.page.getByRole("textbox", { name: "Permission Description" }).click();
    await this.page.getByRole("textbox", { name: "Permission Description" }).fill(config.description);

    // Step 1 has three required fields -- Title, Description, and Level --
    // but Level is filled via a separate interaction below. Clicking "Next"
    // here, before Level is set, does NOT advance the wizard: it's a
    // validation no-op (the button briefly shows "Loading" while the
    // description is checked, then stays on the same screen because Level
    // is still empty). The real transition only happens after Level is
    // selected and Next is clicked a second time below -- so there is
    // nothing to assert here yet.
    await this.page.getByRole("button", { name: "Next" }).click();

    await this.page.getByRole("button", { name: /e\.g\. Entry-level individual/i }).click();
    await this.page.getByRole("button", { name: config.permissionLevel, exact: true }).click();

    // This second "Next" click is the one that actually advances to step 2.
    // Verify the transition really happened before touching the skills UI --
    // fail loudly here instead of letting later locators fail confusingly.
    await this.page.getByRole("button", { name: "Next" }).click();
    await this.page
      .getByText("Here are the skills identified from your role summary")
      .waitFor({ state: "visible", timeout: 15000 })
      .catch(async () => {
        throw new Error(
          "SkillsProfilePage: step 1 -> step 2 transition did not happen after " +
            "selecting Permission Level and clicking \"Next\" again. Check for " +
            "a validation error on step 1 (e.g. Title/Description too short) " +
            "before step 2's heading appears."
        );
      });
    console.log("SkillsProfilePage: step 1 -> step 2 transition confirmed");
    await this.removeDefaultSelectedSkills();

    for (const skill of config.skills) {
      await this.selectSkillBySearch(skill);
    }

    await this.page.getByRole("button", { name: "Create Skills Profile" }).click();
  }
 
  /**
   * The Skills Profile wizard auto-populates a set of default skills via an
   * AI suggestion call that runs AFTER landing on this step. Frame-by-frame
   * inspection of a recorded run showed:
   *   - defaults render one at a time (not all at once), with real gaps
   *     between each chip appearing
   *   - once the last default chip lands, the panel then shows an explicit
   *     "No skills selected yet" placeholder once every chip is removed
   *   - only after that empty state appears does the search step begin
   *
   * That empty-state text is a real, observable completion signal -- far
   * more reliable than guessing at a fixed click count or waiting for a
   * button count to "stabilize" for N ms (which can fire in the gap
   * between one default appearing and the next).
   *
   * Sequence: wait for at least one default skill to render, then remove
   * skills one at a time until the "No skills selected yet" placeholder is
   * visible, confirming removal is actually complete before search starts.
   */
  private async removeDefaultSelectedSkills(): Promise<void> {
    const blankButtons = this.page.getByRole("button").filter({ hasText: /^$/ });
    const emptyState = this.page.getByText("No skills selected yet");

    // Wait for the first default skill to actually render before touching
    // anything -- clicking too early just misses the defaults entirely.
    await blankButtons.first().waitFor({ state: "visible", timeout: 20000 }).catch(() => {});

    // Remove skills one at a time. Removing an item shifts the list down,
    // so the same index (2, matching the working recorded session) keeps
    // targeting the next remaining chip. Stop as soon as the empty-state
    // placeholder confirms nothing is left -- this is the real completion
    // signal, not a fixed click count or a timing guess.
    for (let i = 0; i < 30; i++) {
      if (await emptyState.isVisible({ timeout: 500 }).catch(() => false)) {
        break;
      }
      const target = blankButtons.nth(2);
      if (!(await target.isVisible({ timeout: 3000 }).catch(() => false))) {
        // No chip at index 2 anymore -- try index 0 in case the list is
        // shorter than expected, then re-check the empty state either way.
        const fallback = blankButtons.nth(0);
        if (await fallback.isVisible({ timeout: 2000 }).catch(() => false)) {
          await fallback.click();
          await this.page.waitForTimeout(300);
          continue;
        }
        break;
      }
      await target.click();
      await this.page.waitForTimeout(300);
    }

    // Hard confirmation: don't let search/select run while defaults are
    // still sitting there. If the empty state never showed up, this throws
    // instead of silently proceeding into the next step.
    await emptyState.waitFor({ state: "visible", timeout: 10000 });
  }

  private async selectSkillBySearch(skill: string): Promise<void> {
    const searchBox = this.page.getByRole("textbox", { name: "Search Skills..." });
    await searchBox.click();
    console.log(`SkillsProfilePage: searching for skill ${skill}`);
    await searchBox.press("ControlOrMeta+a");
    await searchBox.fill(skill.slice(0, 4).toLowerCase());
    await this.page.getByRole("button", { name: skill, exact: true }).click();
  }
}