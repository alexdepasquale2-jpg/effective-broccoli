import { notFound } from "next/navigation";
import Link from "next/link";
import { getLessonById, ALL_TRACKS } from "@/lib/curriculum";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguagePlayground } from "@/components/playgrounds/LanguagePlayground";
import { CodePlayground } from "@/components/playgrounds/CodePlayground";
import { MathPlayground } from "@/components/playgrounds/MathPlayground";
import { AutomationPlayground } from "@/components/playgrounds/AutomationPlayground";
import { QuizBlock } from "@/components/curriculum/QuizBlock";
import { ChevronLeft, Sparkles, BookOpen, Clock, Lightbulb } from "lucide-react";

export async function generateStaticParams() {
  const params: { trackId: string; lessonId: string }[] = [];
  for (const track of ALL_TRACKS) {
    for (const lesson of track.lessons) {
      params.push({ trackId: track.id, lessonId: lesson.id });
    }
  }
  return params;
}

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ trackId: string; lessonId: string }>;
}) {
  const { trackId, lessonId } = await params;
  const result = getLessonById(lessonId);

  if (!result || result.track.id !== trackId) {
    notFound();
  }

  const { track, lesson } = result;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 space-y-8">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link href={`/tracks/${track.id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
            <ChevronLeft className="w-4 h-4" /> Back to {track.title}
          </Button>
        </Link>
        <Badge variant="cyan">{track.badge}</Badge>
      </div>

      {/* Lesson Header */}
      <div className="space-y-3 border-b border-border/80 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Badge variant={lesson.level === "Beginner" ? "success" : "purple"}>
            {lesson.level}
          </Badge>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {lesson.readTime}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {lesson.title}
        </h1>
        <p className="text-muted-foreground text-sm max-w-3xl leading-relaxed">{lesson.summary}</p>
      </div>

      {/* Lesson Core Textual Theory */}
      <div className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-code:text-cyan-300 prose-pre:bg-black/80 prose-pre:border prose-pre:border-border text-sm leading-relaxed text-slate-200">
        <div
          dangerouslySetInnerHTML={{
            __html: formatMarkdownToHTML(lesson.markdown),
          }}
        />
      </div>

      {/* Interactive Playground Sandbox */}
      <div className="pt-8 border-t border-border/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Live Interactive Sandbox
            </h2>
          </div>
          <Badge variant="outline" className="text-xs">
            Hands-On Practice
          </Badge>
        </div>

        {lesson.interactiveType === "flashcards" && (
          <LanguagePlayground initialLanguage={lesson.interactiveData?.defaultLanguage || "spanish"} />
        )}

        {lesson.interactiveType === "code-runner" && (
          <CodePlayground defaultTemplateId={lesson.interactiveData?.templateId || "prompt-parser"} />
        )}

        {lesson.interactiveType === "math-visualizer" && (
          <MathPlayground defaultFormulaId={lesson.interactiveData?.defaultFormulaId || "linear-equation"} />
        )}

        {lesson.interactiveType === "automation-builder" && (
          <AutomationPlayground defaultWorkflowId={lesson.interactiveData?.defaultWorkflowId || "lead-enrichment"} />
        )}
      </div>

      {/* Quiz Verification Checkpoint */}
      {lesson.quiz && lesson.quiz.length > 0 && <QuizBlock questions={lesson.quiz} />}
    </div>
  );
}

// Lightweight Markdown to HTML transformer for safe rendering
function formatMarkdownToHTML(markdown: string): string {
  let html = markdown
    // Code blocks
    .replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre class="p-4 rounded-xl font-mono text-xs overflow-x-auto bg-black/90 border border-border my-4"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-secondary font-mono text-xs text-cyan-300 border border-border/60">$1</code>')
    // Headings
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3 text-foreground">$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4 class="text-lg font-semibold mt-4 mb-2 text-foreground">$1</h4>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em class="italic text-slate-300">$1</em>')
    // Lists
    .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-slate-300">$1</li>')
    // Newlines
    .replace(/\n\n/g, '<p class="my-3 text-slate-300 leading-relaxed"></p>');

  return html;
}
