import Link from "next/link";
import { ALL_TRACKS } from "@/lib/curriculum";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe2, Bot, Workflow, Calculator, ArrowRight, BookOpen } from "lucide-react";

export default function TracksIndexPage() {
  const getTrackIcon = (iconName: string) => {
    switch (iconName) {
      case "Globe2":
        return <Globe2 className="w-6 h-6 text-cyan-400" />;
      case "Bot":
        return <Bot className="w-6 h-6 text-purple-400" />;
      case "Workflow":
        return <Workflow className="w-6 h-6 text-emerald-400" />;
      case "Calculator":
      default:
        return <Calculator className="w-6 h-6 text-amber-400" />;
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="space-y-3 mb-10 text-center sm:text-left">
        <Badge variant="cyan">Learning Tracks</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Curriculum Catalog</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Choose a discipline to start your journey. Each track contains structured theoretical breakdowns, real-world case studies, and live reactive playgrounds.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {ALL_TRACKS.map((track) => (
          <Card key={track.id} className="border-border/80 flex flex-col justify-between hover:border-primary/40 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 rounded-xl bg-secondary/80 border border-border">
                  {getTrackIcon(track.iconName)}
                </div>
                <Badge variant="outline">{track.badge}</Badge>
              </div>
              <CardTitle className="text-2xl">{track.title}</CardTitle>
              <p className="text-xs font-mono text-cyan-400">{track.subtitle}</p>
              <CardDescription className="pt-2 text-sm">{track.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Modules Included:
                </p>
                <div className="space-y-1.5">
                  {track.lessons.map((lesson, idx) => (
                    <Link
                      key={lesson.id}
                      href={`/tracks/${track.id}/${lesson.id}`}
                      className="p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/70 border border-border/50 flex items-center justify-between text-xs font-medium transition group"
                    >
                      <span className="text-foreground group-hover:text-primary transition-colors">
                        {lesson.title}
                      </span>
                      <span className="text-muted-foreground font-mono text-[10px]">
                        {lesson.readTime}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Link href={`/tracks/${track.id}`} className="w-full">
                <Button className="w-full justify-between" variant="secondary">
                  <span>Enter Track Overview</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
