import { LessonContent } from "@/lib/types";

export interface AutomationNode {
  id: string;
  type: "trigger" | "filter" | "transform" | "ai_action" | "notify";
  title: string;
  config: Record<string, any>;
  icon: string;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  nodes: AutomationNode[];
  samplePayload: Record<string, any>;
}

export const SAMPLE_WORKFLOWS: AutomationWorkflow[] = [
  {
    id: "lead-enrichment",
    name: "AI Inquiry Classifier & Responder",
    description: "Detect incoming student questions, classify difficulty, and generate tailored explanations automatically.",
    samplePayload: {
      studentName: "Alex",
      questionText: "Can you explain how 2x + 6 = 14 works step by step?",
      languagePreference: "English",
    },
    nodes: [
      {
        id: "node-1",
        type: "trigger",
        title: "Trigger: New Student Question Received",
        icon: "Mail",
        config: { event: "student_inquiry_created" },
      },
      {
        id: "node-2",
        type: "transform",
        title: "Normalize & Extract Math Keywords",
        icon: "Cpu",
        config: { extract: ["equation", "difficulty", "studentName"] },
      },
      {
        id: "node-3",
        type: "ai_action",
        title: "AI Step-by-Step Solver & Explainer",
        icon: "Bot",
        config: { model: "claude-3-5-sonnet", task: "solve_with_pedagogy" },
      },
      {
        id: "node-4",
        type: "notify",
        title: "Dispatch Response to Student Portal",
        icon: "Send",
        config: { channel: "student_dashboard" },
      },
    ],
  },
  {
    id: "daily-vocab-digest",
    name: "Polyglot Daily Vocabulary Automation",
    description: "Pull daily tech concepts, translate into Japanese & Spanish, and schedule flashcards.",
    samplePayload: {
      word: "Recursion",
      domain: "Computer Science",
    },
    nodes: [
      {
        id: "node-1",
        type: "trigger",
        title: "Cron: Daily 8:00 AM UTC",
        icon: "Clock",
        config: { schedule: "0 8 * * *" },
      },
      {
        id: "node-2",
        type: "ai_action",
        title: "Generate Contextual Translations & Idioms",
        icon: "Globe",
        config: { languages: ["Spanish", "Japanese", "French"] },
      },
      {
        id: "node-3",
        type: "notify",
        title: "Push to Mobile & Web Flashcards",
        icon: "Bell",
        config: { destination: "user_deck" },
      },
    ],
  },
];

export const AUTOMATION_LESSONS: LessonContent[] = [
  {
    id: "automation-fundamentals",
    title: "1. Event-Driven Automation: Triggers, Filters & Actions",
    summary:
      "Understand the mechanics of modern workflows (like Zapier, Make, and custom webhook architectures) powered by programmatic logic.",
    readTime: "5 min",
    level: "Beginner",
    category: "automation",
    markdown: `
### The 3 Core Pillars of Automated Systems

Modern software automation connects isolated systems into cohesive, self-executing pipelines:

1. **Trigger (When this happens)**:
   - Polling / Cron: Checks for updates on a timer (e.g., every hour).
   - Webhook: Instant push notification when an event occurs in real-time.
2. **Filter & Condition (If this criteria is met)**:
   - Evaluates boolean logic: \`IF amount > 50 AND status === 'CONFIRMED'\`.
3. **Action (Do this)**:
   - Makes HTTP requests, triggers database updates, calls AI endpoints, or sends alerts.

\`\`\`
[Webhook Trigger: Form Submission] 
             │
             ▼
[Filter: Is Question Valid?] ──(No)──► [Log & Discard]
             │ (Yes)
             ▼
[AI Action: Solve & Format]
             │
             ▼
[Action: Email Solution]
\`\`\`
`,
    interactiveType: "automation-builder",
    interactiveData: {
      defaultWorkflowId: "lead-enrichment",
    },
    quiz: [
      {
        id: "auto-1",
        question: "What is the key advantage of Webhooks over Polling?",
        options: [
          "Webhooks push event data in real-time as soon as it occurs, saving compute and network bandwidth.",
          "Webhooks only work on desktop computers.",
          "Polling is always faster than real-time push.",
          "Webhooks require no network connection.",
        ],
        correctAnswer: 0,
        explanation:
          "Webhooks are push-based event listeners. Rather than querying an API repeatedly every few seconds, the server sends a POST payload instantly when the event triggers.",
      },
    ],
  },
];
