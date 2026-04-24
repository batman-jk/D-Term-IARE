import { useState } from "react";
import type { Question } from "@/utils/mockData";
import { BookOpen } from "lucide-react";

const DIFFICULTY_LABELS = ["EASY", "MEDIUM", "HARD"] as const;
type Difficulty = (typeof DIFFICULTY_LABELS)[number];

function getDifficulty(q: Question): Difficulty {
  const len = q.answer.split(" ").length;
  if (len <= 8) return "EASY";
  if (len <= 16) return "MEDIUM";
  return "HARD";
}

const DIFF_STYLES: Record<Difficulty, string> = {
  EASY: "bg-green-500/20 text-green-400 border border-green-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  HARD: "bg-red-500/20 text-red-400 border border-red-500/30",
};

function getTopicTag(q: Question): string {
  return q.keywords?.[0]?.toUpperCase() ?? (q.course || q.subject || "GENERAL").toUpperCase();
}

export function FlashcardGrid({
  cards,
  course,
  module,
}: {
  cards: Question[];
  course: string;
  module: string;
}) {
  const [flippedId, setFlippedId] = useState<string | null>(null);

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {cards.map((card) => {
        const diff = getDifficulty(card);
        const tag = getTopicTag(card);
        const isFlipped = flippedId === card.id;
        const isFolded = flippedId !== null && flippedId !== card.id;

        return (
          <div
            key={card.id}
            onClick={() => handleFlip(card.id)}
            className="cursor-pointer"
            style={{
              transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
              transform: isFolded ? "scale(0.92)" : "scale(1)",
              opacity: isFolded ? 0.45 : 1,
            }}
          >
            {/* Card with 3-D flip */}
            <div
              style={{
                perspective: "1000px",
                height: isFolded ? "80px" : "220px",
                transition: "height 0.35s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Front */}
                <div
                  style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                  className="absolute inset-0 rounded-xl bg-[#1e2132] border border-white/10 p-5 flex flex-col justify-between hover:border-cyan-500/40 transition-colors overflow-hidden"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFF_STYLES[diff]}`}>
                      {diff}
                    </span>
                  </div>

                  {/* Question text */}
                  <div className={`text-sm font-semibold text-white text-center leading-snug px-1 ${isFolded ? "hidden" : ""}`}>
                    {card.question}
                  </div>

                  {/* Topic tag */}
                  <div className={`flex justify-center ${isFolded ? "hidden" : ""}`}>
                    <span className="text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  </div>
                </div>

                {/* Back */}
                <div
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                  className="absolute inset-0 rounded-xl bg-[#162032] border border-cyan-500/40 p-5 flex flex-col justify-between overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Answer</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFF_STYLES[diff]}`}>
                      {diff}
                    </span>
                  </div>
                  <div className="text-sm text-slate-200 leading-relaxed text-center px-1">
                    {card.answer}
                  </div>
                  <div className="flex justify-center">
                    <span className="text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
