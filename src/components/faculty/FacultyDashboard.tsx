import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { questionStore } from "@/utils/questionStore";
import { Home, Upload, FileText, Trophy, FileUp, ChevronDown, Trash2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { MOCK_RESOURCES, MOCK_FACULTY_RESULTS, COURSES } from "@/utils/mockData";
import type { AppUser } from "@/utils/userStore";

const NAV = [
  { key: "home", label: "Home", icon: Home },
  { key: "upload", label: "Upload Resources", icon: Upload },
  { key: "conduct", label: "Conduct Practice Test", icon: FileText },
  { key: "results", label: "Results", icon: Trophy },
];

export function FacultyDashboard({
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
        role="Faculty"
        user={user.displayName}
        onLogout={onLogout}
      />
      <main className="flex-1 p-8 overflow-auto">
        {tab === "home" && <HomeTab name={user.displayName} />}
        {tab === "upload" && <UploadTab />}
        {tab === "conduct" && <ConductTab />}
        {tab === "results" && <ResultsTab />}
      </main>
    </div>
  );
}

function HomeTab({ name }: { name: string }) {
  return (
    <div>
      <h1 className="font-mono text-3xl text-foreground">Welcome, {name}</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Manage your resources, practice tests, and class results.
      </p>
      <div className="grid grid-cols-3 gap-4 mt-6 max-w-3xl">
        <Stat label="Resources Uploaded" value="12" />
        <Stat label="Tests Conducted" value="5" />
        <Stat label="Avg Class Score" value="74%" />
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

function UploadTab() {
  const [files, setFiles] = useState(MOCK_RESOURCES.map((f, i) => ({ ...f, id: `init-${i}` })));
  const [course, setCourse] = useState(COURSES[0]);
  const [module, setModule] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        console.log("File loaded, starting to parse...");
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const jsonData =
          XLSX.utils.sheet_to_json<Record<string, string | number | boolean | null>>(ws);
        console.log("Parsed JSON Data:", jsonData);

        const newQuestions = jsonData
          .map((row) => {
            const normalizedRow: Record<string, string | number | boolean | null> = {};
            for (const key in row) {
              normalizedRow[key.toLowerCase().trim()] = row[key];
            }
            return {
              course: String(normalizedRow.course || normalizedRow.subject || wsname || course),
              subject: String(normalizedRow.subject || normalizedRow.course || wsname || course),
              module: normalizedRow.module || normalizedRow.modulename || normalizedRow.module_name || module,
              question: String(normalizedRow.question ?? ""),
              answer: String(normalizedRow.answer ?? ""),
              keywords:
                typeof normalizedRow.keywords === "string"
                  ? normalizedRow.keywords.split(",").map((k) => k.trim())
                  : [],
            };
          })
          .filter((q) => q.question && q.answer);

        console.log("Extracted Questions:", newQuestions);

        if (newQuestions.length > 0) {
          questionStore.addQuestions(newQuestions);
          toast.success(`✓ ${newQuestions.length} questions added to ${course} · Module ${module}`);
          setFiles((prev) => [
            {
              id: `${Date.now()}`,
              filename: file.name,
              course,
              module,
              date: new Date().toISOString().slice(0, 10),
            },
            ...prev,
          ]);
        } else {
          toast.error(
            "No valid questions found. Check column headers: question, answer, keywords.",
          );
        }
      } catch (err) {
        console.error("Error parsing file:", err);
        toast.error("Failed to parse file.");
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsArrayBuffer(file);
  };

  const deleteFile = (id: string) => {
    const target = files.find((f) => f.id === id);
    if (target) {
      questionStore.removeByFile(target.course, target.module);
    }
    setFiles((prev) => prev.filter((f) => f.id !== id));
    toast.success(
      target
        ? `Removed ${target.filename} and its questions from ${target.course} · Module ${target.module}.`
        : "File removed.",
    );
  };

  // Only show files for the currently selected course
  const courseFiles = files.filter((f) => f.course === course);

  return (
    <div>
      <h1 className="font-mono text-3xl text-foreground">Upload Resources</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Select the course and module, then upload a .csv or .xlsx question file.
      </p>

      {/* Selectors */}
      <div className="flex flex-wrap gap-4 mb-5 max-w-3xl">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
            Course
          </label>
          <div className="relative">
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full appearance-none bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary pr-8"
            >
              {COURSES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="min-w-[130px]">
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
            Module
          </label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((m) => (
              <button
                key={m}
                onClick={() => setModule(m)}
                className={`w-9 h-9 text-sm font-mono rounded border transition-colors ${
                  module === m
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upload button */}
      <input
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full max-w-3xl border-2 border-dashed border-border rounded p-10 text-center hover:border-primary transition-colors mb-8 cursor-pointer group"
      >
        <FileUp className="w-10 h-10 text-muted-foreground mx-auto mb-3 group-hover:text-primary transition-colors" />
        <div className="text-foreground font-mono">
          Upload for <span className="text-primary">{course}</span> · Module{" "}
          <span className="text-primary">{module}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Accepts .csv or .xlsx — columns: question, answer, keywords
        </div>
      </button>

      {/* Files for selected course only */}
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
            {course} — uploaded files
          </div>
          <div className="text-xs text-muted-foreground">
            {courseFiles.length} file{courseFiles.length !== 1 ? "s" : ""}
          </div>
        </div>

        {courseFiles.length === 0 ? (
          <div className="border border-dashed border-border rounded p-8 text-center text-sm text-muted-foreground">
            No files uploaded for <span className="text-foreground font-mono">{course}</span> yet.
          </div>
        ) : (
          <div className="border border-border bg-card rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-3">Filename</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courseFiles.map((f) => (
                  <tr
                    key={f.id}
                    className="border-t border-border group/row hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono">{f.filename}</td>
                    <td className="px-4 py-3 font-mono text-primary">Module {f.module}</td>
                    <td className="px-4 py-3 text-muted-foreground">{f.date}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteFile(f.id)}
                        title="Delete file"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover/row:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ConductTab() {
  const storeQuestions = questionStore.getQuestions();
  const subjects = Array.from(new Set(storeQuestions.map(q => q.subject || q.course || "General"))).filter(Boolean);
  
  const [subject, setSubject] = useState(subjects[0] || COURSES[0]);
  const [course, setCourse] = useState(subjects[0] || COURSES[0]);
  const [modules, setModules] = useState<Array<number | string>>([]);
  const [duration, setDuration] = useState(15);
  const [code, setCode] = useState<string | null>(null);

  const toggle = (m: number | string) =>
    setModules((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const subjectQuestions = storeQuestions.filter(q => (q.subject || "General") === subject);
  const availableModules = Array.from(new Set(subjectQuestions.map(q => q.module))).sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  });

  const launch = () => {
    const c = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCode(c);
  };

  return (
    <div>
      <h1 className="font-mono text-3xl text-foreground">Conduct Practice Test</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Build a custom test for your students.
      </p>

      <div className="border border-border bg-card rounded p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
            Course
          </label>
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="w-full bg-input border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
          >
            {subjects.length > 0 ? subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            )) : (
              COURSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
            Modules
          </label>
          <div className="flex gap-2 flex-wrap">
            {availableModules.length > 0 ? availableModules.map((m) => (
              <button
                key={String(m)}
                onClick={() => toggle(m)}
                className={`px-3 py-1.5 text-sm rounded border font-mono ${
                  modules.includes(m)
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                {typeof m === "number" ? `M${m}` : String(m)}
              </button>
            )) : (
              <div className="text-sm text-muted-foreground italic">No modules available</div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
            Duration (min)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full bg-input border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <button
          onClick={launch}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded font-semibold hover:bg-primary/90"
        >
          Launch Practice Test
        </button>

        {code && (
          <div className="border border-primary bg-primary/10 rounded p-4 text-center">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Join Code</div>
            <div className="font-mono text-3xl font-bold text-primary mt-2 tracking-widest">
              {code}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Share with students to join the test.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultsTab() {
  return (
    <div>
      <h1 className="font-mono text-3xl text-foreground">Test Results</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Results from practice tests you created. (No access to DT exam results.)
      </p>
      <div className="border border-border bg-card rounded overflow-hidden max-w-3xl">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_FACULTY_RESULTS.map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-4 py-3">{r.student}</td>
                <td className="px-4 py-3">{r.course}</td>
                <td className="px-4 py-3 font-mono text-primary">{r.score}%</td>
                <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
