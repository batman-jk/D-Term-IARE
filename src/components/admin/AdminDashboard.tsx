import { useState, useSyncExternalStore, useRef } from "react";
import {
  Home, Database, ToggleRight, Trophy, Users, FileUp, Plus,
  Pencil, Trash2, Check, X, KeyRound, BarChart2, Loader2,
  ChevronDown, Power, PowerOff, Library, FileDown
} from "lucide-react";
import * as XLSX from "xlsx";
import { Sidebar } from "@/components/Sidebar";
import { MOCK_ALL_RESULTS, QUESTIONS, COURSES } from "@/utils/mockData";
import { getDtLaunched, setDtLaunched, subscribeDt } from "@/utils/examStore";
import { userStore, type AppUser, type UserRole } from "@/utils/userStore";
import { questionStore } from "@/utils/questionStore";
import { dtTestStore, type ScheduledExam } from "@/services/dtTestStore";
import { marksStore, type StudentMark } from "@/services/marksStore";
import { DEPARTMENTS, SEMESTERS, REGULATIONS } from "@/utils/constants";
import { departmentStore, type CourseAssignment } from "@/services/departmentStore";
import { toast } from "sonner";

const NAV = [
  { key: "home", label: "Home", icon: Home },
  { key: "manage", label: "DT Control", icon: ToggleRight },
  { key: "departments", label: "Departments & Subjects", icon: Library },
  { key: "marks", label: "Student Marks", icon: BarChart2 },
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
        {tab === "manage" && <ManageTab user={user} />}
        {tab === "marks" && <MarksTab />}
        {tab === "results" && <ResultsTab />}
        {tab === "users" && <UsersTab />}
        {tab === "departments" && <DepartmentsTab />}
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

function ManageTab({ user }: { user: AppUser }) {
  const tests = useSyncExternalStore(dtTestStore.subscribe, dtTestStore.getTests, dtTestStore.getTests);
  const [showForm, setShowForm] = useState(false);

  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [semester, setSemester] = useState(SEMESTERS[0]);
  const [subject, setSubject] = useState("");
  const [module, setModule] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const allQuestions = questionStore.getQuestions();
  
  // Filter assignments matching dept and sem
  const availableSubjects = departmentStore.getAssignments()
    .filter(a => a.department === department && a.semester === semester)
    .map(a => a.subject);
  const uniqueSubjects = Array.from(new Set(availableSubjects));

  const subjectQuestions = allQuestions.filter(q => (q.subject || q.course || "") === subject);
  const availableModules = Array.from(new Set(subjectQuestions.map(q => String(q.module)))).sort();

  const handleCreate = () => {
    if (!subject) { toast.error("Please select a subject."); return; }
    if (!start || !end) { toast.error("Please provide start and end times."); return; }
    if (new Date(start) >= new Date(end)) { toast.error("End time must be after start time."); return; }
    
    const qs = module ? subjectQuestions.filter(q => String(q.module) === module) : subjectQuestions;
    if (qs.length === 0) { toast.error("No questions found for this subject/module. Upload questions first."); return; }
    
    const sTime = new Date(start);
    const eTime = new Date(end);
    const calculatedDuration = Math.round((eTime.getTime() - sTime.getTime()) / 60000);

    dtTestStore.createTest({ 
      department,
      semester,
      subject, 
      module: module || "All", 
      startTime: start,
      endTime: end,
      duration: calculatedDuration, 
      questions: qs, 
      createdBy: user.displayName 
    });
    
    toast.success("DT Exam scheduled successfully!");
    setShowForm(false);
    setModule("");
  };

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="font-mono text-3xl text-foreground">DT Control</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Schedule official DT Exams for specific departments and semesters.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Scheduled DT Exams
          </h2>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule Exam
          </button>
        </div>

        {showForm && (
          <div className="border border-primary bg-card rounded-xl p-5 space-y-4">
            <h3 className="font-mono text-sm font-semibold text-foreground">New DT Exam Schedule</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Department</label>
                <div className="relative">
                  <select value={department} onChange={e => { setDepartment(e.target.value); setSubject(""); }}
                    className="w-full appearance-none bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary pr-8">
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Semester</label>
                <div className="relative">
                  <select value={semester} onChange={e => { setSemester(e.target.value); setSubject(""); }}
                    className="w-full appearance-none bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary pr-8">
                    {SEMESTERS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Subject</label>
                <div className="relative">
                  <select value={subject} onChange={e => { setSubject(e.target.value); setModule(""); }}
                    className="w-full appearance-none bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary pr-8">
                    <option value="">Select Subject...</option>
                    {uniqueSubjects.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Module (blank = all)</label>
                <div className="relative">
                  <select value={module} onChange={e => setModule(e.target.value)} disabled={!subject}
                    className="w-full appearance-none bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary pr-8 disabled:opacity-50">
                    <option value="">All Modules</option>
                    {availableModules.map(m => <option key={m} value={m}>Module {m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Start Time</label>
                <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)}
                  className="w-full bg-input border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">End Time</label>
                <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)}
                  className="w-full bg-input border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="flex items-end">
                <div className="text-xs text-muted-foreground border border-border rounded-lg p-3 bg-muted/20 w-full">
                  <span className="font-semibold text-foreground">Questions: </span>
                  {subject ? (module ? subjectQuestions.filter(q => String(q.module) === module).length : subjectQuestions.length) : 0} from {subject || 'none'}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleCreate}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-semibold hover:bg-primary/90">
                <Check className="w-4 h-4" /> Schedule Exam
              </button>
              <button onClick={() => setShowForm(false)}
                className="flex items-center gap-1.5 border border-border px-4 py-2 rounded text-sm text-muted-foreground hover:bg-muted">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        )}

        <div className="border border-border bg-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Dept / Sem</th>
                <th className="px-4 py-3">Subject / Mod</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  No scheduled exams yet. Click "Schedule Exam" above.
                </td></tr>
              ) : tests.map(t => {
                const now = new Date();
                const sTime = new Date(t.startTime);
                const eTime = new Date(t.endTime);
                let status = "Upcoming";
                let statusColor = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
                
                if (now > eTime) {
                  status = "Completed";
                  statusColor = "bg-muted text-muted-foreground border-border";
                } else if (now >= sTime && now <= eTime) {
                  status = "Active Now";
                  statusColor = "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
                }

                return (
                  <tr key={t.id} className="border-t border-border hover:bg-muted/40 transition-colors group/row">
                    <td className="px-4 py-3 font-medium text-foreground">{t.department} / Sem {t.semester}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-primary">{t.subject}</div>
                      <div className="text-xs text-muted-foreground">Mod: {t.module} ({t.questions.length} qs)</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                      {sTime.toLocaleString()} <br/>to {eTime.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t.duration}m</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-bold ${statusColor}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { dtTestStore.deleteTest(t.id); toast.success("Scheduled exam deleted."); }}
                        className="opacity-0 group-hover/row:opacity-100 flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-auto">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
  const users = useSyncExternalStore(userStore.subscribe, userStore.getUsers, userStore.getUsers);

  // Tabs: Admin, Faculty, Student
  const [activeTab, setActiveTab] = useState<UserRole>("Student");

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  
  // Faculty & Student extra fields
  const [newDepartment, setNewDepartment] = useState(DEPARTMENTS[0]);
  const [newSem, setNewSem] = useState(SEMESTERS[0]);
  const [newSection, setNewSection] = useState("");
  const [newSubject, setNewSubject] = useState(""); // Only used for Faculty now

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState("");

  const filteredUsers = users.filter(u => u.role === activeTab);

  const handleCreate = () => {
    if (!newUsername.trim() || !newPassword || !newDisplayName.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    const result = userStore.addUser({
      username: newUsername.trim(),
      password: newPassword,
      displayName: newDisplayName.trim(),
      role: activeTab,
      department: (activeTab === "Student" || activeTab === "Faculty") ? newDepartment.trim() : undefined,
      sem: activeTab === "Student" ? newSem.trim() : undefined,
      section: (activeTab === "Student" || activeTab === "Faculty") ? newSection.trim() : undefined,
      subject: activeTab === "Faculty" ? newSubject.trim() : undefined,
    });
    
    if (result.ok) {
      toast.success(`User "${newUsername.trim()}" created as ${activeTab}.`);
      setNewUsername("");
      setNewPassword("");
      setNewDisplayName("");
      setNewDepartment("");
      setNewSem("");
      setNewSection("");
      setNewSubject("");
      setShowCreate(false);
    } else {
      toast.error(result.error ?? "Failed to create user.");
    }
  };

  const handleSavePassword = (id: string) => {
    if (!editPassword) { toast.error("Password cannot be empty."); return; }
    const result = userStore.updateUser(id, { password: editPassword });
    if (result.ok) {
      toast.success("Password updated.");
      setEditingId(null);
      setEditPassword("");
    } else {
      toast.error(result.error ?? "Failed to update.");
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-mono text-3xl text-foreground">Manage Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage login credentials, split by role.
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(v => !v); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> New {activeTab}
        </button>
      </div>

      {/* Role Tabs */}
      <div className="flex border-b border-border mb-6">
        {(["Admin", "Faculty", "Student"] as UserRole[]).map(role => (
          <button
            key={role}
            onClick={() => { setActiveTab(role); setShowCreate(false); }}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === role 
                ? "border-primary text-primary bg-primary/5" 
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {role}s ({users.filter(u => u.role === role).length})
          </button>
        ))}
      </div>

      {/* Create User Panel */}
      {showCreate && (
        <div className="border border-primary bg-card rounded-xl p-6 mb-6">
          <h2 className="font-mono text-base font-semibold text-foreground mb-4">
            Create New {activeTab}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Display Name</label>
              <input value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} placeholder="e.g. Dr. Sharma" className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Username</label>
              <input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Login ID" className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Set password" className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            </div>
          </div>

          {activeTab === "Faculty" && (
            <div className="grid grid-cols-3 gap-4 mb-5 p-4 border border-border rounded-xl bg-muted/20">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Department</label>
                <div className="relative">
                  <select value={newDepartment} onChange={e => setNewDepartment(e.target.value)} className="w-full appearance-none bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none pr-8">
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Section(s)</label>
                <input value={newSection} onChange={e => setNewSection(e.target.value)} placeholder="e.g. A, B" className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Subject(s)</label>
                <input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="e.g. DAA, OS" className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
              </div>
            </div>
          )}

          {activeTab === "Student" && (
            <div className="grid grid-cols-3 gap-4 mb-5 p-4 border border-border rounded-xl bg-muted/20">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Department</label>
                <div className="relative">
                  <select value={newDepartment} onChange={e => setNewDepartment(e.target.value)} className="w-full appearance-none bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none pr-8">
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Semester</label>
                <div className="relative">
                  <select value={newSem} onChange={e => setNewSem(e.target.value)} className="w-full appearance-none bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none pr-8">
                    {SEMESTERS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Section</label>
                <input value={newSection} onChange={e => setNewSection(e.target.value)} placeholder="e.g. A" className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleCreate} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90">
              <Check className="w-4 h-4" /> Create User
            </button>
            <button onClick={() => setShowCreate(false)} className="flex items-center gap-1.5 border border-border px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="border border-border bg-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Display Name</th>
              <th className="px-4 py-3">Username</th>
              {activeTab !== "Admin" && <th className="px-4 py-3">Details</th>}
              <th className="px-4 py-3">Password</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No {activeTab}s found.</td></tr>
            ) : filteredUsers.map((u) => (
              <tr key={u.id} className="border-t border-border group/row hover:bg-muted/40 transition-colors">
                <td className="px-4 py-3 font-semibold text-foreground">{u.displayName}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{u.username}</td>
                
                {activeTab !== "Admin" && (
                  <td className="px-4 py-3">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                      {activeTab === "Faculty" && (
                        <>
                          {u.department && <div className="text-primary font-bold">{u.department}</div>}
                          {u.section && <div>Sec: {u.section}</div>}
                          {u.subject && <div>Sub: {u.subject}</div>}
                        </>
                      )}
                      {activeTab === "Student" && (
                        <>
                          {[u.department, u.sem ? `Sem ${u.sem}` : "", u.section ? `Sec ${u.section}` : ""].filter(Boolean).join(" • ")}
                        </>
                      )}
                    </div>
                  </td>
                )}

                <td className="px-4 py-3">
                  {editingId === u.id ? (
                    <div className="flex items-center gap-1.5">
                      <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="New password"
                        className="bg-input border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary w-32" autoFocus />
                      <button onClick={() => handleSavePassword(u.id)} className="text-primary hover:text-primary/80"><Check className="w-4 h-4" /></button>
                      <button onClick={() => { setEditingId(null); setEditPassword(""); }} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <span className="font-mono text-muted-foreground tracking-widest">••••••••</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingId(u.id); setEditPassword(""); }} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-primary hover:bg-primary/10">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    {u.id !== "admin-root" && (
                      <button onClick={() => { userStore.deleteUser(u.id); toast.success("Deleted"); }} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
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

// ═══════════════════════════════════════════════════════════════════════════
// MARKS TAB — Admin-only student marks + Excel export
// ═══════════════════════════════════════════════════════════════════════════
function MarksTab() {
  const marks = useSyncExternalStore(
    marksStore.subscribe,
    marksStore.getAll,
    marksStore.getAll,
  );

  const [filterDept, setFilterDept] = useState("");
  const [filterSem, setFilterSem] = useState("");
  const [filterType, setFilterType] = useState<"" | StudentMark["testType"]>("");
  const [isExporting, setIsExporting] = useState(false);

  const _departments = DEPARTMENTS;
  const _sems = SEMESTERS;

  const filtered = marks.filter(m => {
    if (filterDept && m.department !== filterDept) return false;
    if (filterSem && m.sem !== filterSem) return false;
    if (filterType && m.testType !== filterType) return false;
    return true;
  });

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error("No data to export.");
      return;
    }
    setIsExporting(true);
    try {
      const exportData = filtered.map(m => ({
        "Student Name": m.studentName,
        "Username": m.studentUsername,
        "Department": m.department,
        "Semester": m.sem,
        "Section": m.section,
        "Subject": m.subject,
        "Test Type": m.testType.toUpperCase(),
        "Score (%)": m.score,
        "Date": m.date
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Student Marks");
      XLSX.writeFile(wb, `IARE_Student_Marks_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Marks exported successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export marks.");
    } finally {
      setIsExporting(false);
    }
  };

  const scoreColor = (s: number) =>
    s >= 80 ? "text-green-600 dark:text-green-400" : s >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-mono text-3xl text-foreground">Student Marks</h1>
          <p className="text-sm text-muted-foreground mt-1">Admin-only view of all student exam results and imported marks.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            Export Marks (Excel)
          </button>
        </div>
      </div>



      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5 max-w-4xl">
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary min-w-[140px]"
        >
          <option value="">All Departments</option>
          {_departments.map(d => <option key={d}>{d}</option>)}
        </select>
        <select
          value={filterSem}
          onChange={e => setFilterSem(e.target.value)}
          className="bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary min-w-[120px]"
        >
          <option value="">All Semesters</option>
          {_sems.map(s => <option key={s}>Sem {s}</option>)}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as "" | StudentMark["testType"])}
          className="bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary min-w-[140px]"
        >
          <option value="">All Types</option>
          <option value="dt">DT Exam</option>
          <option value="practice">Practice</option>
          <option value="imported">Imported</option>
        </select>
        <span className="ml-auto self-center text-sm text-muted-foreground font-mono">
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="border border-border bg-card rounded-xl overflow-hidden max-w-5xl">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Dept / Sem / Sec</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  No records yet. Import an Excel file or students will appear here after taking exams.
                </td>
              </tr>
            ) : (
              filtered.map(m => (
                <tr key={m.id} className="border-t border-border hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{m.studentName}</div>
                    <div className="font-mono text-xs text-muted-foreground">{m.studentUsername}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {[m.department, m.sem ? `Sem ${m.sem}` : "", m.section ? `Sec ${m.section}` : ""].filter(Boolean).join(" • ")}
                  </td>
                  <td className="px-4 py-3 text-foreground">{m.subject || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      m.testType === "dt"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        : m.testType === "practice"
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                    }`}>
                      {m.testType === "dt" ? "DT" : m.testType === "practice" ? "PRACTICE" : "IMPORTED"}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-mono font-bold ${scoreColor(m.score)}`}>{m.score}%</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DepartmentsTab() {
  const assignments = useSyncExternalStore(departmentStore.subscribe, departmentStore.getAssignments, departmentStore.getAssignments);
  const users = useSyncExternalStore(userStore.subscribe, userStore.getUsers, userStore.getUsers);
  const faculties = users.filter(u => u.role === "Faculty");

  const [editingId, setEditingId] = useState<string | null>(null); // "new" for create, ID for edit
  const [filterDept, setFilterDept] = useState("");
  const [filterReg, setFilterReg] = useState("");
  
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [semester, setSemester] = useState(SEMESTERS[0]);
  const [regulation, setRegulation] = useState(REGULATIONS[0]);
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [facultyId, setFacultyId] = useState("");

  const filteredAssignments = assignments.filter(a => 
    (!filterDept || a.department === filterDept) && 
    (!filterReg || a.regulation === filterReg)
  );

  const openForm = (id: string | null) => {
    if (id === "new" || !id) {
      setEditingId("new");
      setDepartment(DEPARTMENTS[0]);
      setSemester(SEMESTERS[0]);
      setRegulation(REGULATIONS[0]);
      setSection("");
      setSubject("");
      setFacultyId("");
    } else {
      const a = assignments.find(x => x.id === id);
      if (a) {
        setEditingId(id);
        setDepartment(a.department);
        setSemester(a.semester);
        setRegulation(a.regulation || REGULATIONS[0]);
        setSection(a.section);
        setSubject(a.subject);
        setFacultyId(a.facultyId);
      }
    }
  };

  const handleSave = () => {
    if (!department || !semester || !section || !subject || !facultyId) {
      toast.error("Please fill in all fields.");
      return;
    }
    
    const payload = {
      department: department.trim(),
      semester: semester.trim(),
      regulation: regulation.trim(),
      section: section.trim(),
      subject: subject.trim(),
      facultyId,
    };

    let result;
    if (editingId === "new") {
      result = departmentStore.addAssignment(payload);
    } else if (editingId) {
      result = departmentStore.updateAssignment(editingId, payload);
    }

    if (result?.ok) {
      toast.success(editingId === "new" ? "Assignment created successfully." : "Assignment updated successfully.");
      setEditingId(null);
    } else {
      toast.error(result?.error ?? "Failed to save assignment.");
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-mono text-3xl text-foreground">Departments & Subjects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Map subjects to specific departments and assign faculty members.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select
              value={filterReg}
              onChange={e => setFilterReg(e.target.value)}
              className="appearance-none bg-input border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary pr-8"
            >
              <option value="">All Regulations</option>
              {REGULATIONS.map(r => <option key={r}>{r}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="appearance-none bg-input border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary pr-8"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          <button
            onClick={() => openForm("new")}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Assignment
          </button>
        </div>
      </div>

      {editingId && (
        <div className="border border-primary bg-card rounded-xl p-6 mb-6">
          <h2 className="font-mono text-base font-semibold text-foreground mb-4">
            {editingId === "new" ? "Create Class Assignment" : "Edit Class Assignment"}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Department</label>
              <div className="relative">
                <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full appearance-none bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none pr-8">
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Semester</label>
              <div className="relative">
                <select value={semester} onChange={e => setSemester(e.target.value)} className="w-full appearance-none bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none pr-8">
                  {SEMESTERS.map(s => <option key={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Regulation</label>
              <div className="relative">
                <select value={regulation} onChange={e => setRegulation(e.target.value)} className="w-full appearance-none bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none pr-8">
                  {REGULATIONS.map(r => <option key={r}>{r}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Section</label>
              <input value={section} onChange={e => setSection(e.target.value)} placeholder="e.g. A" className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. DAA" className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Faculty</label>
              <div className="relative">
                <select value={facultyId} onChange={e => setFacultyId(e.target.value)} className="w-full appearance-none bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none pr-8">
                  <option value="">Select Faculty...</option>
                  {faculties.map(f => <option key={f.id} value={f.id}>{f.displayName}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90">
              <Check className="w-4 h-4" /> Save Assignment
            </button>
            <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 border border-border px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="border border-border bg-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Dept / Reg</th>
              <th className="px-4 py-3">Sem / Sec</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Assigned Faculty</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No assignments found.</td></tr>
            ) : filteredAssignments.map((a) => {
              const faculty = faculties.find(f => f.id === a.facultyId);
              return (
                <tr key={a.id} className="border-t border-border group/row hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{a.department}</div>
                    <div className="text-[10px] uppercase tracking-tighter text-muted-foreground">{a.regulation}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    Sem {a.semester} • Sec {a.section}
                  </td>
                  <td className="px-4 py-3 font-medium text-primary">{a.subject}</td>
                  <td className="px-4 py-3">
                    {faculty ? (
                      <span className="inline-block bg-primary/15 text-primary px-2 py-0.5 rounded text-xs font-semibold">
                        {faculty.displayName}
                      </span>
                    ) : (
                      <span className="text-destructive text-xs">Unknown/Deleted Faculty</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                      <button onClick={() => openForm(a.id)} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-primary hover:bg-primary/10">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => { departmentStore.deleteAssignment(a.id); toast.success("Deleted"); }} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
