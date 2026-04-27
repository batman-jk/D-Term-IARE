import { useState } from "react";
import type { Question } from "@/utils/mockData";
import { BookOpen, Cpu, Loader2 } from "lucide-react";
import { generateFlashcards } from "@/services/geminiService";
import type { GeminiFlashcard } from "@/services/geminiService";

const DIFFICULTY_LABELS = ["EASY", "MEDIUM", "HARD"] as const;
type Difficulty = (typeof DIFFICULTY_LABELS)[number];

function getDifficulty(q: Question): Difficulty {
  const len = q.answer.split(" ").length;
  if (len <= 8) return "EASY";
  if (len <= 16) return "MEDIUM";
  return "HARD";
}

/** Works for both Question and GeminiFlashcard */
function getDifficultyAny(c: { difficulty?: string; answer?: string }): Difficulty {
  if (c.difficulty && ["EASY", "MEDIUM", "HARD"].includes(c.difficulty)) {
    return c.difficulty as Difficulty;
  }
  const len = (c.answer ?? "").split(" ").length;
  if (len <= 8) return "EASY";
  if (len <= 16) return "MEDIUM";
  return "HARD";
}

const DIFF_STYLES: Record<Difficulty, string> = {
  EASY: "bg-green-500/20 text-green-400 border border-green-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  HARD: "bg-red-500/20 text-red-400 border border-red-500/30",
};

function getTopicTag(q: { keywords?: string[]; course?: string; subject?: string }): string {
  return q.keywords?.[0]?.toUpperCase() ?? (q.course || q.subject || "GENERAL").toUpperCase();
}

export function FlashcardGrid({
  cards,
  course,
  module,
  userRole,
}: {
  cards: Question[];
  course: string;
  module: string;
  userRole?: string;
}) {
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Difficulty | "ALL">("ALL");
  const [aiCards, setAiCards] = useState<GeminiFlashcard[]>([]);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!course || !module) return;
    setGenerating(true);
    setAiError(null);
    try {
      const result = await generateFlashcards(course, module, 50);
      setAiCards(result);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Failed to generate flashcards.");
    } finally {
      setGenerating(false);
    }
  };

  // Unified card type that works for both Question and GeminiFlashcard
  type DisplayCard = {
    id: string;
    question: string;
    answer: string;
    difficulty?: string;
    keywords?: string[];
    course?: string;
    subject?: string;
    module?: number | string;
  };

  // Merge uploaded cards with AI-generated ones
  const allCards: DisplayCard[] = [
    ...cards,
    ...aiCards.map((c, i) => ({ ...c, id: c.id ?? `ai-${i}`, keywords: c.keywords ?? [], module: module })),
  ];

  const filteredCards = allCards.filter(c => {
    const diff = getDifficultyAny(c);
    return filter === "ALL" || diff === filter;
  });

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <BookOpen className="w-12 h-12 mb-4 opacity-40" />
        <p className="text-sm">No flashcards available for this selection.</p>
        <p className="text-xs mt-1 opacity-60">Ask faculty to upload resources for {course} · Module {module}.</p>
      </div>
    );
  }

  const handleFlip = (id: string) => {
    setFlippedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {filteredCards.length} Flashcard{filteredCards.length !== 1 ? "s" : ""}
          </h3>
          {aiCards.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {aiCards.length} AI generated
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setFlippedId(null); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {f}
            </button>
          ))}
          {userRole !== "Student" && (
            <button
              onClick={handleGenerate}
              disabled={generating || !course || !module}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 transition-colors disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Cpu className="w-3 h-3" />}
              {generating ? "Generating…" : "✨ AI Generate"}
            </button>
          )}
        </div>
      </div>
      {aiError && (
        <p className="text-xs text-destructive font-medium">{aiError}</p>
      )}

      {filteredCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <BookOpen className="w-12 h-12 mb-4 opacity-40" />
          <p className="text-sm">No flashcards match this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCards.map((card) => {
        const diff = getDifficultyAny(card);
        const tag = getTopicTag(card);
        const isFlipped = flippedId === card.id;
        return (
          <div
            key={card.id}
            onClick={() => handleFlip(card.id)}
            className="cursor-pointer"
          >
            {/* Card with 3-D flip */}
            <div className="flashcard-perspective w-full h-[220px]">
              <div className={`flashcard-inner relative w-full h-full ${isFlipped ? "flipped" : ""}`}>
                {/* Front */}
                <div className="flashcard-face absolute inset-0 rounded-xl bg-card border border-border p-5 flex flex-col justify-between hover:border-primary/50 transition-colors overflow-hidden">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFF_STYLES[diff]}`}>
                      {diff}
                    </span>
                  </div>

                  {/* Question text */}
                  <div className={`text-sm font-semibold text-foreground text-center leading-snug px-1`}>
                    {card.question}
                  </div>

                  {/* Bottom tag */}
                  <div className={`flex justify-center`}>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full tracking-widest uppercase">
                      Question
                    </span>
                  </div>
                </div>

                {/* Back */}
                <div className="flashcard-face flashcard-back absolute inset-0 rounded-xl bg-card border border-primary p-5 flex flex-col justify-between overflow-hidden shadow-lg">
                  <div className="flex items-start justify-end">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFF_STYLES[diff]}`}>
                      {diff}
                    </span>
                  </div>
                  <div className="text-sm text-foreground leading-relaxed text-center px-1">
                    {card.answer}
                  </div>
                  <div className="flex justify-center">
                    <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full tracking-widest uppercase">
                      Answer
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
        </div>
      )}
    </div>
  );
}
