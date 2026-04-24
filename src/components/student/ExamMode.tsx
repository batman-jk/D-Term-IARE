import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { Question } from "@/utils/mockData";
import { evaluateAnswer } from "@/utils/evaluate";
import { showToast } from "@/components/Toast";

export interface ExamResult {
  question: string;
  correct: string;
  given: string;
  match: number;
}

export function ExamMode({
  questions,
  title,
  onFinish,
  onCancel,
}: {
  questions: Question[];
  title: string;
  onFinish: (results: ExamResult[]) => void;
  onCancel: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ""));
  const [warning, setWarning] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const submittedRef = useRef(false);

  const submit = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setIsSubmitting(true);
    try {
      const results: ExamResult[] = await Promise.all(
        questions.map(async (q, i) => ({
          question: q.question,
          correct: q.answer,
          given: answers[i] || "",
          match: await evaluateAnswer(answers[i] || "", q.answer),
        }))
      );
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      onFinish(results);
    } catch (e) {
      console.error(e);
      const fallbackResults: ExamResult[] = questions.map((q, i) => ({
        question: q.question,
        correct: q.answer,
        given: answers[i] || "",
        match: 0,
      }));
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      onFinish(fallbackResults);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enter fullscreen + key blocking
  useEffect(() => {
    const el = containerRef.current;
    if (el?.requestFullscreen) {
      el.requestFullscreen().catch(() => {
        showToast("Fullscreen unavailable in this preview");
      });
    }

    const blocked = (e: KeyboardEvent) => {
      const k = e.key;
      const isCombo =
        e.ctrlKey && (k === "c" || k === "v" || k === "a" || k === "C" || k === "V" || k === "A");
      if (k === "Escape" || k === "Tab" || k === "Alt" || isCombo) {
        e.preventDefault();
        e.stopPropagation();
        showToast("Key blocked during exam.");
      }
    };
    const onContext = (e: MouseEvent) => e.preventDefault();

    window.addEventListener("keydown", blocked, true);
    window.addEventListener("contextmenu", onContext);
    return () => {
      window.removeEventListener("keydown", blocked, true);
      window.removeEventListener("contextmenu", onContext);
    };
  }, []);

  // Fullscreen exit warning + auto submit
  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement && !submittedRef.current) {
        setWarning(true);
      }
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    if (!warning) return;
    setCountdown(5);
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          submit();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warning]);

  const setAnswer = (v: string) => setAnswers((prev) => prev.map((a, i) => (i === idx ? v : a)));

  const q = questions[idx];

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="border-b border-border p-5 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-destructive">
            ⚫ EXAM IN PROGRESS
          </div>
          <div className="font-mono text-lg text-foreground">{title}</div>
        </div>
        <div className="font-mono text-sm text-primary">
          Question {idx + 1} / {questions.length}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-10">
        <div className="w-full max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Definition / Term
          </div>
          <div className="font-mono text-2xl text-foreground mb-8 leading-relaxed">
            {q.question}
          </div>

          <input
            autoFocus
            value={answers[idx]}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your one-line answer…"
            className="w-full bg-input border border-border rounded px-4 py-3 font-mono text-foreground focus:outline-none focus:border-primary"
          />

          <div className="mt-8 flex justify-between">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Abort
            </button>
            <div className="flex gap-3">
              {idx > 0 && (
                <button
                  onClick={() => setIdx(idx - 1)}
                  className="px-5 py-2 border border-border rounded hover:border-primary text-sm"
                >
                  ← Previous
                </button>
              )}
              {idx < questions.length - 1 ? (
                <button
                  onClick={() => setIdx(idx + 1)}
                  className="px-5 py-2 bg-primary text-primary-foreground rounded font-semibold text-sm hover:bg-primary/90"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={submit}
                  className="px-5 py-2 bg-primary text-primary-foreground rounded font-semibold text-sm hover:bg-primary/90"
                >
                  Submit Test
                </button>
              )}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-10 gap-1.5">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded ${
                  i === idx ? "bg-primary" : answers[i] ? "bg-primary/50" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {isSubmitting && (
        <div className="absolute inset-0 bg-background/95 z-[60] flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="font-mono text-lg text-foreground animate-pulse">
            Evaluating answers via Gemini...
          </div>
        </div>
      )}

      {warning && !isSubmitting && (
        <div className="absolute inset-0 bg-background/95 z-50 flex items-center justify-center">
          <div className="border-2 border-destructive bg-card p-8 rounded max-w-md text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <div className="font-mono text-lg text-foreground mb-2">⚠ Fullscreen exited</div>
            <p className="text-sm text-muted-foreground mb-4">
              Test will auto-submit in{" "}
              <span className="text-destructive font-mono font-bold text-xl">{countdown}</span>{" "}
              seconds.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
