import { useState, useSyncExternalStore } from "react";
import {
  BookOpen, FileText, Lock, BarChart2, ChevronDown,
  LogOut, GraduationCap, Target, Clock, Award, BookMarked,
} from "lucide-react";
import { COURSES } from "@/utils/mockData";
import { shuffle } from "@/utils/shuffle";
import { FlashcardGrid } from "./FlashcardGrid";
import { PracticeTest } from "./PracticeTest";
import { NotesView } from "./NotesView";
import { ExamMode, type ExamResult, type ExamFinishMeta } from "./ExamMode";
import { getDtLaunched, subscribeDt } from "@/utils/examStore";
import { questionStore } from "@/utils/questionStore";
import { examHistory } from "@/utils/examHistoryStore";
import { dtTestStore } from "@/services/dtTestStore";
import { marksStore } from "@/services/marksStore";
import { departmentStore } from "@/services/departmentStore";
import type { AppUser } from "@/utils/userStore";
import { toast } from "sonner";

type View = "dashboard" | "lecture-notes" | "flashcards" | "notes" | "practice" | "dt-exam";

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

  const assignments = useSyncExternalStore(
    departmentStore.subscribe,
    departmentStore.getAssignments,
    departmentStore.getAssignments
  );

  const studentAssignments = assignments.filter(a => 
    (!user.department || a.department === user.department) &&
    (!user.sem || a.semester === user.sem) &&
    (!user.section || a.section === user.section)
  );
  const assignedSubjects = Array.from(new Set(studentAssignments.map(a => a.subject)));

  const allSubjects = Array.from(new Set(allQuestions.map(q => q.subject || q.course || ""))).filter(Boolean);
  
  // Only show subjects assigned to the student's section. Fallback to all if no assignments exist.
  const availableCourses = assignedSubjects.length > 0 
    ? assignedSubjects 
    : (allSubjects.length > 0 ? allSubjects : COURSES);
    
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

  const startDTExam = (questions: Question[], course: string) => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    setExamCourse(course);
    setExamQuestions(questions);
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
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-sidebar border-r border-border overflow-y-auto">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-border flex justify-center">
          <div className="bg-[#12141e] px-4 py-2 rounded-xl shadow-inner dark:bg-transparent dark:px-0 dark:py-0 dark:shadow-none">
            <IareLogo />
          </div>
        </div>

        {/* Dashboard button */}
        <button
          onClick={() => setView("dashboard")}
          className={`flex items-center gap-3 mx-4 mt-5 mb-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            view === "dashboard" ? "bg-primary/15 text-primary shadow-[inset_2px_0_0_0_currentColor]" : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Dashboard
        </button>

        {/* Course Explorer */}
        <div className="px-4 mt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">Course Explorer</p>
          {/* Course dropdown */}
          <div className="relative mb-3">
            <select
              value={activeCourse}
              onChange={e => { setSelectedCourse(e.target.value); setSelectedModule(""); }}
              className="w-full appearance-none bg-card border border-border rounded-lg px-3 py-2.5 text-xs text-foreground pr-7 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 cursor-pointer transition-all hover:bg-muted/50"
            >
              {availableCourses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
          {/* Module dropdown */}
          <div className="relative mb-5">
            <select
              value={activeModule}
              onChange={e => setSelectedModule(e.target.value)}
              className="w-full appearance-none bg-card border border-border rounded-lg px-3 py-2.5 text-xs text-foreground pr-7 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 cursor-pointer transition-all hover:bg-muted/50"
            >
              {modules.length > 0
                ? modules.map(m => <option key={m} value={m}>Module {m}</option>)
                : <option value="">No modules yet</option>}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Nav sections */}
        {sidebarNav.map(group => (
          <div key={group.section} className="px-4 mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">{group.section}</p>
            {group.items.map(item => {
              const Icon = item.icon;
              const active = view === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setView(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 mb-1 ${
                    active ? "bg-primary/15 text-primary shadow-[inset_2px_0_0_0_currentColor]" : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
        <div className="mt-auto border-t border-border px-5 py-5 bg-card/50">
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Signed in as</p>
          <p className="text-sm font-semibold text-foreground truncate">{user.displayName}</p>
          <button
            onClick={onLogout}
            className="mt-3 flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
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
            onStartExam={() => setView("dt-exam")}
            onGoFlashcards={() => setView("flashcards")}
            onGoPractice={() => setView("practice")}
            history={history}
          />
        )}
        {view === "lecture-notes" && (
          <ContentView title="Lecture Notes" subtitle={`${activeCourse} · Module ${activeModule}`}>
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
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
            <FlashcardGrid cards={filteredCards} course={activeCourse} module={activeModule} userRole={user.role} />
          </ContentView>
        )}
        {view === "practice" && (
          <ContentView title="Practice Questions" subtitle="Self-paced quiz or join a faculty test by code">
            <PracticeTest />
          </ContentView>
        )}
        {view === "dt-exam" && examStage === "done" && (
          <ContentView title="DT Exam — Submitted" subtitle="Your results have been recorded">
            <div className="max-w-md">
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <Award className="w-12 h-12 text-primary mx-auto mb-4" />
                <p className="text-muted-foreground text-sm mb-1">Final Score</p>
                <p className="font-mono text-5xl font-bold text-primary mt-1">
                  {Math.round(examResults.reduce((s, r) => s + r.match, 0) / examResults.length)}%
                </p>
                <button
                  onClick={() => { setExamStage("idle"); setView("dashboard"); }}
                  className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </ContentView>
        )}
        {view === "dt-exam" && examStage === "idle" && (
          <ContentView title="DT Exam" subtitle="Enter a secret code or use the admin-launched exam">
            <DTExamPrompt
              dtLaunched={dtLaunched}
              user={user}
              onStart={startDTExam}
            />
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
      className="h-10 w-auto object-contain drop-shadow-sm"
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
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="mb-6 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Hello, {user.displayName} <span className="inline-block animate-bounce origin-bottom-right">👋</span></h1>
          <p className="text-muted-foreground text-xs lg:text-sm mt-1 font-medium">Welcome back to D-Term — your definitions &amp; terminology hub.</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-6 overflow-y-auto pr-1 pb-4 custom-scrollbar">
          {/* Stat cards combined */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={BookOpen} label="Total Qs" value={String(allQuestions.length)} color="cyan" />
            <StatCard icon={GraduationCap} label="Courses" value={String(totalCourses || "—")} color="purple" />
            <StatCard icon={Target} label="Attempted" value={String(totalAttempted || "—")} color="amber" />
            <StatCard icon={Award} label="Avg Accuracy" value={avgAccuracy !== null ? `${avgAccuracy}%` : "—"} color="green" />
            <StatCard icon={FileText} label="Practice" value={String(practiceRecords.length || "—")} color="purple" />
            <StatCard icon={Lock} label="DT Exams" value={String(dtRecords.length || "—")} color="amber" />
            <StatCard icon={Award} label="Best Score" value={bestScore !== null ? `${bestScore}%` : "—"} color="green" />
            <StatCard icon={Target} label="Modules" value={String(totalModules || "—")} color="cyan" />
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="text-xs font-bold text-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <QuickAction icon={GraduationCap} title="Study Flashcards" desc="Flip through terms" onClick={onGoFlashcards} color="cyan" />
              <QuickAction icon={FileText} title="Practice Test" desc="Test yourself" onClick={onGoPractice} color="purple" />
              <QuickAction icon={Lock} title="DT Exam" desc="Official scheduled tests" onClick={onStartExam} color="amber" />
            </div>
          </div>
        </div>

        {/* Exam History - Scrollable Column */}
        <div className="xl:col-span-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm h-[400px] xl:h-auto">
          <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between shrink-0">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Exam History
            </h2>
            <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{history.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60">
                <Clock className="w-8 h-8 mb-2" />
                <p className="text-xs text-center px-4">No exams taken yet.</p>
              </div>
            ) : (
              history.map((rec) => {
                const dur = fmtDur(rec.endedAt - rec.startedAt);
                const scoreColor = rec.score >= 80 ? "text-green-600 dark:text-green-400" : rec.score >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";
                return (
                  <div key={rec.id} className="bg-background border border-border rounded-xl p-3.5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                        rec.type === "dt"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                      }`}>
                        {rec.type === "dt" ? "DT EXAM" : "PRACTICE"}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground">{fmt(rec.startedAt)}</span>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Course</p>
                        <p className="text-xs text-foreground font-semibold line-clamp-1">{rec.course || "—"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-mono text-xl font-bold leading-none ${scoreColor}`}>{rec.score}%</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-1 pt-3 border-t border-border/50">
                       <div>
                         <p className="text-[9px] text-muted-foreground uppercase">Duration</p>
                         <p className="text-xs font-medium text-foreground">{dur}</p>
                       </div>
                       <div className="text-right">
                         <p className="text-[9px] text-muted-foreground uppercase">Attempted</p>
                         <p className="text-xs font-bold text-foreground">{rec.questionsAttempted}<span className="text-muted-foreground font-medium text-[10px]">/{rec.questionsTotal}</span></p>
                       </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  const colors: Record<string, { iconBg: string; iconText: string }> = {
    cyan: { iconBg: "bg-cyan-500/10", iconText: "text-cyan-600 dark:text-cyan-400" },
    purple: { iconBg: "bg-purple-500/10", iconText: "text-purple-600 dark:text-purple-400" },
    amber: { iconBg: "bg-amber-500/10", iconText: "text-amber-600 dark:text-amber-400" },
    green: { iconBg: "bg-green-500/10", iconText: "text-green-600 dark:text-green-400" },
  };
  
  const theme = colors[color] || colors.cyan;
  
  return (
    <div className="relative overflow-hidden bg-card rounded-xl border border-border p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${theme.iconBg} ${theme.iconText} transition-transform group-hover:scale-110 duration-300`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground line-clamp-1">{label}</div>
      </div>
      <div className="font-mono text-xl sm:text-2xl font-bold text-foreground tracking-tight">{value}</div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, desc, onClick, color }: { icon: React.ElementType; title: string; desc: string; onClick?: () => void; color: string }) {
  const colors: Record<string, string> = {
    cyan: "hover:border-cyan-500/50 hover:shadow-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    purple: "hover:border-purple-500/50 hover:shadow-purple-500/10 text-purple-600 dark:text-purple-400",
    amber: "hover:border-amber-500/50 hover:shadow-amber-500/10 text-amber-600 dark:text-amber-400",
    slate: "opacity-60 cursor-not-allowed text-slate-500",
  };
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`w-full text-left bg-card border border-border rounded-xl p-4 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${colors[color] || ""} group relative overflow-hidden flex items-start gap-3`}
    >
      <div className="p-2.5 bg-muted/50 rounded-lg shrink-0 group-hover:bg-current group-hover:text-white dark:group-hover:text-black transition-colors duration-300">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="font-bold text-foreground text-sm mb-0.5">{title}</div>
        <div className="text-muted-foreground text-[10px] font-medium leading-relaxed">{desc}</div>
      </div>
    </button>
  );
}

import type { Question } from "@/utils/mockData";
function DTExamPrompt({
  user, onStart,
}: {
  dtLaunched?: boolean;
  user: AppUser;
  onStart: (questions: Question[], course: string) => void;
}) {
  const tests = useSyncExternalStore(dtTestStore.subscribe, dtTestStore.getTests, dtTestStore.getTests);
  const activeExams = dtTestStore.getActiveTestsForStudent(user.department || "", user.sem || "");

  return (
    <div className="max-w-xl space-y-5">
      <div className="bg-card border border-primary/30 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Scheduled DT Exams</h3>
            <p className="text-xs text-muted-foreground">Exams scheduled for your department and semester</p>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          {activeExams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-border border-dashed rounded-xl">
              <p className="text-sm">No active DT Exams at the moment.</p>
              <p className="text-xs mt-1">Please check back later according to your schedule.</p>
            </div>
          ) : (
            activeExams.map(exam => (
              <div key={exam.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20">
                <div>
                  <div className="font-bold text-primary">{exam.subject}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Ends at {new Date(exam.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {exam.questions.length} Qs
                  </div>
                </div>
                <button
                  onClick={() => onStart(exam.questions, exam.subject)}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Start Exam
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
