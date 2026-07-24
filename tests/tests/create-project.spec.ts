import { expect, test } from "@playwright/test";

import { TaskFactory } from "@data/factories/TaskFactory";
import { ClientPage } from "@pages/client/ClientPage";
import { CreateClientPage } from "@pages/client/CreateClientPage";
import { AccountPage } from "@pages/client/AccountPage";
import { SkillsProfilePage } from "@pages/client/SkillsProfilePage";
import { ProjectPage } from "@pages/project/ProjectPage";
import { BoardMeetingTask } from "@pages/tasks/BoardMeetingTask";
import { WelcomeTask } from "@pages/tasks/WelcomeTask";
import { RolePlayTask } from "@pages/tasks/RolePlayTask";
import { InterviewTask } from "@pages/tasks/InterviewTask";
import { SituationTask } from "@pages/tasks/SituationTask";
import { CaseStudyTask } from "@pages/tasks/CaseStudyTask";
import { TaskPage } from "@pages/tasks/TaskPage";

// This flow creates a client, six task types, an account, a skills profile and
// a project. It is heavy, but 10 minutes is a generous cap: it prevents a
// single stuck locator from burning 15 minutes (then another 15 on retry).
test.setTimeout(600000);

test("Create client, tasks, account, skills profile and project flow", async ({ page }) => {
  const taskPage = new TaskPage(page);
  const clientPage = new ClientPage(page);
  const createClientPage = new CreateClientPage(page);

  const uniqueId = Date.now();
  const dynamicClientName = `Project Org ${uniqueId}`;
  const dynamicAdminEmail = `project_org_${uniqueId}@yopmail.com`;

  // 1. Create client
  await clientPage.open();
  await clientPage.clickCreateClient();
  await createClientPage.create({
    clientName: dynamicClientName,
    adminName: "Executive Management Admin",
    adminEmail: dynamicAdminEmail,
  });

  await expect(page.getByText("Created Successfully")).toBeVisible({
    timeout: 10000,
  });
  await expect(
    page.getByRole("cell", { name: dynamicClientName, exact: true }),
  ).toBeVisible();

  // 2. Prepare task data; tasks will be created by super-admin and assigned to the client
  const welcomeTaskData = TaskFactory.createWelcome();
  const boardMeetingTaskData = TaskFactory.createBoardMeeting();
  const rolePlayTaskData = TaskFactory.createRolePlay();
  const interviewTaskData = TaskFactory.createInterview();
  const situationTaskData = TaskFactory.createSituation();
  const caseStudyTaskData = TaskFactory.createCaseStudy();

  // 3. As super-admin create all task types and assign them to the newly created client
  const welcomeTaskMain = new WelcomeTask(page);
  const boardMeetingTaskMain = new BoardMeetingTask(page);
  const rolePlayTaskMain = new RolePlayTask(page);
  const interviewTaskMain = new InterviewTask(page);
  const situationTaskMain = new SituationTask(page);
  const caseStudyTaskMain = new CaseStudyTask(page);

  await taskPage.open();
  await welcomeTaskMain.create(welcomeTaskData);
  await taskPage.assignTaskToClient(welcomeTaskData.taskName, dynamicClientName);

  await taskPage.open();
  await boardMeetingTaskMain.create(boardMeetingTaskData);
  await taskPage.assignTaskToClient(boardMeetingTaskData.taskName, dynamicClientName);

  await taskPage.open();
  await rolePlayTaskMain.create(rolePlayTaskData);
  await taskPage.assignTaskToClient(rolePlayTaskData.taskName, dynamicClientName);

  await taskPage.open();
  await interviewTaskMain.create(interviewTaskData);
  await taskPage.assignTaskToClient(interviewTaskData.taskName, dynamicClientName);

  await taskPage.open();
  await situationTaskMain.create(situationTaskData);
  await taskPage.assignTaskToClient(situationTaskData.taskName, dynamicClientName);

  await taskPage.open();
  await caseStudyTaskMain.create(caseStudyTaskData);
  await taskPage.assignTaskToClient(caseStudyTaskData.taskName, dynamicClientName);

  // 4. Enable intelligence and impersonate
  await clientPage.open();
  await clientPage.enableIntelligenceForClient(dynamicClientName);
  const clientPortalPage = await clientPage.impersonateClient(dynamicClientName);

  // 5. Create client account
  const accountPage = new AccountPage(clientPortalPage);
  await accountPage.createAccount("Accounts Manager");

  // 6. Create Skills Profile
  const skillsProfilePage = new SkillsProfilePage(clientPortalPage);
  await skillsProfilePage.create({
    title: "Accounts Manager",
    permissionLevel: "Mid-level individual contributor",
    description:
      "As an entry-level Account Manager, you will be responsible for managing key client relationships, handling daily communications, addressing inquiries promptly, and driving customer satisfaction. You will work closely with the team to identify upselling opportunities and support account renewals to ensure long-term client retention and business growth.",
    skills: ["Problem Solving", "Analytical Thinking"]
  });
  // (Tasks already created and assigned by super-admin)

  // 5. Create Project
  const projectPage = new ProjectPage(clientPortalPage);
  await projectPage.createProject(
    "Tester Project",
    "Accounts Manager",
    "Accounts Manager",
    [
      welcomeTaskData.taskName,
      boardMeetingTaskData.taskName,
      rolePlayTaskData.taskName,
      interviewTaskData.taskName,
      situationTaskData.taskName,
      caseStudyTaskData.taskName,
    ],
    { csvPath: 'tests/assets/candidates.csv' }
  );

  console.log(
    `>>> COMPLETED SKILLS PROFILE AND PROJECT CREATION FLOW FOR: ${dynamicClientName}`,
  );
});
