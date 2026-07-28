import { expect, Page } from "@playwright/test";

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
  
    // The permission-level dropdown is a separate async-rendered overlay.
    // Wait for its anchor button to be on-screen before clicking, so we
    // don't race the dropdown and silently miss the click.
    const levelDropdown = this.page.getByRole("button", {
      name: /e\.g\. Entry-level individual/i,
    });
    await expect(levelDropdown).toBeVisible({ timeout: 15000 });
    await levelDropdown.click();
  
    const levelOption = this.page.getByRole("button", {
      name: config.permissionLevel,
      exact: true,
    });
    await expect(levelOption).toBeVisible({ timeout: 15000 });
    await levelOption.click();
  
    // Let the dropdown close and the selection register before the second
    // Next click; without this pause the click can land while the overlay
    // is still animating and the level never actually sticks.
    await this.page.waitForTimeout(500);
  
    // This second "Next" click is the one that actually advances to step 2.
    // Wait for the wizard to actually be ready for step-2 interaction
    // (search box visible) instead of just trusting the heading text --
    // the heading can render before the skills panel (and its search box)
    // finishes loading, and a click that lands during the transition can
    // silently no-op.
    await this.page.getByRole("button", { name: "Next" }).click();
    await this.waitForStep2Ready();
    console.log("SkillsProfilePage: step 1 -> step 2 transition confirmed");
  
    await this.removeDefaultSelectedSkills();
  
    for (const skill of config.skills) {
      await this.selectSkillBySearch(skill);
    }
  
    const createButton = this.page.getByRole("button", {
      name: "Create Skills Profile",
    });
    await expect(createButton).toBeVisible({ timeout: 15000 });
    await createButton.scrollIntoViewIfNeeded().catch(() => {});
    await expect(createButton).toBeEnabled({ timeout: 15000 });
    await createButton.click();
  }
  
  /**
   * Wait for step 2 to be genuinely ready for interaction. The heading
   * "Here are the skills identified..." is NOT enough -- the skills panel
   * (and its "Search Skills..." textbox) is a separate async render that
   * can lag the heading by several seconds. We therefore wait for the
   * search box itself, which is the real signal that the panel is mounted
   * and ready. If the search box never appears we retry clicking Next
   * once (the first click can occasionally land during a dropdown close
   * and be swallowed), then wait again. If it STILL doesn't appear we
   * throw with a clear message instead of letting later locators fail
   * confusingly.
   */
  private async waitForStep2Ready(): Promise<void> {
    const searchBox = this.page.getByRole("textbox", { name: /search skills/i });
  
    try {
      await expect(searchBox).toBeVisible({ timeout: 20000 });
      return;
    } catch {
      console.warn(
        "SkillsProfilePage: search box not visible after 20s, retrying Next click.",
      );
    }
  
    // Fallback: click Next one more time in case the first click was
    // swallowed by a dropdown/animation race, then wait again.
    const nextButton = this.page.getByRole("button", { name: "Next" });
    if (await nextButton.isVisible().catch(() => false)) {
      await nextButton.click().catch(() => {});
    }
  
    await expect(searchBox).toBeVisible({ timeout: 20000 });
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

    // The default skills are populated by an async AI suggestion request that
    // fires AFTER we land on this step. Let that network activity settle first
    // so we're not racing chips that are still streaming in one at a time.
    // networkidle can occasionally never fully quiesce, so it's best-effort.
    await this.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    // Wait for the first default skill to actually render before touching
    // anything -- clicking too early just misses the defaults entirely. If the
    // empty state is already showing we simply fall through with no-op.
    await blankButtons.first().waitFor({ state: "visible", timeout: 20000 }).catch(() => {});

    // Remove skills one at a time. Removing an item shifts the list down, so
    // the same index (2, matching the working recorded session) keeps
    // targeting the next remaining chip. This loop is intentionally tolerant:
    // it re-checks the empty state on every pass, never assumes an instant
    // state update after a click, and never throws mid-removal.
    for (let i = 0; i < 30; i++) {
      if (await emptyState.isVisible().catch(() => false)) {
        break;
      }

      const target = blankButtons.nth(2);
      const fallback = blankButtons.nth(0);

      if (await target.isVisible({ timeout: 2000 }).catch(() => false)) {
        await target.click().catch(() => {});
      } else if (await fallback.isVisible({ timeout: 2000 }).catch(() => false)) {
        // No chip at index 2 anymore -- the list is shorter than expected, so
        // fall back to the first removable chip instead.
        await fallback.click().catch(() => {});
      } else {
        // Nothing left to remove -- either the panel is already clear or the
        // chips are still rendering; the empty-state poll below handles both.
        break;
      }

      // Let the removal animation / list re-render settle before the next pass
      // instead of assuming the DOM updated synchronously.
      await this.page.waitForTimeout(400);
    }

    // Best-effort confirmation that removal completed. We poll (auto-retrying)
    // for the empty-state placeholder, but we deliberately do NOT throw if it
    // never appears: a delayed render or a differently-worded placeholder
    // should not crash the whole flow. The search step below re-validates the
    // skills panel by waiting on its own locators anyway.
    await expect
      .poll(async () => emptyState.isVisible().catch(() => false), {
        timeout: 15000,
        intervals: [500, 1000, 2000],
      })
      .toBe(true)
      .catch(() => {
        console.warn(
          "SkillsProfilePage: 'No skills selected yet' never became visible; " +
            "proceeding to skill search anyway (defaults may already be cleared).",
        );
      });
  }

  private async selectSkillBySearch(skill: string): Promise<void> {
    // Use a forgiving locator: the placeholder text can be "Search Skills...",
    // "Search skills", "Search Skills", etc. -- exact match is too brittle.
    const searchBox = this.page.getByRole("textbox", { name: /search skills/i });

    // The search box can take a moment to appear after step 2 transition.
    // Wait for it with a generous timeout before failing.
    await expect(searchBox).toBeVisible({ timeout: 20000 });
    await searchBox.scrollIntoViewIfNeeded().catch(() => {});
    await searchBox.click();
    console.log(`SkillsProfilePage: searching for skill ${skill}`);
    await searchBox.press("ControlOrMeta+a");
    await searchBox.fill(skill.slice(0, 4).toLowerCase());

    // Wait for the search result to actually render before clicking instead of
    // assuming it's there the instant the query is typed. Use a forgiving
    // locator (contains, case-insensitive) because the displayed label can
    // differ slightly from the canonical skill name.
    const skillOption = this.page
      .getByRole("button", { name: new RegExp(skill, "i") })
      .or(this.page.locator("button").filter({ hasText: new RegExp(skill, "i") }))
      .first();
    await expect(skillOption).toBeVisible({ timeout: 20000 });
    await skillOption.scrollIntoViewIfNeeded().catch(() => {});
    await skillOption.click();
  }
}