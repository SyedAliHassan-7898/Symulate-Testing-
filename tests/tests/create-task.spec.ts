import { expect, test } from "@playwright/test";

import { TaskFactory } from "@data/factories/TaskFactory";
import { ClientPage } from "@pages/client/ClientPage";
import { CreateClientPage } from "@pages/client/CreateClientPage";
import { AccountPage } from "@pages/client/AccountPage";
import { SkillsProfilePage } from "@pages/client/SkillsProfilePage";
import { ProjectPage } from "@pages/client/ProjectPage";
import { BoardMeetingTask } from "@pages/tasks/BoardMeetingTask";
import { CaseStudyTask } from "@pages/tasks/CaseStudyTask";
import { InterviewTask } from "@pages/tasks/InterviewTask";
import { RolePlayTask } from "@pages/tasks/RolePlayTask";
import { SituationTask } from "@pages/tasks/SituationTask";
import { TaskPage } from "@pages/tasks/TaskPage";
import { WelcomeTask } from "@pages/tasks/WelcomeTask";

// This flow creates a client, six task types, an account, a skills profile and
// a project. It is heavy, but 10 minutes is a generous cap: it prevents a
// single stuck locator from burning 15 minutes (then another 15 on retry).
test.setTimeout(600000);

test("Create all task types for a newly created client", async ({ page }) => {
  const taskPage = new TaskPage(page);
  const clientPage = new ClientPage(page);
  const createClientPage = new CreateClientPage(page);

  const uniqueId = Date.now();
  const dynamicClientName = `Automated Org ${uniqueId}`;
  const dynamicAdminEmail = `org_${uniqueId}@yopmail.com`;

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

  const taskCreators = [
    {
      pageObject: new RolePlayTask(page),
      data: TaskFactory.createRolePlay(),
    },
    {
      pageObject: new InterviewTask(page),
      data: TaskFactory.createInterview(),
    },
    {
      pageObject: new CaseStudyTask(page),
      data: TaskFactory.createCaseStudy(),
    },
    {
      pageObject: new SituationTask(page),
      data: TaskFactory.createSituation(),
    },
    {
      pageObject: new BoardMeetingTask(page),
      data: TaskFactory.createBoardMeeting(),
    },
    {
      pageObject: new WelcomeTask(page),
      data: TaskFactory.createWelcome(),
    },
  ];

  for (const taskCreator of taskCreators) {
    await taskPage.open();
    await taskCreator.pageObject.create(taskCreator.data);
  }

  // Assign all created tasks to the new client
  for (const taskCreator of taskCreators) {
    await taskPage.assignTaskToClient(taskCreator.data.taskName, dynamicClientName);
  }

  await clientPage.open();
  await clientPage.enableIntelligenceForClient(dynamicClientName);
  const clientPortalPage = await clientPage.impersonateClient(dynamicClientName);

  await clientPortalPage.getByRole("link", { name: "Tasks" }).click();
  await clientPortalPage.waitForTimeout(1000);

  const tabs = ["Welcome", "Role Play", "Interview", "Situation", "Board Meeting", "Case Exercise"];
  for (const tab of tabs) {
    const tabLocator = clientPortalPage.getByRole("tab", { name: tab });
    await expect(tabLocator).toBeVisible({ timeout: 10000 });
    await tabLocator.click();
    await clientPortalPage.waitForTimeout(500);
  }

  // Create client account in portal
  const accountPage = new AccountPage(clientPortalPage);
  await accountPage.createAccount("Accounts Manager");

  // Create a Skills Profile (distinct from the Account above) so the
  // Project wizard's "Select Skills Profile" dialog has something to pick
  const skillsProfilePage = new SkillsProfilePage(clientPortalPage);
  await skillsProfilePage.create({
    title: "Accounts Manager",
    description:
      "Supports daily operational activities by completing assigned tasks accurately and on time while working collaboratively with team members. Follows established processes, communicates effectively, demonstrates a strong willingness to learn, and contributes consistently to team goals and objectives every day.",
    permissionLevel: "Entry-level individual contributor",
    skills: ["Problem Solving", "Analytical Thinking"],
  });

  // Create a project, assign all created tasks to it, upload candidates, and send invites
  const projectPage = new ProjectPage(clientPortalPage);
  await projectPage.create({
    accountTitle: "Accounts Manager",
    projectName: `Agenda Discussion ${uniqueId}`,
    skillsProfileTitle: "Accounts Manager",
    taskNames: taskCreators.map((taskCreator) => taskCreator.data.taskName),
    candidateFile: "src/assets/candidate_template (1).csv",
    inviteTemplate: "Assessment Invite",
  });

  console.log(
    `>>> COMPLETED CLIENT INTELLIGENCE AND IMPERSONATION FLOW FOR: ${dynamicClientName}`,
  );
});