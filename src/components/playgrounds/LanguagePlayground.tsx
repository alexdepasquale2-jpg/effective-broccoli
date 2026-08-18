"use client";

import React, { useState, useEffect } from "react";
import { LANGUAGE_VOCAB_SETS, Flashcard } from "@/lib/curriculum/languages";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { playCelebration } from "@/lib/utils";
import { Volume2, RotateCcw, ChevronLeft, ChevronRight, CheckCircle2, Sparkles, Languages } from "lucide-react";

export function LanguagePlayground({ initialLanguage = "spanish" }: { initialLanguage?: string }) {
  const [selectedLang, setSelectedLang] = useState<string>(initialLanguage);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());
  const [isSpeaking, setIsSpeaking] = useState(false);

  const cards: Flashcard[] = LANGUAGE_VOCAB_SETS[selectedLang] || LANGUAGE_VOCAB_SETS.spanish;
  const currentCard = cards[currentIndex] || cards[0];

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedLang]);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const toggleMastery = (id: string) => {
    const updated = new Set(masteredCards);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
      if (updated.size === cards.length) {
        playCelebration();
      }
    }
    setMasteredCards(updated);
  };

  const speakWord = (text: string, langCode: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const localeMap: Record<string, string> = {
        spanish: "es-ES",
        japanese: "ja-JP",
        french: "fr-FR",
      };
      utterance.lang = localeMap[langCode] || "en-US";
      utterance.rate = 0.9;
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Language Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-card/60 border border-border">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Target Language:
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { id: "spanish", label: "🇪🇸 Spanish", count: LANGUAGE_VOCAB_SETS.spanish.length },
            { id: "japanese", label: "🇯🇵 Japanese", count: LANGUAGE_VOCAB_SETS.japanese.length },
            { id: "french", label: "🇫🇷 French", count: LANGUAGE_VOCAB_SETS.french.length },
          ].map((lang) => (
            <button
              key={lang.id}
              onClick={() => setSelectedLang(lang.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedLang === lang.id
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-102"
                  : "bg-secondary/60 text-secondary-foreground hover:bg-secondary"
              }`}
            >
              {lang.label} ({lang.count})
            </button>
          ))}
        </div>
      </div>

      {/* Progress Metric */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Card {currentIndex + 1} of {cards.length}
        </span>
        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <Sparkles className="w-3.5 h-3.5" /> {masteredCards.size} of {cards.length} Mastered
        </span>
      </div>

      {/* Flashcard Component */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer perspective-1000 min-h-[300px] flex items-center justify-center select-none"
      >
        <Card
          className={`w-full max-w-xl h-[320px] transition-all duration-300 transform flex flex-col justify-between p-8 border-2 ${
            isFlipped
              ? "border-primary/50 bg-gradient-to-b from-card via-card/90 to-primary/10 shadow-xl shadow-primary/10"
              : "border-border/80 hover:border-primary/30 shadow-lg"
          }`}
        >
          {/* Card Top Meta */}
          <div className="flex items-center justify-between">
            <Badge variant="cyan">{currentCard.category}</Badge>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {isFlipped ? "Definition & Usage" : "Click to flip"}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakWord(currentCard.front, selectedLang);
                }}
                className={`p-1.5 rounded-full hover:bg-accent text-primary transition ${
                  isSpeaking ? "animate-pulse scale-110" : ""
                }`}
                title="Listen to pronunciation"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card Center Content */}
          <div className="text-center my-auto flex flex-col items-center justify-center gap-3">
            {!isFlipped ? (
              <>
                <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                  {currentCard.front}
                </h3>
                {currentCard.pronunciation && (
                  <p className="text-sm font-mono text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-md border border-cyan-800/40">
                    🗣️ /{currentCard.pronunciation}/
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h4 className="text-2xl sm:text-3xl font-bold text-primary">{currentCard.back}</h4>
                {currentCard.exampleSentence && (
                  <div className="text-left bg-background/80 p-3 rounded-lg border border-border/80 max-w-md mx-auto text-xs space-y-1">
                    <p className="font-semibold text-foreground">"{currentCard.exampleSentence}"</p>
                    <p className="text-muted-foreground italic">"{currentCard.exampleTranslation}"</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card Bottom Actions */}
          <div className="flex items-center justify-between pt-2">
            <Badge
              variant={
                currentCard.difficulty === "easy"
                  ? "success"
                  : currentCard.difficulty === "medium"
                  ? "warning"
                  : "purple"
              }
            >
              {currentCard.difficulty}
            </Badge>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleMastery(currentCard.id);
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                masteredCards.has(currentCard.id)
                  ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/40"
                  : "bg-secondary text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {masteredCards.has(currentCard.id) ? "Mastered" : "Mark Mastered"}
            </button>
          </div>
        </Card>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="sm" onClick={handlePrev} className="gap-1.5">
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsFlipped(!isFlipped)}
          className="gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Flip Card
        </Button>
        <Button variant="default" size="sm" onClick={handleNext} className="gap-1.5">
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
