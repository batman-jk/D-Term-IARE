import { useEffect, useState, useSyncExternalStore } from "react";
import { Home, BookOpen, FileText, Trophy, Lock, Layers } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { QUESTIONS, SUBJECTS } from "@/utils/mockData";
import { shuffle } from "@/utils/shuffle";
import { Flashcard } from "./Flashcard";
import { PracticeTest } from "./PracticeTest";
import { ExamMode, type ExamResult } from "./ExamMode";
import { getDtLaunched, subscribeDt } from "@/utils/examStore";
import { questionStore } from "@/utils/questionStore";

const NAV = [
  { key: "home", label: "Home", icon: Home },
  { key: "study", label: "Study", icon: BookOpen },
  { key: "practice", label: "Practice Test", icon: FileText },
  { key: "exam", label: "DT Exam", icon: Lock },
  { key: "results", label: "My Results", icon: Trophy },
];

export function StudentDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState("home");
  const dtLaunched = useSyncExternalStore(
    (cb) => subscribeDt(cb),
    getDtLaunched,
    getDtLaunched,
  );

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar
        items={NAV}
        active={tab}
        onSelect={setTab}
        role="Student"
        user="Arjun Mehta"
        onLogout={onLogout}
      />
      <main className="flex-1 p-8 overflow-auto">
        {tab === "home" && <HomeTab dtLaunched={dtLaunched} onGo={setTab} />}
        {tab === "study" && <StudyTab />}
        {tab === "practice" && (
          <Section title="Practice Test" subtitle="Take a self-paced practice run">
            <PracticeTest />
          </Section>
        )}
        {tab === "exam" && <ExamTab dtLaunched={dtLaunched} />}
        {tab === "results" && <ResultsTab />}
      </main>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-mono text-3xl text-foreground">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground mt-1 mb-6">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function HomeTab({ dtLaunched, onGo }: { dtLaunched: boolean; onGo: (k: string) => void }) {
  return (
    <div>
      <div className="border border-border bg-card rounded p-6 mb-6">
        <h1 className="font-mono text-3xl text-foreground">Hello, Arjun 👋</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Continue building your definitions vault.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-border bg-card rounded p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">DT Exam Status</div>
          <div className="mt-3">
            {dtLaunched ? (
              <span className="inline-block bg-primary text-primary-foreground font-mono text-xs px-2 py-1 rounded">
                LIVE — TAKE IT NOW
              </span>
            ) : (
              <span className="inline-block border border-primary text-primary font-mono text-xs px-2 py-1 rounded">
                Not yet launched
              </span>
            )}
          </div>
          <button
            onClick={() => onGo("exam")}
            className="mt-4 text-xs font-mono text-primary hover:underline"
          >
            Open exam page →
          </button>
        </div>

        <Stat label="Modules Studied" value="3 / 5" />
        <Stat label="Practice Tests Taken" value="7" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card rounded p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-mono text-3xl font-bold text-foreground mt-3">{value}</div>
    </div>
  );
}

function StudyTab() {
  const questions = useSyncExternalStore(questionStore.subscribe, questionStore.getQuestions, questionStore.getQuestions);

  if (questions.length === 0) {
    return (
      <Section title="Study" subtitle="Flip through definitions module by module">
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border border-dashed border-border rounded max-w-3xl">
          <BookOpen className="w-10 h-10 mb-4" />
          <h2 className="font-mono text-xl text-foreground mb-2">No Resources Available</h2>
          <p className="text-sm">Study resources have not been uploaded by the faculty yet.</p>
        </div>
      </Section>
    );
  }

  const subjects = Array.from(new Set(questions.map(q => q.subject || "General"))).filter(Boolean);
  const [subject, setSubject] = useState(subjects[0] || "General");
  const [module, setModule] = useState<number | string | null>(null);

  const subjectQuestions = questions.filter(q => (q.subject || "General") === subject);
  const availableModules = Array.from(new Set(subjectQuestions.map((q) => q.module))).sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  });

  if (module !== null) {
    const cards = subjectQuestions.filter((q) => q.module === module);
    return (
      <Flashcard
        cards={cards}
        title={`${subject} · Module ${module}`}
        onClose={() => setModule(null)}
      />
    );
  }

  return (
    <Section title="Study" subtitle="Flip through definitions module by module">
      <div className="mb-6 max-w-xs">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableModules.map((m) => (
          <button
            key={String(m)}
            onClick={() => setModule(m)}
            className="border border-border bg-card rounded p-5 text-left hover:border-primary transition-colors group"
          >
            <Layers className="w-6 h-6 text-primary mb-3" />
            <div className="font-mono text-lg text-foreground">
              {typeof m === "number" ? `Module ${m}` : String(m)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {subjectQuestions.filter((q) => q.module === m).length} flashcards
            </div>
            <div className="text-xs text-primary mt-3 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
              Open →
            </div>
          </button>
        ))}
      </div>
    </Section>
  );
}

function ExamTab({ dtLaunched }: { dtLaunched: boolean }) {
  const storeQuestions = useSyncExternalStore(questionStore.subscribe, questionStore.getQuestions, questionStore.getQuestions);
  const availableModules = Array.from(new Set(storeQuestions.map((q) => q.module))).sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  });
  const [stage, setStage] = useState<"idle" | "exam" | "done">("idle");
  const [results, setResults] = useState<ExamResult[]>([]);
  const [questions, setQuestions] = useState(storeQuestions.slice(0, 10));

  // Build exam: pick up to 2 from each available module
  const buildExam = () => {
    const picked = availableModules.flatMap((m) =>
      shuffle(storeQuestions.filter((q) => q.module === m)).slice(0, 2),
    );
    setQuestions(shuffle(picked));
    setStage("exam");
  };

  if (!dtLaunched) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full border-2 border-border flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="font-mono text-2xl text-foreground">DT Exam Locked</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          The DT Exam has not been launched yet. Wait for your admin to start the exam.
        </p>
      </div>
    );
  }

  if (stage === "exam") {
    return (
      <ExamMode
        questions={questions}
        title="DT Exam — Computer Networks"
        onFinish={(r) => {
          setResults(r);
          setStage("done");
        }}
        onCancel={() => setStage("idle")}
      />
    );
  }

  if (stage === "done") {
    const avg = Math.round(results.reduce((s, r) => s + r.match, 0) / results.length);
    return (
      <Section title="DT Exam Submitted" subtitle="Final results have been recorded.">
        <div className="border border-primary bg-card rounded p-6 max-w-md">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Final Score</div>
          <div className="font-mono text-5xl font-bold text-primary mt-2">{avg}%</div>
        </div>
      </Section>
    );
  }

  return (
    <Section title="DT Exam" subtitle="10 questions · 2 per module · fullscreen enforced">
      <div className="border border-primary bg-card rounded p-6 max-w-md">
        <p className="text-sm text-foreground mb-4">
          The exam is live. Once started, exiting fullscreen auto-submits your test.
        </p>
        <button
          onClick={buildExam}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded font-semibold hover:bg-primary/90"
        >
          Begin DT Exam
        </button>
      </div>
    </Section>
  );
}

function ResultsTab() {
  const rows = [
    { type: "Practice", subject: "Computer Networks", score: 78, date: "2025-04-18" },
    { type: "Practice", subject: "Computer Networks", score: 71, date: "2025-04-19" },
    { type: "Practice", subject: "DBMS", score: 65, date: "2025-04-20" },
  ];
  return (
    <Section title="My Results">
      <div className="border border-border bg-card rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-4 py-3 font-mono">{r.type}</td>
                <td className="px-4 py-3">{r.subject}</td>
                <td className="px-4 py-3 font-mono text-primary">{r.score}%</td>
                <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// silence unused import warning when file is tree-shaken
void useEffect;