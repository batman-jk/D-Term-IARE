import { useState, useSyncExternalStore } from "react";
import { Home, Database, ToggleRight, Trophy, Users, FileUp } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { MOCK_USERS, MOCK_ALL_RESULTS, QUESTIONS, SUBJECTS } from "@/utils/mockData";
import { getDtLaunched, setDtLaunched, subscribeDt } from "@/utils/examStore";

const NAV = [
  { key: "home", label: "Home", icon: Home },
  { key: "qbank", label: "Upload Question Bank", icon: Database },
  { key: "manage", label: "Manage DT Exam", icon: ToggleRight },
  { key: "results", label: "All Results", icon: Trophy },
  { key: "users", label: "Manage Users", icon: Users },
];

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState("home");

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar
        items={NAV}
        active={tab}
        onSelect={setTab}
        role="Admin"
        user="Admin"
        onLogout={onLogout}
      />
      <main className="flex-1 p-8 overflow-auto">
        {tab === "home" && <HomeTab />}
        {tab === "qbank" && <QBankTab />}
        {tab === "manage" && <ManageTab />}
        {tab === "results" && <ResultsTab />}
        {tab === "users" && <UsersTab />}
      </main>
    </div>
  );
}

function HomeTab() {
  return (
    <div>
      <h1 className="font-mono text-3xl text-foreground">Admin Console</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Platform-wide controls and analytics.
      </p>
      <div className="grid grid-cols-4 gap-4 mt-6 max-w-4xl">
        <Stat label="Total Users" value="142" />
        <Stat label="Active Faculty" value="18" />
        <Stat label="Question Bank" value={`${QUESTIONS.length}`} />
        <Stat label="DT Exams Run" value="3" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card rounded p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-mono text-3xl font-bold text-foreground mt-2">{value}</div>
    </div>
  );
}

function QBankTab() {
  return (
    <div>
      <h1 className="font-mono text-3xl text-foreground">Upload Question Bank</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Upload an XLSX file. Preview parsed below.
      </p>

      <button className="w-full max-w-3xl border-2 border-dashed border-border rounded p-10 text-center hover:border-primary transition-colors mb-6">
        <FileUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <div className="text-foreground font-mono">Drop XLSX file or click (mock)</div>
        <div className="text-xs text-muted-foreground mt-1">
          Columns: Module · Question · Answer · Keywords
        </div>
      </button>

      <div className="border border-border bg-card rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Question</th>
              <th className="px-4 py-3">Answer</th>
              <th className="px-4 py-3">Keywords</th>
            </tr>
          </thead>
          <tbody>
            {QUESTIONS.slice(0, 12).map((q) => (
              <tr key={q.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-primary">M{q.module}</td>
                <td className="px-4 py-3 font-mono">{q.question}</td>
                <td className="px-4 py-3 text-muted-foreground">{q.answer}</td>
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                  {q.keywords.join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ManageTab() {
  const launched = useSyncExternalStore(
    (cb) => subscribeDt(cb),
    getDtLaunched,
    getDtLaunched,
  );
  const [subjects, setSubjects] = useState<string[]>([SUBJECTS[0]]);
  const [start, setStart] = useState("2025-04-25T09:00");
  const [end, setEnd] = useState("2025-04-25T11:00");

  const toggleSubj = (s: string) =>
    setSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  return (
    <div>
      <h1 className="font-mono text-3xl text-foreground">Manage DT Exam</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Toggle launch state and configure the exam window.
      </p>

      <div className="border-2 border-primary bg-card rounded p-6 mb-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-xl text-foreground">Launch DT Exam</div>
            <div className="text-sm text-muted-foreground mt-1">
              {launched
                ? "Exam is LIVE — students can take it now."
                : "Exam is OFF — students see locked state."}
            </div>
          </div>
          <button
            onClick={() => setDtLaunched(!launched)}
            className={`relative w-16 h-8 rounded transition-colors ${
              launched ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-1 w-6 h-6 bg-card rounded transition-transform ${
                launched ? "translate-x-9" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="border border-border bg-card rounded p-6 max-w-2xl space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
            Included Subjects
          </label>
          <div className="flex gap-2 flex-wrap">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => toggleSubj(s)}
                className={`px-3 py-1.5 text-sm rounded border ${
                  subjects.includes(s)
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
              Start
            </label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full bg-input border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
              End
            </label>
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full bg-input border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsTab() {
  const [filter, setFilter] = useState("");
  const filtered = filter
    ? MOCK_ALL_RESULTS.filter((r) => r.subject === filter)
    : MOCK_ALL_RESULTS;
  return (
    <div>
      <h1 className="font-mono text-3xl text-foreground">All Results</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        DT and practice scores across all students.
      </p>
      <div className="mb-4 max-w-xs">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-input border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">All Subjects</option>
          {SUBJECTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="border border-border bg-card rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">DT Score</th>
              <th className="px-4 py-3">Practice Scores</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-4 py-3">{r.student}</td>
                <td className="px-4 py-3">{r.subject}</td>
                <td className="px-4 py-3 font-mono text-primary">
                  {r.dt > 0 ? `${r.dt}%` : "—"}
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{r.practice}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersTab() {
  const badge = (role: string) =>
    role === "Admin"
      ? "bg-destructive/20 text-destructive border-destructive"
      : role === "Faculty"
        ? "bg-primary/15 text-primary border-primary"
        : "border-border text-muted-foreground";

  return (
    <div>
      <h1 className="font-mono text-3xl text-foreground">Manage Users</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Roles & access for everyone on the platform.
      </p>
      <div className="border border-border bg-card rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_USERS.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block text-xs font-mono px-2 py-0.5 rounded border ${badge(u.role)}`}
                  >
                    {u.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}