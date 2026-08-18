"use client";

import React, { useState } from "react";
import { LanguagePlayground } from "@/components/playgrounds/LanguagePlayground";
import { CodePlayground } from "@/components/playgrounds/CodePlayground";
import { MathPlayground } from "@/components/playgrounds/MathPlayground";
import { AutomationPlayground } from "@/components/playgrounds/AutomationPlayground";
import { Badge } from "@/components/ui/badge";
import { Globe2, Bot, Workflow, Calculator, Sparkles } from "lucide-react";

export default function PlaygroundAllPage() {
  const [activeTab, setActiveTab] = useState<"code" | "math" | "language" | "automation">("code");

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12 space-y-8">
      {/* Playground Header */}
      <div className="text-center sm:text-left space-y-2">
        <Badge variant="cyan" className="gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> All-in-One Polymath Lab
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Interactive Playgrounds</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Experiment with live code execution, real-time math solvers, speech-enabled multilingual flashcards, and automated event pipelines.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/80 pb-4">
        {[
          {
            id: "code",
            label: "AI Code Runner",
            icon: <Bot className="w-4 h-4" />,
            color: "text-purple-400",
            activeClass: "bg-purple-600 text-white shadow-lg shadow-purple-500/20",
          },
          {
            id: "math",
            label: "Math Visualizer",
            icon: <Calculator className="w-4 h-4" />,
            color: "text-amber-400",
            activeClass: "bg-amber-600 text-white shadow-lg shadow-amber-500/20",
          },
          {
            id: "language",
            label: "Language Flashcards",
            icon: <Globe2 className="w-4 h-4" />,
            color: "text-cyan-400",
            activeClass: "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20",
          },
          {
            id: "automation",
            label: "Automation Pipelines",
            icon: <Workflow className="w-4 h-4" />,
            color: "text-emerald-400",
            activeClass: "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? tab.activeClass
                : "bg-secondary/60 text-secondary-foreground hover:bg-secondary"
            }`}
          >
            <span className={activeTab === tab.id ? "text-white" : tab.color}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Render Active Playground */}
      <div className="pt-2 animate-in fade-in duration-300">
        {activeTab === "code" && <CodePlayground defaultTemplateId="prompt-parser" />}
        {activeTab === "math" && <MathPlayground defaultFormulaId="linear-equation" />}
        {activeTab === "language" && <LanguagePlayground initialLanguage="spanish" />}
        {activeTab === "automation" && <AutomationPlayground defaultWorkflowId="lead-enrichment" />}
      </div>
    </div>
  );
}
