import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Globe2, Bot, Workflow, Calculator, Sparkles, BookOpen } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 font-bold text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-foreground">
                Polymath<span className="text-primary">Academy</span>
              </span>
              <span className="text-[10px] font-medium text-muted-foreground -mt-1 tracking-wider uppercase">
                Lang • AI • Auto • Math
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-muted-foreground">
            <Link
              href="/tracks/language"
              className="flex items-center gap-1.5 transition hover:text-cyan-400"
            >
              <Globe2 className="w-3.5 h-3.5 text-cyan-400" /> Languages
            </Link>
            <Link
              href="/tracks/ai-coding"
              className="flex items-center gap-1.5 transition hover:text-purple-400"
            >
              <Bot className="w-3.5 h-3.5 text-purple-400" /> AI Coding & Agents
            </Link>
            <Link
              href="/tracks/automation"
              className="flex items-center gap-1.5 transition hover:text-emerald-400"
            >
              <Workflow className="w-3.5 h-3.5 text-emerald-400" /> Automation
            </Link>
            <Link
              href="/tracks/math"
              className="flex items-center gap-1.5 transition hover:text-amber-400"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-400" /> Math Visualizer
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/playground">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Live Playgrounds
            </Button>
          </Link>
          <Link href="/tracks">
            <Button variant="gradient" size="sm" className="gap-1.5 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" /> Start Learning
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
