"use client";

import React, { useState } from "react";
import { SAMPLE_WORKFLOWS, AutomationWorkflow, AutomationNode } from "@/lib/curriculum/automation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { playCelebration } from "@/lib/utils";
import {
  Workflow,
  Play,
  CheckCircle2,
  ArrowDown,
  Mail,
  Bot,
  Send,
  Clock,
  Globe,
  Bell,
  Cpu,
  Sparkles,
  Layers,
} from "lucide-react";

export function AutomationPlayground({ defaultWorkflowId = "lead-enrichment" }: { defaultWorkflowId?: string }) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<AutomationWorkflow>(
    SAMPLE_WORKFLOWS.find((w) => w.id === defaultWorkflowId) || SAMPLE_WORKFLOWS[0]
  );
  const [executingStep, setExecutingStep] = useState<number>(-1);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Mail":
        return <Mail className="w-4 h-4" />;
      case "Bot":
        return <Bot className="w-4 h-4" />;
      case "Send":
        return <Send className="w-4 h-4" />;
      case "Clock":
        return <Clock className="w-4 h-4" />;
      case "Globe":
        return <Globe className="w-4 h-4" />;
      case "Bell":
        return <Bell className="w-4 h-4" />;
      case "Cpu":
      default:
        return <Cpu className="w-4 h-4" />;
    }
  };

  const runPipeline = async () => {
    setIsRunning(true);
    setExecutionLogs([]);

    for (let i = 0; i < selectedWorkflow.nodes.length; i++) {
      setExecutingStep(i);
      const node = selectedWorkflow.nodes[i];
      const logMsg = `⚡ Step ${i + 1} [${node.type.toUpperCase()}]: ${node.title} — Config: ${JSON.stringify(
        node.config
      )}`;
      setExecutionLogs((prev) => [...prev, logMsg]);
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    setExecutingStep(selectedWorkflow.nodes.length);
    setExecutionLogs((prev) => [
      ...prev,
      "✅ Pipeline execution completed successfully with 0 errors! Payload routed.",
    ]);
    setIsRunning(false);
    playCelebration();
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Workflow Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-card/60 border border-border">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Workflow Template:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {SAMPLE_WORKFLOWS.map((wf) => (
            <button
              key={wf.id}
              onClick={() => {
                setSelectedWorkflow(wf);
                setExecutingStep(-1);
                setExecutionLogs([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedWorkflow.id === wf.id
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                  : "bg-secondary/60 text-secondary-foreground hover:bg-secondary"
              }`}
            >
              {wf.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Interactive Visual Flow Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <Card className="border-border/80 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">{selectedWorkflow.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedWorkflow.description}</p>
              </div>
              <Button
                variant="emerald"
                size="sm"
                onClick={runPipeline}
                disabled={isRunning}
                className="gap-1.5 text-xs font-semibold shadow-lg"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isRunning ? "Simulating..." : "Trigger Pipeline"}
              </Button>
            </div>

            {/* Nodes Chain */}
            <div className="flex flex-col items-center gap-2 py-4">
              {selectedWorkflow.nodes.map((node, index) => {
                const isActive = executingStep === index;
                const isPassed = executingStep > index;

                return (
                  <React.Fragment key={node.id}>
                    <div
                      className={`w-full max-w-md p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                        isActive
                          ? "border-emerald-400 bg-emerald-950/40 shadow-lg shadow-emerald-500/20 scale-102 animate-pulse"
                          : isPassed
                          ? "border-emerald-700/60 bg-card/90"
                          : "border-border/80 bg-card/60 opacity-80"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isPassed || isActive
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {getIcon(node.icon)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{node.title}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">
                            Type: {node.type}
                          </p>
                        </div>
                      </div>

                      {isPassed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Node {index + 1}
                        </Badge>
                      )}
                    </div>

                    {index < selectedWorkflow.nodes.length - 1 && (
                      <ArrowDown
                        className={`w-4 h-4 transition-colors ${
                          isPassed ? "text-emerald-400" : "text-muted-foreground"
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right: Payload & Execution Telemetry (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <Card className="border-border/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" /> Ingestion Payload
                </CardTitle>
                <Badge variant="cyan">JSON Webhook</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="p-3 bg-black/70 rounded-lg text-slate-200 font-mono text-xs overflow-x-auto border border-border">
                {JSON.stringify(selectedWorkflow.samplePayload, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card className="border-border/80 flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Real-Time Telemetry
                </CardTitle>
                {executionLogs.length > 0 && (
                  <button
                    onClick={() => {
                      setExecutionLogs([]);
                      setExecutingStep(-1);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-44 p-3 bg-black/70 rounded-lg font-mono text-xs text-emerald-400 overflow-y-auto space-y-1.5 border border-border">
                {executionLogs.length > 0 ? (
                  executionLogs.map((log, i) => <div key={i}>{log}</div>)
                ) : (
                  <span className="text-muted-foreground italic">
                    Press "Trigger Pipeline" to view step execution logs...
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
