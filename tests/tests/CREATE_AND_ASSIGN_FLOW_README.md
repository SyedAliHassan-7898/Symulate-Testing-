# Complete Task Creation and Assignment Flow Test

## Overview

This test (`tests/tests/create-task.spec.ts`) implements the complete workflow for creating a client, generating all task types, enabling intelligence features, and verifying task availability in the client portal.

## Test Flow

### 1. **Login & Session Management**

- Automatically handled via Playwright's setup-based authentication
- Session stored in `playwright/.auth/user.json`
- Login credentials configured in environment variables
- Persists for the entire test execution

### 2. **Create Dynamic Client**

- Generates unique client name: `Automated Org {timestamp}`
- Creates unique admin email: `org_{timestamp}@yopmail.com`
- Verifies client creation success

### 3. **Create All Task Types**

Creates 6 different assessment task types:

- **Role Play** - Interpersonal communication scenarios
- **Interview** - Structured interview assessment
- **Situation** - Workplace situation response assessment
- **Case Exercise** - Complex problem-solving scenarios with emails and assets
- **Welcome** - Assessment introduction and onboarding
- **Board Meeting** - Executive-level simulation with multiple personas

Each task includes:

- Thumbnail/banner image (from `src/assets/task image.jpg`)
- Permission level (Entry-level individual, Mid-level individual, Senior individual contributor)
- Skills assessment (Problem Solving, Analytical Thinking)
- Persona assignment (Gabriel, etc.)
- Custom contact titles and behavioral rules
- Time allocation

### 4. **Enable Intelligence Feature**

- Navigates to Clients page
- Enables AI Intelligence toggle for the newly created client
- Verifies the toggle state

### 5. **Impersonate Client Portal**

- Switches to client admin view
- Accesses the client portal as the newly created organization admin
- Verifies all created tasks are available in the client assessment library

### 6. **Verify Task Availability**

- Confirms all 6 task types appear as tabs in the client portal
- Validates task accessibility and visibility

## Running the Test

### Prerequisites

1. Install dependencies: `npm install`
2. Install browsers: `npm run install:browsers`
3. Set up environment variables in `.env`:
   ```
   BASE_URL=https://superadmin.symulate-dev.weuno.co
   HEADLESS=true
   WORKERS=1
   TIMEOUT=120000
   ```

### Run the Test

```bash
# Run the specific test
npm test -- --grep "Complete Task Creation and Assignment Flow"

# Run with UI mode for debugging
npm run ui -- tests/tests/create-task.spec.ts

# Run in headed mode to see browser
npm run headed -- tests/tests/create-task.spec.ts

# Run in debug mode with inspector
npm run debug -- tests/tests/create-task.spec.ts
```

### Test Configuration

- **Timeout**: 30 minutes (1,800,000 ms) - allows time for all task creations
- **Workers**: 1 (sequential execution)
- **Retries**: 1 (configured in playwright.config.ts)
- **Screenshots**: On failure only
- **Video**: Retained on failure
- **Trace**: Retained on failure

## Test Data & Page Objects

### Used Factories

- `TaskFactory` - Generates realistic task data with:
  - Random task names with timestamps
  - Detailed descriptions and scenarios
  - Skill selections
  - Persona configurations
  - Time allocations

### Used Page Objects

- `ClientPage` - Client management and impersonation
- `CreateClientPage` - Client creation form
- `TaskPage` - Base task creation page
- `RolePlayTask` - Role play scenario creation
- `InterviewTask` - Interview assessment creation
- `SituationTask` - Situation-based assessment creation
- `CaseStudyTask` - Case exercise with email and assets
- `WelcomeTask` - Welcome assessment creation
- `BoardMeetingTask` - Board meeting simulation creation

## Output & Logging

The test includes detailed console logging at each step:

```
>>> Starting test for client: Automated Org {timestamp}
>>> STEP 1: Creating new client...
>>> Client created successfully: Automated Org {timestamp}
>>> STEP 2: Creating all task types...
>>> Creating Role Play task...
>>> Role Play task created successfully
>>> ... (similar for all other task types)
>>> STEP 3: Enabling intelligence for client...
>>> Intelligence enabled successfully
>>> STEP 4: Impersonating client...
>>> Client impersonation successful
>>> STEP 5: Verifying all tasks in client portal...
>>> Verified {TaskType} task is available
>>> All tasks verified in client portal
>>> COMPLETED FULL FLOW FOR: Automated Org {timestamp}
```

## Reports & Artifacts

After test execution, results are available in:

- **HTML Report**: `reports/html/index.html`
- **Screenshots**: `reports/screenshots/` (on failure only)
- **Videos**: `reports/videos/` (on failure only)
- **Traces**: `reports/traces/` (for debugging, on failure only)

View the HTML report:

```bash
npm run report
```

## Troubleshooting

### Test Timeout

If the test times out:

1. Increase timeout in test file: `test.setTimeout(timeout_in_ms)`
2. Check network conditions
3. Verify server is running and responsive

### Login Issues

- Verify credentials in `.env` file
- Check if `playwright/.auth/user.json` needs to be deleted and regenerated
- Run setup: `npm test tests/auth/login.setup.ts`

### File Upload Issues

- Ensure `src/assets/task image.jpg` exists
- Verify file paths are relative to project root
- Check browser has proper permissions for file operations

### Task Creation Failures

- Check if task type names match exactly (case-sensitive)
- Verify persona names are available
- Ensure skills exist in the system

## Success Criteria

The test is considered successful when:
✓ Client is created with unique identifier
✓ All 6 task types are created without errors
✓ Intelligence toggle is enabled for the client
✓ Client portal loads successfully
✓ All 6 task tabs are visible in client portal
✓ No timeout or assertion failures occur

## Notes

- **Session Persistence**: The test uses Playwright's built-in session persistence. The login happens once in `login.setup.ts`, and all tests reuse that session.
- **Unique Client Names**: Each test execution creates a unique client using timestamps to prevent conflicts.
- **Task Data**: TaskFactory generates unique task names with timestamps, ensuring no duplicates across test runs.
- **Impersonation**: The test demonstrates full workflow from admin setup to client user verification.
