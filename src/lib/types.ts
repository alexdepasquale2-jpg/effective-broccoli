export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-indexed
  explanation: string;
  codeSnippet?: string;
}

export interface LessonContent {
  id: string;
  title: string;
  summary: string;
  readTime: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: "language" | "ai-coding" | "automation" | "math";
  markdown: string;
  interactiveType?: "code-runner" | "flashcards" | "prompt-eval" | "math-visualizer" | "automation-builder";
  interactiveData?: Record<string, any>;
  quiz?: QuizQuestion[];
}

export interface TrackMeta {
  id: "language" | "ai-coding" | "automation" | "math";
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  iconName: string;
  accentColor: string; // Tailwind color class
  gradient: string;
  stats: {
    lessonsCount: number;
    exercisesCount: number;
    completionPoints: number;
  };
  lessons: LessonContent[];
}
