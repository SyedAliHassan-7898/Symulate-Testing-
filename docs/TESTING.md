# Writing & Organizing Playwright Tests

## Where a new spec goes

- `tests/tests/` - a business flow spanning multiple screens (create a
  client, then a task, then assign it, etc.)
- `tests/ui/` - a single-screen or UI-behavior check
- `tests/auth/` - only `login.setup.ts` lives here; don't add specs here,
  it's the Playwright `setup` project, not a `test()` file

## Writing a spec

```ts
import { expect, test } from '@playwright/test';
import { SomePage } from '@pages/.../SomePage';

test('describes the behavior being checked', async ({ page }) => {
  const somePage = new SomePage(page);
  await somePage.open();
  await somePage.doSomething({ ...config });
  await expect(page.getByText('Expected result')).toBeVisible();
});
```

- Import Page Objects via the `@pages/...` path alias (see `tsconfig.json`
  paths), not relative `../../src/pages/...` paths.
- Check the actual method signature on the Page Object class before
  calling it - `grep -n "async " src/pages/.../SomePage.ts` is the fastest
  way to confirm what's available and what arguments it takes. A couple of
  classes share names across folders (see
  [`docs/ARCHITECTURE.md`](ARCHITECTURE.md#page-object-model)); make sure
  the import path matches the method call you're making.
- Reuse the authenticated session (default `chromium` project) instead of
  logging in per-spec, unless the spec is specifically about auth/login.

## Running what you wrote

```bash
npx playwright test tests/tests/your-new-spec.spec.ts
npx playwright test tests/tests/your-new-spec.spec.ts --headed   # watch it
npx playwright test tests/tests/your-new-spec.spec.ts --debug     # step through
```

## Running the whole suite

```bash
npm run test:all:full   # every spec, headless
```

## Timeouts

Global default comes from `.env` → `TIMEOUT` (read in
`playwright.config.ts`). A single long, multi-step flow can override it
per-test:
```ts
test.setTimeout(15 * 60 * 1000); // 15 minutes, for this test only
```
Prefer breaking a very long flow into smaller, independent specs over
raising the timeout further - a failure partway through a 15+ minute test
wastes the entire run, whereas smaller specs fail fast and independently.

## Reports

```bash
npm run report   # opens reports/html - screenshots/video/trace attached on failure
```
