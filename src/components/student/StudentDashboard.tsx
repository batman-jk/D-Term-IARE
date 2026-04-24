import { useState, useSyncExternalStore } from "react";
import {
  BookOpen, FileText, Lock, BarChart2, ChevronDown,
  LogOut, GraduationCap, Target, Clock, Award
} from "lucide-react";
import { COURSES } from "@/utils/mockData";
import { shuffle } from "@/utils/shuffle";
import { FlashcardGrid } from "./FlashcardGrid";
import { PracticeTest } from "./PracticeTest";
import { ExamMode, type ExamResult, type ExamFinishMeta } from "./ExamMode";
import { getDtLaunched, subscribeDt } from "@/utils/examStore";
import { questionStore } from "@/utils/questionStore";
import { examHistory } from "@/utils/examHistoryStore";
import type { AppUser } from "@/utils/userStore";
import { toast } from "sonner";

type View = "dashboard" | "lecture-notes" | "flashcards" | "practice" | "dt-exam";

export function StudentDashboard({ user, onLogout }: { user: AppUser; onLogout: () => void }) {
  const [view, setView] = useState<View>("dashboard");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const dtLaunched = useSyncExternalStore((cb) => subscribeDt(cb), getDtLaunched, getDtLaunched);

  const allQuestions = useSyncExternalStore(
    questionStore.subscribe,
    questionStore.getQuestions,
    questionStore.getQuestions,
  );

  const courses = Array.from(new Set(allQuestions.map(q => q.subject || q.course || ""))).filter(Boolean);
  const availableCourses = courses.length > 0 ? courses : COURSES;
  const activeCourse = selectedCourse || availableCourses[0] || "";

  const courseQuestions = allQuestions.filter(
    q => (q.subject || q.course || "") === activeCourse
  );
  const modules = Array.from(new Set(courseQuestions.map(q => String(q.module)))).sort((a, b) => {
    const na = Number(a), nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });
  const activeModule = selectedModule || modules[0] || "";

  const filteredCards = activeModule
    ? courseQuestions.filter(q => String(q.module) === activeModule)
    : courseQuestions;

  // Exam state
  const [examStage, setExamStage] = useState<"idle" | "exam" | "done">("idle");
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [examQuestions, setExamQuestions] = useState(allQuestions.slice(0, 10));
  const [examCourse, setExamCourse] = useState("");

  const history = useSyncExternalStore(
    examHistory.subscribe,
    examHistory.getRecords,
    examHistory.getRecords,
  );

  const startDTExam = () => {
    if (allQuestions.length === 0) {
      toast.error("No questions available yet.");
      return;
    }
    const mods = Array.from(new Set(allQuestions.map(q => q.module)));
    const picked = shuffle(mods.flatMap(m => shuffle(allQuestions.filter(q => q.module === m)).slice(0, 2)));
    if (picked.length === 0) { toast.error("No questions available."); return; }
    document.documentElement.requestFullscreen?.().catch(() => {});
    setExamCourse(activeCourse);
    setExamQuestions(picked);
    setExamStage("exam");
    setView("dt-exam");
  };

  if (examStage === "exam" && view === "dt-exam") {
    return (
      <ExamMode
        questions={examQuestions}
        title={`DT Exam — ${examCourse || activeCourse}`}
        onFinish={(r: ExamResult[], meta: ExamFinishMeta) => {
          examHistory.addRecord({
            type: "dt",
            course: examCourse || activeCourse,
            startedAt: meta.startedAt,
            endedAt: meta.endedAt,
            questionsTotal: r.length,
            questionsAttempted: meta.questionsAttempted,
            score: r.length > 0 ? Math.round(r.reduce((s, x) => s + x.match, 0) / r.length) : 0,
            results: r,
          });
          setExamResults(r);
          setExamStage("done");
        }}
        onCancel={() => { setExamStage("idle"); setView("dashboard"); }}
      />
    );
  }

  const sidebarNav = [
    {
      section: "MAIN CONTENT",
      items: [
        { key: "lecture-notes" as View, label: "Lecture Notes", icon: BookOpen },
      ],
    },
    {
      section: "INTERACTIVE",
      items: [
        { key: "flashcards" as View, label: "Flashcards", icon: GraduationCap },
      ],
    },
    {
      section: "ASSESSMENT",
      items: [
        { key: "practice" as View, label: "Practice Questions", icon: FileText },
        { key: "dt-exam" as View, label: "DT Exam", icon: Lock },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-[#1a1d27] text-white overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-[#12141e] border-r border-white/10 overflow-y-auto">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/10">
          <IareLogo />
        </div>

        {/* Dashboard button */}
        <button
          onClick={() => setView("dashboard")}
          className={`flex items-center gap-2 mx-3 mt-3 mb-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
            view === "dashboard" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Dashboard
        </button>

        {/* Course Explorer */}
        <div className="px-3 mt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">Course Explorer</p>
          {/* Course dropdown */}
          <div className="relative mb-2">
            <select
              value={activeCourse}
              onChange={e => { setSelectedCourse(e.target.value); setSelectedModule(""); }}
              className="w-full appearance-none bg-[#1e2132] border border-white/10 rounded px-3 py-2 text-xs text-white pr-7 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {availableCourses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
          {/* Module dropdown */}
          <div className="relative mb-4">
            <select
              value={activeModule}
              onChange={e => setSelectedModule(e.target.value)}
              className="w-full appearance-none bg-[#1e2132] border border-white/10 rounded px-3 py-2 text-xs text-white pr-7 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {modules.length > 0
                ? modules.map(m => <option key={m} value={m}>Module {m}</option>)
                : <option value="">No modules yet</option>}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Nav sections */}
        {sidebarNav.map(group => (
          <div key={group.section} className="px-3 mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 px-1">{group.section}</p>
            {group.items.map(item => {
              const Icon = item.icon;
              const active = view === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => { if (item.key === "dt-exam") { startDTExam(); } else { setView(item.key); } }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors mb-0.5 ${
                    active ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}

        {/* User + logout */}
        <div className="mt-auto border-t border-white/10 px-4 py-4">
          <p className="text-xs text-slate-400">Signed in as</p>
          <p className="text-sm font-semibold text-white truncate">{user.displayName}</p>
          <button
            onClick={onLogout}
            className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        {view === "dashboard" && (
          <DashboardView
            user={user}
            allQuestions={allQuestions}
            dtLaunched={dtLaunched}
            onStartExam={startDTExam}
            onGoFlashcards={() => setView("flashcards")}
            onGoPractice={() => setView("practice")}
            history={history}
          />
        )}
        {view === "lecture-notes" && (
          <ContentView title="Lecture Notes" subtitle={`${activeCourse} · Module ${activeModule}`}>
            <div className="flex flex-col items-center justify-center py-24 text-slate-500">
              <BookOpen className="w-12 h-12 mb-4 opacity-40" />
              <p className="text-sm">Lecture notes will appear here once uploaded by faculty.</p>
            </div>
          </ContentView>
        )}
        {view === "flashcards" && (
          <ContentView
            title="Flashcards"
            subtitle={`Course: ${activeCourse} | Module ${activeModule}`}
          >
            <FlashcardGrid cards={filteredCards} course={activeCourse} module={activeModule} />
          </ContentView>
        )}
        {view === "practice" && (
          <ContentView title="Practice Questions" subtitle="Self-paced quiz from uploaded question bank">
            <PracticeTest />
          </ContentView>
        )}
        {view === "dt-exam" && examStage === "done" && (
          <ContentView title="DT Exam — Submitted" subtitle="Your results have been recorded">
            <div className="max-w-md">
              <div className="bg-[#1e2132] border border-white/10 rounded-xl p-8 text-center">
                <Award className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <p className="text-slate-400 text-sm mb-1">Final Score</p>
                <p className="font-mono text-5xl font-bold text-cyan-400 mt-1">
                  {Math.round(examResults.reduce((s, r) => s + r.match, 0) / examResults.length)}%
                </p>
                <button
                  onClick={() => { setExamStage("idle"); setView("dashboard"); }}
                  className="mt-6 px-6 py-2 bg-cyan-500 text-white rounded-lg text-sm font-semibold hover:bg-cyan-600 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </ContentView>
        )}
        {view === "dt-exam" && examStage === "idle" && (
          <ContentView title="DT Exam" subtitle="Fullscreen enforced — exiting auto-submits">
            <DTExamPrompt dtLaunched={dtLaunched} onStart={startDTExam} />
          </ContentView>
        )}
      </main>
    </div>
  );
}

/* ── IARE Logo ── */
function IareLogo() {
  return (
    <img
      src="/iare-logo.png"
      alt="IARE Logo"
      className="h-10 w-auto object-contain"
      onError={(e) => {
        // fallback if image not found
        const t = e.currentTarget;
        t.style.display = "none";
        const fallback = t.nextElementSibling as HTMLElement | null;
        if (fallback) fallback.style.display = "flex";
      }}
    />
  );
}

/* ── Content wrapper ── */
function ContentView({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/* ── Dashboard ── */
import type { ExamRecord } from "@/utils/examHistoryStore";

function fmt(ts: number) {
  return new Date(ts).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
}
function fmtDur(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function DashboardView({
  user, allQuestions, dtLaunched, onStartExam, onGoFlashcards, onGoPractice, history,
}: {
  user: AppUser;
  allQuestions: ReturnType<typeof questionStore.getQuestions>;
  dtLaunched: boolean;
  onStartExam: () => void;
  onGoFlashcards: () => void;
  onGoPractice: () => void;
  history: ExamRecord[];
}) {
  const totalModules = Array.from(new Set(allQuestions.map(q => String(q.module)))).length;
  const totalCourses = Array.from(new Set(allQuestions.map(q => q.subject || q.course || ""))).filter(Boolean).length;

  const dtRecords = history.filter(r => r.type === "dt");
  const practiceRecords = history.filter(r => r.type === "practice");
  const totalAttempted = history.reduce((s, r) => s + r.questionsAttempted, 0);
  const avgAccuracy = history.length > 0
    ? Math.round(history.reduce((s, r) => s + r.score, 0) / history.length)
    : null;
  const bestScore = history.length > 0 ? Math.max(...history.map(r => r.score)) : null;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Hello, {user.displayName} 👋</h1>
        <p className="text-slate-400 text-sm mt-1">Welcome to D-Term — your definitions &amp; terminology hub.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={BookOpen} label="Total Questions" value={String(allQuestions.length)} color="cyan" />
        <StatCard icon={GraduationCap} label="Courses" value={String(totalCourses || "—")} color="purple" />
        <StatCard icon={Target} label="Questions Attempted" value={String(totalAttempted || "—")} color="amber" />
        <StatCard icon={Award} label="Avg Accuracy" value={avgAccuracy !== null ? `${avgAccuracy}%` : "—"} color="green" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} label="Practice Attempts" value={String(practiceRecords.length || "—")} color="purple" />
        <StatCard icon={Lock} label="DT Exams Taken" value={String(dtRecords.length || "—")} color="amber" />
        <StatCard icon={Award} label="Best Score" value={bestScore !== null ? `${bestScore}%` : "—"} color="green" />
        <StatCard icon={Target} label="Modules" value={String(totalModules || "—")} color="cyan" />
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickAction icon={GraduationCap} title="Study Flashcards" desc="Flip through definitions and terms" onClick={onGoFlashcards} color="cyan" />
          <QuickAction icon={FileText} title="Practice Test" desc="Test yourself with questions" onClick={onGoPractice} color="purple" />
          <QuickAction icon={Lock} title="DT Exam" desc={dtLaunched ? "LIVE — Click to begin now" : "Locked — waiting for admin"} onClick={dtLaunched ? onStartExam : undefined} color={dtLaunched ? "amber" : "slate"} />
        </div>
      </div>

      {/* Exam History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Exam History</h2>
          <span className="text-xs text-slate-600">{history.length} attempt{history.length !== 1 ? "s" : ""}</span>
        </div>

        {history.length === 0 ? (
          <div className="bg-[#1e2132] border border-white/10 rounded-xl p-8 text-center text-slate-500">
            <Clock className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No exams taken yet. Complete a practice test or DT exam to see your history here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((rec) => {
              const dur = fmtDur(rec.endedAt - rec.startedAt);
              const scoreColor = rec.score >= 80 ? "text-green-400" : rec.score >= 60 ? "text-amber-400" : "text-red-400";
              return (
                <div key={rec.id} className="bg-[#1e2132] border border-white/10 rounded-xl p-5 flex flex-wrap items-center gap-4">
                  {/* Type badge */}
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    rec.type === "dt"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  }`}>
                    {rec.type === "dt" ? "DT EXAM" : "PRACTICE"}
                  </span>

                  {/* Course */}
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-xs text-slate-500">Course</p>
                    <p className="text-sm text-white font-medium truncate">{rec.course || "—"}</p>
                  </div>

                  {/* Timing */}
                  <div className="min-w-[130px]">
                    <p className="text-xs text-slate-500">Started</p>
                    <p className="text-sm text-white">{fmt(rec.startedAt)}</p>
                  </div>
                  <div className="min-w-[60px]">
                    <p className="text-xs text-slate-500">Duration</p>
                    <p className="text-sm text-white">{dur}</p>
                  </div>

                  {/* Questions */}
                  <div className="min-w-[80px] text-center">
                    <p className="text-xs text-slate-500">Attempted</p>
                    <p className="text-sm text-white">{rec.questionsAttempted}/{rec.questionsTotal}</p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Score</p>
                    <p className={`font-mono text-xl font-bold ${scoreColor}`}>{rec.score}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color] || colors.cyan}`}>
      <Icon className="w-5 h-5 mb-3 opacity-80" />
      <div className="text-xs uppercase tracking-widest opacity-70 mb-1">{label}</div>
      <div className="font-mono text-2xl font-bold">{value}</div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, desc, onClick, color }: { icon: React.ElementType; title: string; desc: string; onClick?: () => void; color: string }) {
  const colors: Record<string, string> = {
    cyan: "hover:border-cyan-500/50 hover:bg-cyan-500/5",
    purple: "hover:border-purple-500/50 hover:bg-purple-500/5",
    amber: "hover:border-amber-500/50 hover:bg-amber-500/5",
    slate: "opacity-60 cursor-not-allowed",
  };
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`w-full text-left bg-[#1e2132] border border-white/10 rounded-xl p-5 transition-all ${colors[color] || ""}`}
    >
      <Icon className="w-6 h-6 text-slate-400 mb-3" />
      <div className="font-semibold text-white text-sm">{title}</div>
      <div className="text-slate-500 text-xs mt-1">{desc}</div>
    </button>
  );
}

function DTExamPrompt({ dtLaunched, onStart }: { dtLaunched: boolean; onStart: () => void }) {
  if (!dtLaunched) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-slate-500" />
        </div>
        <h2 className="text-xl font-mono text-white mb-2">DT Exam Locked</h2>
        <p className="text-sm text-slate-500 max-w-sm">The exam has not been launched yet. Wait for your admin.</p>
      </div>
    );
  }
  return (
    <div className="max-w-md">
      <div className="bg-[#1e2132] border border-cyan-500/30 rounded-xl p-8">
        <p className="text-sm text-slate-300 mb-6">The exam is live. Once started, exiting fullscreen auto-submits your test.</p>
        <button
          onClick={onStart}
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          Begin DT Exam
        </button>
      </div>
    </div>
  );
}
