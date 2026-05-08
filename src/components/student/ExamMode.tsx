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

export interface ExamFinishMeta {
  startedAt: number;
  endedAt: number;
  questionsAttempted: number;
}

export function ExamMode({
  questions,
  title,
  onFinish,
  onCancel,
}: {
  questions: Question[];
  title: string;
  onFinish: (results: ExamResult[], meta: ExamFinishMeta) => void;
  onCancel: () => void;
}) {
  const examKey = `dterm_exam_state_${title.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const [startedAt] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(examKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.startedAt) return parsed.startedAt;
      }
    } catch(e) {}
    return Date.now();
  });
  const startedAtRef = useRef<number>(startedAt);

  const [answers, setAnswers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(examKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers && Array.isArray(parsed.answers) && parsed.answers.length === questions.length) {
          return parsed.answers;
        }
      }
    } catch(e) {}
    return questions.map(() => "");
  });

  const [matches, setMatches] = useState<(number | null)[]>(() => {
    try {
      const saved = localStorage.getItem(examKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.matches && Array.isArray(parsed.matches) && parsed.matches.length === questions.length) {
          return parsed.matches;
        }
      }
    } catch(e) {}
    return questions.map(() => null);
  });

  const [attempts, setAttempts] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(examKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.attempts && Array.isArray(parsed.attempts) && parsed.attempts.length === questions.length) {
          return parsed.attempts;
        }
      }
    } catch(e) {}
    return questions.map(() => 0);
  });

  const [idx, setIdx] = useState(() => {
    try {
      const saved = localStorage.getItem(examKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.idx === "number" && parsed.idx >= 0 && parsed.idx < questions.length) {
          return parsed.idx;
        }
      }
    } catch(e) {}
    return 0;
  });

  // Autosave state
  useEffect(() => {
    if (questions.length === 0) return;
    try {
      localStorage.setItem(examKey, JSON.stringify({
        answers,
        matches,
        attempts,
        idx,
        startedAt: startedAtRef.current
      }));
    } catch(e) {}
  }, [answers, matches, attempts, idx, examKey, questions.length]);

  const clearSavedState = () => {
    try {
      localStorage.removeItem(examKey);
    } catch(e) {}
  };

  const handleCancel = () => {
    clearSavedState();
    onCancel();
  };

  const [warning, setWarning] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const submittedRef = useRef(false);

  const submitAnswer = async () => {
    if (attempts[idx] >= 3 || !answers[idx].trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const match = await evaluateAnswer(answers[idx], q.answer);
      
      setMatches(prev => {
        const newMatches = [...prev];
        // Keep the best match score
        if (newMatches[idx] === null || match > newMatches[idx]!) {
          newMatches[idx] = match;
        }
        return newMatches;
      });
      
      setAttempts(prev => {
        const newAttempts = [...prev];
        newAttempts[idx] += 1;
        return newAttempts;
      });
      
    } catch (e) {
      console.error("Evaluation failed", e);
      showToast("Evaluation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submit = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setIsSubmitting(true);
    const endedAt = Date.now();
    try {
      // Evaluate any unanswered questions that have text but haven't been submitted
      const results: ExamResult[] = await Promise.all(
        questions.map(async (q, i) => {
          let finalMatch = matches[i] || 0;
          if (matches[i] === null && answers[i].trim() !== "") {
             finalMatch = await evaluateAnswer(answers[i], q.answer).catch(() => 0);
          }
          return {
            question: q.question,
            correct: q.answer,
            given: answers[i] || "",
            match: finalMatch,
          };
        })
      );
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      const attempted = attempts.filter(a => a > 0).length + answers.filter((a, i) => attempts[i] === 0 && a.trim() !== "").length;
      onFinish(results, { startedAt: startedAtRef.current, endedAt, questionsAttempted: attempted });
    } catch (e) {
      console.error(e);
      const fallbackResults: ExamResult[] = questions.map((q, i) => ({
        question: q.question,
        correct: q.answer,
        given: answers[i] || "",
        match: matches[i] || 0,
      }));
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      const fallbackAttempted = attempts.filter(a => a > 0).length;
      onFinish(fallbackResults, { startedAt: startedAtRef.current, endedAt, questionsAttempted: fallbackAttempted });
    } finally {
      setIsSubmitting(false);
      clearSavedState();
    }
  };

  // Key blocking
  useEffect(() => {    const blocked = (e: KeyboardEvent) => {
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

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-mono text-foreground mb-4">No questions available</h2>
        <button onClick={handleCancel} className="px-4 py-2 bg-primary text-primary-foreground rounded">
          Go Back
        </button>
      </div>
    );
  }

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

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              autoFocus
              value={answers[idx]}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={attempts[idx] >= 3 || isSubmitting}
              placeholder={attempts[idx] >= 3 ? "Maximum attempts reached." : "Type your one-line answer…"}
              className="flex-1 bg-input border border-border rounded px-4 py-3 font-mono text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitAnswer();
                }
              }}
            />
            <button
              onClick={submitAnswer}
              disabled={attempts[idx] >= 3 || !answers[idx].trim() || isSubmitting}
              className="px-6 py-3 bg-primary text-primary-foreground rounded font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap min-w-[140px] flex justify-center items-center"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              ) : attempts[idx] >= 3 ? (
                "Locked"
              ) : (
                "Submit Answer"
              )}
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span>Attempts: {attempts[idx]} / 3</span>
            {matches[idx] !== null && (
              <span className={matches[idx]! >= 80 ? "text-green-500" : matches[idx]! >= 50 ? "text-yellow-500" : "text-red-500"}>
                Best Match: {matches[idx]}%
              </span>
            )}
          </div>
          
          {matches[idx] !== null && (
            <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${matches[idx]! >= 80 ? "bg-green-500" : matches[idx]! >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${matches[idx]}%` }}
              />
            </div>
          )}

          <div className="mt-8 flex justify-between items-center">
            <button
              onClick={handleCancel}
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
                  className="px-5 py-2 bg-secondary text-secondary-foreground rounded font-semibold text-sm hover:bg-secondary/90"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={submit}
                  className="px-5 py-2 bg-destructive text-destructive-foreground rounded font-semibold text-sm hover:bg-destructive/90"
                >
                  Finish Exam
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

      {/* Loading states are now localized to the submit button, 
          but if global submit needs loading we can show a small overlay */}
      {isSubmitting && submittedRef.current && (
        <div className="absolute inset-0 bg-background/50 z-[60] flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="font-mono text-sm text-foreground animate-pulse">
            Finalizing exam...
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
