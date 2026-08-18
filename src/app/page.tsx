import Link from "next/link";
import { ALL_TRACKS } from "@/lib/curriculum";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe2,
  Bot,
  Workflow,
  Calculator,
  ArrowRight,
  Sparkles,
  Zap,
  Code2,
  BookOpen,
  CheckCircle2,
  Layers,
} from "lucide-react";

export default function HomePage() {
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
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-28 px-4 text-center border-b border-border/60 bg-gradient-to-b from-background via-card/30 to-background relative overflow-hidden">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="container mx-auto max-w-5xl flex flex-col items-center gap-6 relative z-10">
          <Badge variant="cyan" className="px-3.5 py-1 text-xs gap-1.5 font-mono shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Unified Polymath Learning Framework
          </Badge>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl leading-tight">
            Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400">Language, AI Coding, Automation</span> & <span className="text-amber-400">Simple Math</span>.
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Everything connects: human syntax bridges to AI prompt engineering, algorithms run on intuitive math formulas, and automated pipelines glue modern software together.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full sm:w-auto justify-center">
            <Link href="/tracks">
              <Button size="lg" variant="gradient" className="w-full sm:w-auto gap-2">
                Explore All 4 Tracks <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/playground">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                <Code2 className="w-4 h-4 text-primary" /> Open Interactive Playgrounds
              </Button>
            </Link>
          </div>

          {/* Key Pillars Badge bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> Polyglot Linguistics (ES, JP, FR)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> AI Prompts & Agent Sandboxes
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Event-Driven Webhooks & Logic
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Reactive Math Formula Visualizers
            </div>
          </div>
        </div>
      </section>

      {/* 4 Tracks Cards Grid */}
      <section className="w-full py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-2">
            Curated Curricula
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight">Four Interconnected Disciplines</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-sm">
            Learn theory with rich real-world context, then immediately test your understanding in integrated interactive playgrounds.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {ALL_TRACKS.map((track) => (
            <Card
              key={track.id}
              className="border-border/80 flex flex-col justify-between hover:border-border transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 group"
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2.5 rounded-xl bg-secondary/80 border border-border group-hover:scale-105 transition-transform">
                    {getTrackIcon(track.iconName)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {track.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {track.title}
                </CardTitle>
                <p className="text-xs font-mono text-cyan-400">{track.subtitle}</p>
                <CardDescription className="pt-2 text-sm">
                  {track.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="p-3 bg-secondary/30 rounded-lg border border-border/60 text-xs flex items-center justify-between font-mono text-muted-foreground">
                  <span>📚 {track.lessons.length} Modules</span>
                  <span>⚡ {track.stats.exercisesCount} Interactive Challenges</span>
                  <span>🏆 {track.stats.completionPoints} XP</span>
                </div>
              </CardContent>

              <CardFooter>
                <Link href={`/tracks/${track.id}`} className="w-full">
                  <Button variant="secondary" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <span>Start Track</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Interactive Philosophy Section */}
      <section className="w-full py-16 px-4 bg-card/40 border-t border-border/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold tracking-tight">The Universal Knowledge Stack</h3>
            <p className="text-sm text-muted-foreground mt-1">
              How these four subjects reinforce and accelerate each other
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-card border border-cyan-500/30 space-y-2">
              <div className="font-bold text-sm text-cyan-300">1. Language & Semantics</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Grammar structures human thoughts; token embeddings structure model intelligence.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-card border border-purple-500/30 space-y-2">
              <div className="font-bold text-sm text-purple-300">2. AI Coding & Agents</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Transforms prompt specifications into functioning code loops and autonomous decisions.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-card border border-emerald-500/30 space-y-2">
              <div className="font-bold text-sm text-emerald-300">3. Automation & Webhooks</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connects code and AI to real-world triggers, schedules, and event-driven data flow.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-card border border-amber-500/30 space-y-2">
              <div className="font-bold text-sm text-amber-300">4. Simple Mathematics</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Provides the exact quantitative formulas (slopes, similarity, growth) running underneath.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
