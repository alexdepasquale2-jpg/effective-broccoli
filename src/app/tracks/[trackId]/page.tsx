import { notFound } from "next/navigation";
import Link from "next/link";
import { getTrackById, ALL_TRACKS } from "@/lib/curriculum";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe2,
  Bot,
  Workflow,
  Calculator,
  ArrowRight,
  BookOpen,
  Clock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export async function generateStaticParams() {
  return ALL_TRACKS.map((t) => ({ trackId: t.id }));
}

export default async function TrackDetailPage({ params }: { params: Promise<{ trackId: string }> }) {
  const { trackId } = await params;
  const track = getTrackById(trackId);

  if (!track) {
    notFound();
  }

  const getTrackIcon = (iconName: string) => {
    switch (iconName) {
      case "Globe2":
        return <Globe2 className="w-8 h-8 text-cyan-400" />;
      case "Bot":
        return <Bot className="w-8 h-8 text-purple-400" />;
      case "Workflow":
        return <Workflow className="w-8 h-8 text-emerald-400" />;
      case "Calculator":
      default:
        return <Calculator className="w-8 h-8 text-amber-400" />;
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      {/* Track Header Banner */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-6 sm:p-8 backdrop-blur-md mb-10 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="p-3.5 rounded-2xl bg-secondary/80 border border-border">
            {getTrackIcon(track.iconName)}
          </div>
          <Badge variant="cyan" className="text-xs">
            {track.badge}
          </Badge>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {track.title}
        </h1>
        <p className="text-sm font-mono text-cyan-400 mt-1">{track.subtitle}</p>
        <p className="text-muted-foreground text-sm mt-3 max-w-3xl leading-relaxed">
          {track.description}
        </p>

        <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-border/60 text-center font-mono text-xs">
          <div className="p-2.5 rounded-lg bg-secondary/40">
            <p className="text-muted-foreground text-[10px] uppercase">Modules</p>
            <p className="text-base font-bold text-foreground mt-0.5">{track.lessons.length}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-secondary/40">
            <p className="text-muted-foreground text-[10px] uppercase">Exercises</p>
            <p className="text-base font-bold text-emerald-400 mt-0.5">
              {track.stats.exercisesCount} Challenges
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-secondary/40">
            <p className="text-muted-foreground text-[10px] uppercase">XP Reward</p>
            <p className="text-base font-bold text-amber-400 mt-0.5">
              +{track.stats.completionPoints} XP
            </p>
          </div>
        </div>
      </div>

      {/* Lesson List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" /> Track Modules
        </h2>

        <div className="space-y-4">
          {track.lessons.map((lesson, idx) => (
            <Card
              key={lesson.id}
              className="border-border/80 hover:border-primary/50 transition-all shadow-md group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant={lesson.level === "Beginner" ? "success" : "purple"}>
                    {lesson.level}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{lesson.readTime}</span>
                  </div>
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors mt-2">
                  {lesson.title}
                </CardTitle>
                <CardDescription className="text-xs">{lesson.summary}</CardDescription>
              </CardHeader>

              <CardFooter className="pt-2 flex items-center justify-between">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Includes Interactive Playground & Quiz</span>
                </div>
                <Link href={`/tracks/${track.id}/${lesson.id}`}>
                  <Button size="sm" variant="default" className="gap-1.5 text-xs font-semibold">
                    <span>Open Module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
