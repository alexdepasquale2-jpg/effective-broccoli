"use client";

import React, { useState } from "react";
import { INTERACTIVE_MATH_FORMULAS, MathFormula } from "@/lib/curriculum/math";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { playCelebration } from "@/lib/utils";
import { Calculator, CheckCircle2, RotateCcw, Sparkles, TrendingUp, HelpCircle } from "lucide-react";

export function MathPlayground({ defaultFormulaId = "linear-equation" }: { defaultFormulaId?: string }) {
  const [selectedFormula, setSelectedFormula] = useState<MathFormula>(
    INTERACTIVE_MATH_FORMULAS.find((f) => f.id === defaultFormulaId) || INTERACTIVE_MATH_FORMULAS[0]
  );

  // Initialize input state with default values
  const [inputs, setInputs] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    selectedFormula.variables.forEach((v) => {
      initial[v.name] = v.defaultValue;
    });
    return initial;
  });

  const handleFormulaSelect = (formula: MathFormula) => {
    setSelectedFormula(formula);
    const newInputs: Record<string, number> = {};
    formula.variables.forEach((v) => {
      newInputs[v.name] = v.defaultValue;
    });
    setInputs(newInputs);
  };

  const handleInputChange = (name: string, val: number) => {
    setInputs((prev) => ({ ...prev, [name]: val }));
  };

  const calculation = selectedFormula.calculate(inputs);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Formula Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-card/60 border border-border">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Math Model:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {INTERACTIVE_MATH_FORMULAS.map((formula) => (
            <button
              key={formula.id}
              onClick={() => handleFormulaSelect(formula)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedFormula.id === formula.id
                  ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                  : "bg-secondary/60 text-secondary-foreground hover:bg-secondary"
              }`}
            >
              {formula.name.split("(")[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Inputs & Variable Sliders (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <Card className="border-border/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="warning">{selectedFormula.category}</Badge>
                <button
                  onClick={() => {
                    const resetVals: Record<string, number> = {};
                    selectedFormula.variables.forEach((v) => (resetVals[v.name] = v.defaultValue));
                    setInputs(resetVals);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>
              <CardTitle className="text-lg mt-2">{selectedFormula.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{selectedFormula.description}</p>
            </CardHeader>
            <CardContent className="space-y-5 pt-2">
              {/* Formula Badge */}
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/30 text-center font-mono font-bold text-amber-300 text-sm">
                {selectedFormula.formula}
              </div>

              {/* Dynamic Sliders */}
              <div className="space-y-4">
                {selectedFormula.variables.map((variable) => {
                  const currentValue = inputs[variable.name] ?? variable.defaultValue;
                  return (
                    <div key={variable.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-medium text-foreground">{variable.label}</label>
                        <span className="font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                          {currentValue}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={variable.min}
                        max={variable.max}
                        step={variable.step}
                        value={currentValue}
                        onChange={(e) => handleInputChange(variable.name, Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-secondary rounded-lg"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                        <span>{variable.min}</span>
                        <span>{variable.max}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Step-by-Step Proof & Real-time Graph Visualizer (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Result Highlight Card */}
          <Card className="border-amber-500/30 bg-gradient-to-br from-card via-card to-amber-950/20 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Computed Outcome
                </span>
                <Badge variant="success">Real-Time Reactive</Badge>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-extrabold tracking-tight text-foreground font-mono">
                  {calculation.result}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Step-by-Step Derivation:
              </h4>
              <div className="space-y-2 font-mono text-xs bg-black/60 p-4 rounded-xl border border-border">
                {calculation.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              {/* Visual geometric representation */}
              {selectedFormula.id === "pythagorean" && (
                <div className="p-4 rounded-xl bg-card border border-border/60 flex flex-col items-center justify-center">
                  <div className="text-xs text-muted-foreground mb-2">Right Triangle Visualization</div>
                  <svg width="240" height="150" viewBox="0 0 240 150" className="overflow-visible">
                    <polygon
                      points={`30,130 ${30 + (inputs.a || 6) * 3},130 30,${130 - (inputs.b || 8) * 3}`}
                      fill="rgba(245, 158, 11, 0.15)"
                      stroke="#f59e0b"
                      strokeWidth="2"
                    />
                    {/* Right angle marker */}
                    <path
                      d="M 30 115 L 45 115 L 45 130"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                    />
                    {/* Labels */}
                    <text x={30 + ((inputs.a || 6) * 3) / 2} y="145" fill="#f59e0b" fontSize="11" textAnchor="middle" fontFamily="monospace">
                      a = {inputs.a}
                    </text>
                    <text x="15" y={130 - ((inputs.b || 8) * 3) / 2} fill="#f59e0b" fontSize="11" textAnchor="end" fontFamily="monospace">
                      b = {inputs.b}
                    </text>
                    <text
                      x={30 + ((inputs.a || 6) * 3) / 2 + 10}
                      y={130 - ((inputs.b || 8) * 3) / 2 - 5}
                      fill="#38bdf8"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      c = {calculation.result}
                    </text>
                  </svg>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
