export interface Task {
  taskName: string;
  thumbnail: string;
  permissionLevel: string;
  description: string;
  skills: string[];
  // For some task types (e.g. Board Meeting) multiple personas may be selected
  persona: string | string[];
  contactTitle: string;
  interviewType?: string;
  duration?: string;
  questionCount?: number;
  difficulty?: string;
  welcomeMessage?: string;
  personaRole?: string;
  behaviouralRules?: string;
  emailName?: string;
  emailSender?: string;
  emailJobTitle?: string;
  emailSubject?: string;
  emailBody?: string;
  situationVideo?: string;
}

