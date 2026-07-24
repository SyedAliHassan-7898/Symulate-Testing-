import { faker } from '@faker-js/faker';
import { Task } from 'src/models';

export class TaskFactory {

  static createRolePlay(): Task {

    const timestamp = Date.now();

    return {

      taskName: `Leadership Communication ${timestamp}`,

      thumbnail: 'src/assets/task image.jpg',

      permissionLevel: 'Entry-level individual',

      description:
        'In this role-play scenario, you will participate in a critical business discussion. As a team member, your task is to address a conflict with a colleague regarding project deadlines while maintaining professionalism. You must communicate your concerns clearly, listen actively, and work towards a mutually beneficial resolution. This assessment evaluates your communication skills, emotional intelligence, and ability to handle workplace challenges effectively.',

      skills: ['Problem Solving', 'Analytical Thinking'],

      persona: 'Gabriel',

      contactTitle: 'Regional Director',

      behaviouralRules:
        'Stay in character as the stakeholder. Challenge unclear answers, ask for practical next steps, and keep the role-play focused on communication, ownership, and resolution.'

    };
  }

  static createInterview(): Task {

    const timestamp = Date.now();

    return {

      taskName: `Professional Interview ${timestamp}`,

      thumbnail: 'src/assets/task image.jpg',

      permissionLevel: 'Entry-level individual',

      description:
        'You will take part in a structured interview for a professional role. Answer each question with clear examples, explain your decision-making process, and communicate your experience with confidence and professionalism. This assessment evaluates problem solving, analytical thinking, and workplace communication.',

      skills: ['Problem Solving', 'Analytical Thinking'],

      persona: 'Gabriel',

      contactTitle: 'Hiring Manager',

      duration: '15',

      welcomeMessage:
        "Hi, I'm Gabriel, your interviewer for this assessment. I will ask practical questions about your experience, communication style, and approach to solving workplace challenges.",

      personaRole:
        'Professional and approachable hiring manager who asks structured interview questions, listens carefully, and follows up when more detail is needed.',

      behaviouralRules:
        'Ask one question at a time. Keep the conversation focused on the interview. Encourage specific examples and maintain a calm, fair, and professional tone.'

    };
  }

  static createCaseStudy(): Task {
    const timestamp = Date.now();

    return {
      taskName: `Strategic Case Study ${timestamp}`,
      thumbnail: 'src/assets/task image.jpg',
      permissionLevel: 'Entry-level individual',
      description:
        'Review a business case involving declining customer retention and propose a practical action plan. Explain the key risks, trade-offs, assumptions, and success metrics you would use to guide the decision.',
      skills: ['Problem Solving', 'Analytical Thinking'],
      persona: 'Gabriel',
      contactTitle: 'Strategy Lead',
      duration: '20',
      welcomeMessage:
        "Hi, I'm Gabriel. I will guide you through this case study and ask you to explain your analysis and recommendation.",
      personaRole:
        'Strategic business stakeholder who asks clear follow-up questions about reasoning, trade-offs, and implementation detail.',
      behaviouralRules:
        'Keep the discussion focused on the case. Ask for structured reasoning, practical recommendations, and measurable outcomes.',
      emailName: 'Customer Retention Update',
      emailSender: 'case.exercise@yopmail.com',
      emailJobTitle: 'Customer Success Lead',
      emailSubject: 'Retention metrics need review',
      emailBody:
        'The latest customer retention metrics show a downward trend in two important segments. Please review the data, identify likely causes, and recommend next steps for leadership.'
    };
  }

  static createSituation(): Task {
    const timestamp = Date.now();

    return {
      taskName: `Workplace Situation ${timestamp}`,
      thumbnail: 'src/assets/task image.jpg',
      situationVideo: 'tests/assets/situation-video.mp4',
      permissionLevel: 'Entry-level individual',
      description:
        'Respond to a workplace situation where priorities shift suddenly and several stakeholders need updates. Describe how you would assess urgency, communicate changes, and keep the work moving.',
      skills: ['Problem Solving', 'Analytical Thinking'],
      persona: 'Gabriel',
      contactTitle: 'Operations Manager',
      duration: '15',
      welcomeMessage:
        "Hi, I'm Gabriel. I will present a workplace situation and ask how you would respond.",
      personaRole:
        'Practical operations manager who evaluates judgment, communication, prioritization, and ownership.',
      behaviouralRules:
        'Present one situation at a time. Ask the candidate to explain their decision process and expected communication steps.'
    };
  }

  static createBoardMeeting(): Task {
    const timestamp = Date.now();

    return {
      taskName: `Executive Board Meeting ${timestamp}`,
      thumbnail: 'src/assets/task image.jpg',
      permissionLevel: 'Entry-level individual',
      description:
        'Prepare for an executive board meeting where you must summarize performance, address risks, and recommend next steps. Communicate clearly, defend your reasoning, and respond to stakeholder questions.',
      skills: ['Problem Solving', 'Analytical Thinking'],
      // Board Meeting uses multiple personas
      persona: ['Gabriel', 'Sophie Adams', 'Adams'],
      contactTitle: 'Board Chair',
      duration: '20',
      welcomeMessage:
        "Hi, I'm Gabriel, the board chair for this simulation. I will ask questions about your recommendations and rationale.",
      personaRole:
        'Direct but fair board chair who probes strategic thinking, evidence, risks, and confidence in recommendations.',
      behaviouralRules:
        'Ask concise executive-level questions. Challenge assumptions respectfully and keep the meeting focused on decisions.'
    };
  }

  static createWelcome(): Task {
    const timestamp = Date.now();

    return {
      taskName: `Welcome Simulation ${timestamp}`,
      thumbnail: 'src/assets/task image.jpg',
      permissionLevel: 'Entry-level individual',
      description:
        'Welcome the candidate to the assessment, explain what to expect, and set a clear professional tone for the simulation experience.',
      skills: ['Problem Solving', 'Analytical Thinking'],
      persona: 'Gabriel',
      contactTitle: 'Assessment Host',
      duration: '10',
      welcomeMessage:
        "Hi, I'm Gabriel. Welcome to this assessment. I will help introduce the simulation and make sure the expectations are clear.",
      personaRole:
        'Warm and professional assessment host who explains the task clearly and keeps the candidate comfortable.',
      behaviouralRules:
        'Keep the introduction concise, friendly, and focused on what the candidate should expect.'
    };
  }

}