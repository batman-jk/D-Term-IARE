import { useState, useSyncExternalStore } from "react";
import { SUBJECTS } from "@/utils/mockData";
import { shuffle } from "@/utils/shuffle";
import { ExamMode, type ExamResult } from "./ExamMode";
import { questionStore } from "@/utils/questionStore";

type Mode = "config" | "exam" | "results";

export function PracticeTest() {
  const [mode, setMode] = useState<Mode>("config");
  const storeQuestions = useSyncExternalStore(questionStore.subscribe, questionStore.getQuestions, questionStore.getQuestions);
  
  const subjects = Array.from(new Set(storeQuestions.map(q => q.subject || "General"))).filter(Boolean);
  const [subject, setSubject] = useState(subjects[0] || "General");
  const [module, setModule] = useState<number | string | "all">("all");
  const [duration, setDuration] = useState(10);
  const [questions, setQuestions] = useState(storeQuestions.slice(0, 10));
  const [results, setResults] = useState<ExamResult[]>([]);

  const subjectQuestions = storeQuestions.filter(q => (q.subject || "General") === subject);
  const availableModules = Array.from(new Set(subjectQuestions.map(q => q.module))).sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  });

  const start = () => {
    const pool = module === "all" ? subjectQuestions : subjectQuestions.filter((q) => q.module === module);
    const picked = shuffle(pool).slice(0, 10);
    setQuestions(picked);
    setMode("exam");
  };

  if (mode === "exam") {
    return (
      <ExamMode
        questions={questions}
        title={`Practice Test — ${subject}`}
        onFinish={(r) => {
          setResults(r);
          setMode("results");
        }}
        onCancel={() => setMode("config")}
      />
    );
  }

  if (mode === "results") {
    const avg = Math.round(results.reduce((s, r) => s + r.match, 0) / results.length);
    return (
      <div className="max-w-4xl">
        <div className="border border-border bg-card rounded p-6 mb-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Your Score</div>
          <div className="font-mono text-5xl font-bold text-primary mt-2">{avg}%</div>
          <div className="text-sm text-muted-foreground mt-1">
            Average keyword match across {results.length} questions
          </div>
          <button
            onClick={() => setMode("config")}
            className="mt-5 px-4 py-2 bg-primary text-primary-foreground rounded font-semibold text-sm hover:bg-primary/90"
          >
            Retake Test
          </button>
        </div>

        <div className="space-y-3">
          {results.map((r, i) => (
            <div key={i} className="border border-border bg-card rounded p-4">
              <div className="flex justify-between gap-4 mb-3">
                <div className="font-mono text-sm text-foreground flex-1">
                  Q{i + 1}. {r.question}
                </div>
                <span
                  className={`font-mono text-sm font-semibold ${r.match >= 60 ? "text-primary" : "text-destructive"}`}
                >
                  Match: {r.match}%
                </span>
              </div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Your answer</div>
              <div className="font-mono text-sm text-foreground mb-2">
                {r.given || <span className="text-muted-foreground italic">— blank —</span>}
              </div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Correct answer</div>
              <div className="font-mono text-sm text-muted-foreground">{r.correct}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="border border-border bg-card rounded p-6">
        <h2 className="font-mono text-xl text-foreground mb-1">Configure Practice Test</h2>
        <p className="text-sm text-muted-foreground mb-6">
          10 randomized one-line definition questions.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
              Module
            </label>
            <select
              value={module}
              onChange={(e) =>
                setModule(e.target.value === "all" ? "all" : e.target.value)
              }
              className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="all">All Modules</option>
              {availableModules.map((m) => (
                <option key={String(m)} value={String(m)}>
                  {typeof m === "number" ? `Module ${m}` : String(m)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <button
            onClick={start}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded font-semibold hover:bg-primary/90 transition-colors"
          >
            Start Practice Test
          </button>

          <p className="text-xs text-muted-foreground font-mono">
            ⚠ Test will enter fullscreen. Exiting fullscreen auto-submits in 5s.
          </p>
        </div>
      </div>
    </div>
  );
}