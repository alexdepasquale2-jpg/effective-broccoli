"use client";

import React, { useState } from "react";
import { QuizQuestion } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { playCelebration } from "@/lib/utils";
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, RotateCcw } from "lucide-react";

export function QuizBlock({ questions }: { questions: QuizQuestion[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  if (!questions || questions.length === 0) return null;

  const currentQ = questions[currentIndex];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === currentQ.correctAnswer) {
      setScore((s) => s + 1);
      playCelebration();
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setCompleted(true);
      playCelebration();
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setCompleted(false);
  };

  return (
    <Card className="border-border/90 bg-card/90 shadow-xl overflow-hidden mt-8">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-secondary/40 to-card pb-4 border-b border-border/60">
        <div className="flex items-center justify-between">
          <Badge variant="cyan" className="gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" /> Concept Checkpoint
          </Badge>
          <span className="text-xs font-mono text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>
        <CardTitle className="text-lg mt-2 text-foreground">{currentQ.question}</CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        {!completed ? (
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = isAnswered && idx === currentQ.correctAnswer;
              const isWrong = isAnswered && isSelected && idx !== currentQ.correctAnswer;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-all flex items-start justify-between gap-3 ${
                    isCorrect
                      ? "bg-emerald-950/40 border-emerald-500 text-emerald-200"
                      : isWrong
                      ? "bg-red-950/40 border-red-500 text-red-200"
                      : isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/80 bg-secondary/40 hover:bg-secondary text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border text-xs font-mono text-muted-foreground">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </div>

                  {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                  {isWrong && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                </button>
              );
            })}

            {isAnswered && (
              <div className="mt-4 p-4 rounded-xl bg-card border border-border text-xs space-y-1 animate-in fade-in">
                <p className="font-bold text-foreground">
                  {selectedOption === currentQ.correctAnswer ? "🎉 Correct!" : "💡 Explanation:"}
                </p>
                <p className="text-muted-foreground">{currentQ.explanation}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <h3 className="text-2xl font-bold text-foreground">Quiz Completed!</h3>
            <p className="text-muted-foreground text-sm">
              You scored <span className="text-primary font-bold">{score}</span> out of{" "}
              <span className="font-bold">{questions.length}</span>!
            </p>
            <div className="pt-2">
              <Button size="sm" variant="outline" onClick={resetQuiz} className="gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Retake Quiz
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {!completed && isAnswered && (
        <CardFooter className="flex justify-end p-4 bg-secondary/30 border-t border-border/40">
          <Button size="sm" onClick={handleNext} className="gap-1.5">
            {currentIndex + 1 < questions.length ? "Next Question" : "Finish Quiz"}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
