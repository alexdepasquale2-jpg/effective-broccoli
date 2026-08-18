"use client";

import React, { useState } from "react";
import { AI_CODING_TEMPLATES, CodeTemplate } from "@/lib/curriculum/ai-coding";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { playCelebration } from "@/lib/utils";
import { Play, RotateCcw, Sparkles, Terminal, Check, Copy, Lightbulb } from "lucide-react";

export function CodePlayground({ defaultTemplateId = "prompt-parser" }: { defaultTemplateId?: string }) {
  const [selectedTemplate, setSelectedTemplate] = useState<CodeTemplate>(
    AI_CODING_TEMPLATES.find((t) => t.id === defaultTemplateId) || AI_CODING_TEMPLATES[0]
  );
  const [code, setCode] = useState(selectedTemplate.initialCode);
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTemplateChange = (template: CodeTemplate) => {
    setSelectedTemplate(template);
    setCode(template.initialCode);
    setOutput("");
  };

  const executeCode = () => {
    setIsRunning(true);
    setOutput("");

    try {
      const logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => {
          logs.push(
            args
              .map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)))
              .join(" ")
          );
        },
        warn: (...args: any[]) => {
          logs.push("⚠️ " + args.join(" "));
        },
        error: (...args: any[]) => {
          logs.push("❌ " + args.join(" "));
        },
      };

      // Create sandboxed function execution
      const runSandbox = new Function("console", code);
      runSandbox(customConsole);

      setOutput(logs.join("\n") || "✨ Code executed successfully (No console output).");
      playCelebration();
    } catch (err: any) {
      setOutput(`🚨 Runtime Error:\n${err.message || String(err)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Exercise Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-card/60 border border-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Coding Exercise:
          </span>
        </div>
        <div className="flex items-center gap-2">
          {AI_CODING_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => handleTemplateChange(tmpl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTemplate.id === tmpl.id
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "bg-secondary/60 text-secondary-foreground hover:bg-secondary"
              }`}
            >
              {tmpl.title}
            </button>
          ))}
        </div>
      </div>

      {/* Description & Hint */}
      <div className="p-3.5 rounded-lg bg-purple-950/20 border border-purple-800/30 flex items-start gap-3 text-xs">
        <Lightbulb className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-foreground">{selectedTemplate.description}</p>
          <p className="text-purple-300/80 italic">{selectedTemplate.hint}</p>
        </div>
      </div>

      {/* Code Editor & Terminal Output Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Editor Pane */}
        <div className="flex flex-col rounded-xl border border-border bg-slate-950/90 overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-border/80">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs font-mono text-slate-400 ml-2">sandbox.js</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyCode}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
                title="Copy code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => setCode(selectedTemplate.initialCode)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition ml-2"
                title="Reset to template"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-80 p-4 bg-transparent text-slate-100 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
            spellCheck={false}
          />

          <div className="p-3 bg-slate-900/80 border-t border-border flex items-center justify-between">
            <Badge variant="purple" className="text-[10px]">
              JavaScript (ES2024 Sandboxed)
            </Badge>
            <Button
              size="sm"
              variant="gradient"
              onClick={executeCode}
              disabled={isRunning}
              className="gap-1.5 text-xs font-semibold"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Run Simulation
            </Button>
          </div>
        </div>

        {/* Terminal Output Pane */}
        <div className="flex flex-col rounded-xl border border-border bg-black/90 overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-border/80">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-mono text-slate-400">Execution Output</span>
            </div>
            {output && (
              <button
                onClick={() => setOutput("")}
                className="text-xs text-slate-400 hover:text-slate-200 transition"
              >
                Clear
              </button>
            )}
          </div>

          <div className="p-4 h-[340px] font-mono text-xs text-emerald-400 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {output ? (
              output
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                <Sparkles className="w-6 h-6 text-slate-700" />
                <p>Click "Run Simulation" to execute the agent program</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
