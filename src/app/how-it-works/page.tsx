import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowRight,
  Globe2,
  Bot,
  Workflow,
  Calculator,
  Compass,
  CheckCircle2,
} from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 space-y-12">
      <div className="text-center space-y-3">
        <Badge variant="cyan" className="gap-1.5">
          <Compass className="w-3.5 h-3.5" /> Pedagogical Philosophy
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          How Polymath Academy Works
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto leading-relaxed">
          Why learn Language, AI Coding, Automation, and Mathematics together? Because modern technological fluency is not siloed.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center gap-2 text-cyan-400 mb-1">
              <Globe2 className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">1. Natural Language</span>
            </div>
            <CardTitle className="text-xl">Grammar as Computation</CardTitle>
            <CardDescription>
              Human languages are symbolic systems governed by strict syntax and generative compositionality.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>
              When you learn how tokens and parts-of-speech function in Spanish, Japanese, or French, you intuitively understand how LLMs tokenize text and navigate vector embeddings.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <Bot className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">2. AI Coding & Agents</span>
            </div>
            <CardTitle className="text-xl">The Reasoning Loop</CardTitle>
            <CardDescription>
              AI models transform natural language specifications into functioning algorithms.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>
              Learn in-context learning, ReAct agent architectures, and structured tool-calling loops that execute code safely inside browsers.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Workflow className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">3. Event-Driven Automation</span>
            </div>
            <CardTitle className="text-xl">Pipelines & Webhooks</CardTitle>
            <CardDescription>
              Connect disparate APIs and AI models into deterministic autonomous pipelines.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>
              Master triggers (cron schedules, webhooks), filtering rules, and downstream actions to eliminate tedious manual overhead.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Calculator className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">4. Simple Mathematics</span>
            </div>
            <CardTitle className="text-xl">Visual Quantitative Logic</CardTitle>
            <CardDescription>
              Equations are not abstract memorization—they are the physics of computation.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>
              Manipulate slopes, linear systems, triangle hypotenuses, and compound exponential growth with real-time reactive sliders and step-by-step derivations.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="p-8 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/30 to-purple-900/30 border border-primary/30 text-center space-y-4">
        <h3 className="text-2xl font-bold text-foreground">Ready to accelerate your learning?</h3>
        <p className="text-muted-foreground text-xs max-w-xl mx-auto">
          Start exploring any track or jump directly into the live sandbox playgrounds.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link href="/tracks">
            <Button variant="gradient" size="sm" className="gap-2">
              Browse Tracks <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/playground">
            <Button variant="outline" size="sm" className="gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Open Playground
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
