import { TrackMeta } from "@/lib/types";
import { LANGUAGE_LESSONS } from "./languages";
import { AI_CODING_LESSONS } from "./ai-coding";
import { AUTOMATION_LESSONS } from "./automation";
import { MATH_LESSONS } from "./math";

export const ALL_TRACKS: TrackMeta[] = [
  {
    id: "language",
    title: "Natural & Symbolic Languages",
    subtitle: "Grammar, Polyglot Vocabulary & LLM Semantics",
    description:
      "Bridge human languages (Spanish, Japanese, French) with the symbolic foundations of computer science, tokens, and semantic embeddings.",
    badge: "Linguistics & Semantics",
    iconName: "Globe2",
    accentColor: "from-blue-500 to-cyan-500",
    gradient: "bg-gradient-to-br from-blue-900/40 via-cyan-900/20 to-card",
    stats: {
      lessonsCount: LANGUAGE_LESSONS.length,
      exercisesCount: 15,
      completionPoints: 250,
    },
    lessons: LANGUAGE_LESSONS,
  },
  {
    id: "ai-coding",
    title: "AI Coding & Agent Engineering",
    subtitle: "Prompt Architecture, ReAct Loops & Tool-Calling",
    description:
      "Learn how to prompt, build, and orchestrate autonomous AI agents that write code, solve bugs, and call external tools.",
    badge: "AI Engineering",
    iconName: "Bot",
    accentColor: "from-purple-500 to-indigo-500",
    gradient: "bg-gradient-to-br from-purple-900/40 via-indigo-900/20 to-card",
    stats: {
      lessonsCount: AI_CODING_LESSONS.length,
      exercisesCount: 10,
      completionPoints: 300,
    },
    lessons: AI_CODING_LESSONS,
  },
  {
    id: "automation",
    title: "Practical Systems Automation",
    subtitle: "Event Triggers, Webhooks & Automated Pipelines",
    description:
      "Automate repetitive tasks by connecting APIs, filters, schedules, and AI models into reliable end-to-end event-driven workflows.",
    badge: "Pipelines & Webhooks",
    iconName: "Workflow",
    accentColor: "from-emerald-500 to-teal-500",
    gradient: "bg-gradient-to-br from-emerald-900/40 via-teal-900/20 to-card",
    stats: {
      lessonsCount: AUTOMATION_LESSONS.length,
      exercisesCount: 8,
      completionPoints: 200,
    },
    lessons: AUTOMATION_LESSONS,
  },
  {
    id: "math",
    title: "Simple Mathematics & Visual Logic",
    subtitle: "Equations, Proportions, Growth & Geometric Solvers",
    description:
      "Master the intuitive mathematical foundations—linear equations, exponential growth, geometry, and vector distances—that power modern algorithms.",
    badge: "Visual Mathematics",
    iconName: "Calculator",
    accentColor: "from-amber-500 to-orange-500",
    gradient: "bg-gradient-to-br from-amber-900/40 via-orange-900/20 to-card",
    stats: {
      lessonsCount: MATH_LESSONS.length,
      exercisesCount: 12,
      completionPoints: 250,
    },
    lessons: MATH_LESSONS,
  },
];

export function getTrackById(id: string): TrackMeta | undefined {
  return ALL_TRACKS.find((t) => t.id === id);
}

export function getLessonById(lessonId: string) {
  for (const track of ALL_TRACKS) {
    const lesson = track.lessons.find((l) => l.id === lessonId);
    if (lesson) {
      return { track, lesson };
    }
  }
  return null;
}
