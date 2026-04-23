import { useEffect, useState, useCallback } from "react";
import { X, ChevronRight } from "lucide-react";
import type { Question } from "@/utils/mockData";

export function Flashcard({
  cards,
  onClose,
  title,
}: {
  cards: Question[];
  onClose: () => void;
  title: string;
}) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const flip = useCallback(() => setFlipped((f) => !f), []);
  const next = useCallback(() => {
    setFlipped(false);
    setTimeout(() => setIdx((i) => (i + 1) % cards.length), 250);
  }, [cards.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        flip();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.code === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flip, next, onClose]);

  const card = cards[idx];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Study Mode</div>
          <div className="font-mono text-lg text-foreground">{title}</div>
        </div>
        <div className="flex items-center gap-6">
          <span className="font-mono text-sm text-primary">
            Card {idx + 1} / {cards.length}
          </span>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div
          className="flashcard-perspective w-full max-w-2xl h-80 cursor-pointer"
          onClick={flip}
        >
          <div className={`flashcard-inner relative w-full h-full ${flipped ? "flipped" : ""}`}>
            <div className="flashcard-face absolute inset-0 bg-card border border-border rounded p-10 flex flex-col justify-center">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                Question
              </div>
              <div className="font-mono text-2xl text-foreground leading-relaxed">
                {card.question}
              </div>
              <div className="absolute bottom-5 right-6 text-xs text-muted-foreground font-mono">
                click or press SPACE to flip
              </div>
            </div>
            <div className="flashcard-face flashcard-back absolute inset-0 bg-card border border-primary rounded p-10 flex flex-col justify-center">
              <div className="text-xs uppercase tracking-widest text-primary mb-4">Answer</div>
              <div className="font-mono text-xl text-muted-foreground leading-relaxed">
                {card.answer}
              </div>
              <div className="absolute bottom-5 right-6 text-xs text-muted-foreground font-mono">
                press → for next
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={flip}
            className="px-5 py-2 border border-border text-foreground rounded hover:border-primary transition-colors text-sm"
          >
            Flip
          </button>
          <button
            onClick={next}
            className="px-5 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors text-sm font-semibold flex items-center gap-2"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}