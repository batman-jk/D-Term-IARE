import { useState, useRef, useSyncExternalStore, useEffect } from "react";
import { useStoreAsync } from "@/hooks/useStoreAsync";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { questionStore } from "@/utils/questionStore";
import { practiceTestStore } from "@/services/practiceTestStore";
import { fileStore } from "@/services/fileStore";
import { Home, Upload, FileText, Trophy, FileUp, ChevronDown, Trash2, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { MOCK_RESOURCES, MOCK_FACULTY_RESULTS, COURSES } from "@/utils/mockData";
import type { AppUser } from "@/utils/userStore";
import { departmentStore } from "@/services/departmentStore";
import { marksStore } from "@/services/marksStore";
import { mistralService } from "@/services/mistralService";

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

  // Real data for stats
  const files = useSyncExternalStore(fileStore.subscribe, fileStore.getFiles, fileStore.getFiles);
  const assignments = useStoreAsync(departmentStore.subscribe, departmentStore.getAssignments, []).filter(a => 
    a.facultyId === user.id || a.facultyId === user.username || a.facultyId === user.displayName
  );
  const assignedSubjects = Array.from(new Set([
    ...assignments.map(a => a.subject),
    user.subject
  ].filter(Boolean) as string[]));

  const facultyFiles = files.filter(f => assignedSubjects.includes(f.course));
  
  const marks = useStoreAsync(marksStore.subscribe, marksStore.getAll, []);
  const facultyMarks = marks.filter(m => 
    m.testType === "practice" && 
    assignedSubjects.includes(m.subject) &&
    m.notes === "Joined via faculty code"
  );

  const avgScore = facultyMarks.length > 0 
    ? Math.round(facultyMarks.reduce((acc, m) => acc + m.score, 0) / facultyMarks.length)
    : 0;

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
        {tab === "home" && (
          <HomeTab 
            name={user.displayName} 
            resourceCount={facultyFiles.length}
            testCount={facultyMarks.length}
            avgScore={avgScore}
          />
        )}
        {tab === "upload" && <UploadTab user={user} />}
        {tab === "conduct" && <ConductTab user={user} />}
        {tab === "results" && <ResultsTab user={user} />}
      </main>
    </div>
  );
}

function HomeTab({ name, resourceCount, testCount, avgScore }: { 
  name: string;
  resourceCount: number;
  testCount: number;
  avgScore: number;
}) {
  return (
    <div>
      <h1 className="font-mono text-3xl text-foreground">Welcome, {name}</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Manage your resources, practice tests, and class results.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 max-w-3xl">
        <Stat label="Resources Uploaded" value={String(resourceCount)} />
        <Stat label="Tests Conducted" value={String(testCount)} />
        <Stat label="Avg Class Score" value={`${avgScore}%`} />
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

function UploadTab({ user }: { user: AppUser }) {
  const files = useSyncExternalStore(fileStore.subscribe, fileStore.getFiles, fileStore.getFiles);
  const assignments = useStoreAsync(departmentStore.subscribe, departmentStore.getAssignments, []).filter(a => 
    a.facultyId === user.id || a.facultyId === user.username || a.facultyId === user.displayName
  );
  // Also include the generic subject if the faculty was given a legacy 'subject' field
  const assignedSubjects = Array.from(new Set([
    ...assignments.map(a => a.subject),
    user.subject
  ].filter(Boolean) as string[]));
  
  const subjectsToPick = assignedSubjects.length > 0 ? assignedSubjects : COURSES;

  const [course, setCourse] = useState(subjectsToPick[0] || "");
  const [modules, setModules] = useState<number[]>([1]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (subjectsToPick.length > 0 && !subjectsToPick.includes(course)) {
      setCourse(subjectsToPick[0]);
    }
  }, [subjectsToPick, course]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate network upload progress for better UX
    const duration = 1200;
    const intervalTime = 50;
    const steps = duration / intervalTime;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setUploadProgress(Math.min(Math.round((step / steps) * 100), 99));

      if (step >= steps) {
        clearInterval(timer);
        
        // Actually read and parse the file
        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            console.log("File loaded, starting to parse...");
            const data = new Uint8Array(evt.target?.result as ArrayBuffer);
            const wb = XLSX.read(data, { type: "array" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];

            const jsonData =
              XLSX.utils.sheet_to_json<Record<string, string | number | boolean | null>>(ws);
            console.log("Parsed JSON Data:", jsonData);

            let parsedRows;
            try {
              parsedRows = await mistralService.parseSpreadsheet(jsonData);
              console.log("Mistral extracted questions:", parsedRows);
            } catch (aiErr: any) {
              console.error("Mistral parsing failed:", aiErr);
              toast.error(`AI parsing failed: ${aiErr?.message || "Unknown error"}`);
              setIsUploading(false);
              return;
            }

            const newQuestions = parsedRows
              .flatMap((row) => {
                if (modules.length === 0) return [];

                return modules.map((mod) => ({
                  course: course,
                  subject: course,
                  module: mod,
                  question: row.question,
                  answer: row.answer,
                  keywords: row.keywords || [],
                }));
              })
              .filter((q) => q.question && q.answer);

            console.log("Extracted Questions:", newQuestions);

            if (newQuestions.length > 0) {
              const fileId = `${Date.now()}`;
              const { ok, error } = await questionStore.addQuestions(newQuestions, fileId);
              if (!ok) {
                console.error("Failed to add questions to DB:", error);
                toast.error(`Database error: ${error}`);
                setIsUploading(false);
                return;
              }
              toast.success(`✓ ${newQuestions.length} questions added to ${course} · Module(s) ${modules.join(", ")}`);
              fileStore.addFile({
                id: fileId,
                filename: file.name,
                course,
                module: modules.join(", ") || "All",
                date: new Date().toISOString().slice(0, 10),
              });
            } else {
              toast.error(
                "No valid questions found. Check column headers: question, answer, keywords.",
              );
            }
          } catch (err) {
            console.error("Error parsing file:", err);
            toast.error("Failed to parse file.");
          }

          setUploadProgress(100);
          setTimeout(() => {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }, 400);
        };
        reader.readAsArrayBuffer(file);
      }
    }, intervalTime);
  };

  const deleteFile = async (id: string) => {
    const target = files.find((f) => f.id === id);
    if (target) {
      await questionStore.removeByFileId(id);
    }
    fileStore.removeFile(id);
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
        <div className="flex-1 min-w-[240px]">
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
            Course (Search or Select)
          </label>
          <div className="relative">
            <input
              type="text"
              list="course-options"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="Search course..."
              className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary pr-8"
            />
            <datalist id="course-options">
              {subjectsToPick.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="min-w-[130px]">
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
            Modules
          </label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((m) => (
              <button
                key={m}
                onClick={() => setModules(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                className={`w-9 h-9 text-sm font-mono rounded border transition-colors ${
                  modules.includes(m)
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
      {isUploading ? (
        <div className="w-full max-w-3xl border-2 border-border rounded p-10 flex flex-col items-center justify-center bg-muted/20 mb-8">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <div className="text-foreground font-mono mb-2">
            Mistral AI is analyzing <span className="text-primary">{course}</span>...
          </div>
          <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-75 ease-linear" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-2 font-mono">
            {uploadProgress}%
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full max-w-3xl border-2 border-dashed border-border rounded p-10 text-center hover:border-primary transition-colors mb-8 cursor-pointer group bg-card"
        >
          <FileUp className="w-10 h-10 text-muted-foreground mx-auto mb-3 group-hover:text-primary transition-colors" />
          <div className="text-foreground font-mono">
            Upload for <span className="text-primary">{course || "Unselected"}</span> · Module{" "}
            <span className="text-primary">{modules.length > 0 ? modules.join(", ") : "None"}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Accepts .csv or .xlsx — columns: question, answer, keywords
          </div>
        </button>
      )}

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

function ConductTab({ user }: { user: AppUser }) {
  const storeQuestions = useStoreAsync(questionStore.subscribe, questionStore.getQuestions, []);
  
  const assignments = useStoreAsync(departmentStore.subscribe, departmentStore.getAssignments, []).filter(a => 
    a.facultyId === user.id || a.facultyId === user.username || a.facultyId === user.displayName
  );
  const assignedSubjects = Array.from(new Set([
    ...assignments.map(a => a.subject),
    user.subject
  ].filter(Boolean) as string[]));
  
  const subjectsToPick = assignedSubjects.length > 0 ? assignedSubjects : COURSES;
  
  const [subject, setSubject] = useState(subjectsToPick[0] || COURSES[0]);
  const [modules, setModules] = useState<Array<number | string>>([]);
  const [duration, setDuration] = useState(15);
  const [code, setCode] = useState<string | null>(null);
  const [createdConfig, setCreatedConfig] = useState<ReturnType<typeof practiceTestStore.createTest> | null>(null);

  const [source, setSource] = useState<"existing" | "upload">("existing");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (subjectsToPick.length > 0 && !subjectsToPick.includes(subject)) {
      setSubject(subjectsToPick[0]);
    }
  }, [subjectsToPick, subject]);

  const toggle = (m: number | string) =>
    setModules((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const subjectQuestions = storeQuestions.filter(q => (q.subject || "General") === subject);
  const availableModules = Array.from(new Set(subjectQuestions.map(q => q.module))).sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  });

  // Questions sourced from flashcards only
  const selectedModuleStrings = modules.map(String);
  const testQuestions = subjectQuestions.filter(q =>
    modules.length === 0 || selectedModuleStrings.includes(String(q.module))
  );

  const handleInlineUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string | number | boolean | null>>(ws);

        let parsedRows;
        try {
          parsedRows = await mistralService.parseSpreadsheet(jsonData);
        } catch (aiErr) {
          toast.error("Mistral parsing failed.");
          setIsUploading(false);
          return;
        }

        const newQuestions = parsedRows
          .flatMap((row) => {
            if (modules.length === 0) return [];
            return modules.map((mod) => ({
              course: subject,
              subject: subject,
              module: mod,
              question: row.question,
              answer: row.answer,
              keywords: row.keywords || [],
            }));
          })
          .filter((q) => q.question && q.answer);

        if (newQuestions.length > 0) {
          const fileId = `${Date.now()}`;
          await questionStore.addQuestions(newQuestions, fileId);
          fileStore.addFile({
            id: fileId, filename: file.name, course: subject,
            module: modules.join(", ") || "All", date: new Date().toISOString().slice(0, 10),
          });
          toast.success(`✓ ${newQuestions.length} questions uploaded. You can now launch the test!`);
          setSource("existing"); // Switch back so they can launch
        } else {
          toast.error("No valid questions found in file.");
        }
      } catch (err) {
        toast.error("Failed to parse file.");
      }
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsArrayBuffer(file);
  };

  const launch = async () => {
    if (testQuestions.length === 0) {
      toast.error("No questions available. Upload flashcards for this subject first.");
      return;
    }
    const result = await practiceTestStore.createTest({
      subject,
      modules: modules.length > 0 ? modules.map(String) : ["All"],
      duration,
      questions: testQuestions,
      createdBy: user.displayName,
    });
    
    if (result.ok && result.test) {
      setCode(result.test.code);
      setCreatedConfig(result.test as any);
      toast.success(`Practice test launched! Code: ${result.test.code}`);
    } else {
      toast.error(result.error || "Failed to launch practice test.");
    }
  };

  return (
    <div>
      <h1 className="font-mono text-3xl text-foreground">Conduct Practice Test</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Questions are sourced from uploaded flashcards. Students join with the generated code.
      </p>

      <div className="border border-border bg-card rounded p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
            Course
          </label>
          <select
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setModules([]); setCode(null); }}
            className="w-full bg-input border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
          >
            {subjectsToPick.length > 0 ? subjectsToPick.map((s) => (
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
              <div className="text-sm text-muted-foreground italic">No modules available — upload flashcards first</div>
            )}
          </div>
          {testQuestions.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              {testQuestions.length} questions from flashcards will be used
            </p>
          )}
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

        <div className="pt-2">
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Questions Source
          </label>
          <div className="flex gap-6 p-3 border border-border rounded-lg bg-muted/20">
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="radio" checked={source === "existing"} onChange={() => setSource("existing")} className="text-primary accent-primary" />
              Use Previously Uploaded
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="radio" checked={source === "upload"} onChange={() => setSource("upload")} className="text-primary accent-primary" />
              Upload New Sheet
            </label>
          </div>
        </div>

        {source === "upload" && (
          <div className="border border-dashed border-primary/50 bg-primary/5 rounded-lg p-6 text-center">
            <input type="file" accept=".csv,.xlsx" className="hidden" ref={fileInputRef} onChange={handleInlineUpload} />
            <FileUp className="w-8 h-8 text-primary/60 mx-auto mb-2" />
            <p className="text-sm text-foreground mb-3">Upload a fresh set of flashcards for this practice test.</p>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploading}
              className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {isUploading ? "Uploading & Parsing..." : "Select Excel/CSV File"}
            </button>
          </div>
        )}

        {source === "existing" && (
          <button
            onClick={launch}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded font-semibold hover:bg-primary/90"
          >
            Launch Practice Test
          </button>
        )}

        {code && createdConfig && (
          <div className="border border-primary bg-primary/10 rounded p-4 text-center space-y-1">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Join Code</div>
            <div className="font-mono text-3xl font-bold text-primary mt-2 tracking-widest">
              {code}
            </div>
            <div className="text-xs text-muted-foreground">
              Share with students • {createdConfig.questions.length} questions • {duration}min
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultsTab({ user }: { user: AppUser }) {
  const marks = useStoreAsync(marksStore.subscribe, marksStore.getAll, []);
  
  // Get faculty's assigned subjects
  const assignments = useStoreAsync(departmentStore.subscribe, departmentStore.getAssignments, []).filter(a => 
    a.facultyId === user.id || a.facultyId === user.username || a.facultyId === user.displayName
  );
  const assignedSubjects = Array.from(new Set([
    ...assignments.map(a => a.subject),
    user.subject
  ].filter(Boolean) as string[]));

  // Filter marks: must be "practice" and subject must match faculty's subjects
  const filtered = marks.filter(m => 
    m.testType === "practice" && 
    assignedSubjects.includes(m.subject) &&
    m.notes === "Joined via faculty code" // Only show joined tests as requested
  );

  return (
    <div>
      <h1 className="font-mono text-3xl text-foreground">Practice Test Results</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Live results from students who joined your practice tests via code.
      </p>
      <div className="border border-border bg-card rounded-xl overflow-hidden max-w-4xl">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground italic">
                  No joined practice results found yet.
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr key={r.id || i} className="border-t border-border hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{r.studentName}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{r.studentUsername}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">{r.subject}</td>
                  <td className="px-4 py-3 font-mono font-bold text-primary">{r.score}%</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{r.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
