import { useState, useSyncExternalStore } from "react";
import {
  Home,
  Database,
  ToggleRight,
  Trophy,
  Users,
  FileUp,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { MOCK_ALL_RESULTS, QUESTIONS, COURSES } from "@/utils/mockData";
import { getDtLaunched, setDtLaunched, subscribeDt } from "@/utils/examStore";
import { userStore, type AppUser, type UserRole } from "@/utils/userStore";
import { toast } from "sonner";

const NAV = [
  { key: "home", label: "Home", icon: Home },
  { key: "qbank", label: "Upload Question Bank", icon: Database },
  { key: "manage", label: "Manage DT Exam", icon: ToggleRight },
  { key: "results", label: "All Results", icon: Trophy },
  { key: "users", label: "Manage Users", icon: Users },
];

export function AdminDashboard({
  user,
  onLogout,
}: {
  user: AppUser;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState("home");

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar
        items={NAV}
        active={tab}
        onSelect={setTab}
        role="Admin"
        user={user.displayName}
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
      <p className="text-sm text-muted-foreground mt-1">Platform-wide controls and analytics.</p>
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
  const launched = useSyncExternalStore((cb) => subscribeDt(cb), getDtLaunched, getDtLaunched);
  const [courses, setCourses] = useState<string[]>([COURSES[0]]);
  const [start, setStart] = useState("2025-04-25T09:00");
  const [end, setEnd] = useState("2025-04-25T11:00");

  const toggleCourse = (s: string) =>
    setCourses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

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
            {COURSES.map((c) => (
              <button
                key={c}
                onClick={() => toggleCourse(c)}
                className={`px-3 py-1.5 text-sm rounded border ${
                  courses.includes(c)
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {c}
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
  const filtered = filter ? MOCK_ALL_RESULTS.filter((r) => r.course === filter) : MOCK_ALL_RESULTS;
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
          <option value="">All Courses</option>
          {COURSES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="border border-border bg-card rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">DT Score</th>
              <th className="px-4 py-3">Practice Scores</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-4 py-3">{r.student}</td>
                <td className="px-4 py-3">{r.course}</td>
                <td className="px-4 py-3 font-mono text-primary">{r.dt > 0 ? `${r.dt}%` : "—"}</td>
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
  const users = useSyncExternalStore(
    userStore.subscribe,
    userStore.getUsers,
    userStore.getUsers,
  );

  // ── Create form state ──────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("Student");

  // ── Edit password state ────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState("");

  const roleBadge = (role: string) =>
    role === "Admin"
      ? "bg-destructive/20 text-destructive border-destructive"
      : role === "Faculty"
        ? "bg-primary/15 text-primary border-primary"
        : "border-border text-muted-foreground";

  const handleCreate = () => {
    if (!newUsername.trim() || !newPassword || !newDisplayName.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    const result = userStore.addUser({
      username: newUsername.trim(),
      password: newPassword,
      displayName: newDisplayName.trim(),
      role: newRole,
    });
    if (result.ok) {
      toast.success(`User "${newUsername.trim()}" created as ${newRole}.`);
      setNewUsername("");
      setNewPassword("");
      setNewDisplayName("");
      setNewRole("Student");
      setShowCreate(false);
    } else {
      toast.error(result.error ?? "Failed to create user.");
    }
  };

  const handleSavePassword = (id: string) => {
    if (!editPassword) {
      toast.error("Password cannot be empty.");
      return;
    }
    const result = userStore.updateUser(id, { password: editPassword });
    if (result.ok) {
      toast.success("Password updated.");
      setEditingId(null);
      setEditPassword("");
    } else {
      toast.error(result.error ?? "Failed to update.");
    }
  };

  const handleDelete = (id: string, username: string) => {
    const result = userStore.deleteUser(id);
    if (result.ok) {
      toast.success(`User "${username}" deleted.`);
    } else {
      toast.error(result.error ?? "Cannot delete user.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-mono text-3xl text-foreground">Manage Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage login credentials for Faculty, Students, and Admins.
          </p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New User
        </button>
      </div>

      {/* ── Create User Panel ─────────────────────────────────────────────── */}
      {showCreate && (
        <div className="border border-primary bg-card rounded p-5 mb-6 max-w-2xl">
          <h2 className="font-mono text-base font-semibold text-foreground mb-4">
            Create New User
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Display Name
              </label>
              <input
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="e.g. Dr. Sharma"
                className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              >
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Username
              </label>
              <input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Login username"
                className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Set password"
                className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-semibold hover:bg-primary/90"
            >
              <Check className="w-4 h-4" /> Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="flex items-center gap-1.5 border border-border px-4 py-2 rounded text-sm text-muted-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Users Table ───────────────────────────────────────────────────── */}
      <div className="border border-border bg-card rounded overflow-hidden max-w-4xl">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Display Name</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Password</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-t border-border group/row hover:bg-muted/40 transition-colors"
              >
                <td className="px-4 py-3 font-semibold">{u.displayName}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {u.username}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block text-xs font-mono px-2 py-0.5 rounded border ${roleBadge(u.role)}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {editingId === u.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="New password"
                        className="bg-input border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary w-36"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSavePassword(u.id)}
                        className="text-primary hover:text-primary/80"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditPassword("");
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="font-mono text-muted-foreground tracking-widest">
                      ••••••••
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingId(u.id);
                        setEditPassword("");
                      }}
                      title="Edit password"
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    {u.id !== "admin-root" && (
                      <button
                        onClick={() => handleDelete(u.id, u.username)}
                        title="Delete user"
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
