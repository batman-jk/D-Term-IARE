import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { questionStore } from "@/utils/questionStore";
import { Home, Upload, FileText, Trophy, FileUp } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import {
  MOCK_RESOURCES,
  MOCK_FACULTY_RESULTS,
  SUBJECTS,
} from "@/utils/mockData";

const NAV = [
  { key: "home", label: "Home", icon: Home },
  { key: "upload", label: "Upload Resources", icon: Upload },
  { key: "conduct", label: "Conduct Practice Test", icon: FileText },
  { key: "results", label: "Results", icon: Trophy },
];

export function FacultyDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState("home");

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar
        items={NAV}
        active={tab}
        onSelect={setTab}
        role="Faculty"
        user="Dr. Rao"
        onLogout={onLogout}
      />
      <main className="flex-1 p-8 overflow-auto">
        {tab === "home" && <HomeTab />}
        {tab === "upload" && <UploadTab />}
        {tab === "conduct" && <ConductTab />}
        {tab === "results" && <ResultsTab />}
      </main>
    </div>
  );
}

function HomeTab() {
  return (
    <div>
      <h1 className="font-mono text-3xl text-foreground">Welcome, Dr. Rao</h1>
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
  const [files, setFiles] = useState(MOCK_RESOURCES);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        console.log("File loaded, starting to parse...");
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert to array of arrays first to make header case-insensitive
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
        console.log("Parsed JSON Data:", jsonData);
        
        const newQuestions = jsonData.map((row) => {
          // Normalize keys to lowercase for robust matching
          const normalizedRow: Record<string, any> = {};
          for (const key in row) {
            normalizedRow[key.toLowerCase().trim()] = row[key];
          }

          return {
            module: normalizedRow.module || normalizedRow.modulename || normalizedRow.module_name || 1,
            subject: normalizedRow.subject || wsname || 'Imported Data',
            question: normalizedRow.question || '',
            answer: normalizedRow.answer || '',
            keywords: typeof normalizedRow.keywords === 'string' 
              ? normalizedRow.keywords.split(',').map((k: string) => k.trim()) 
              : [],
          };
        }).filter(q => q.question && q.answer);

        console.log("Extracted Questions:", newQuestions);

        if (newQuestions.length > 0) {
          questionStore.addQuestions(newQuestions);
          toast.success(`Successfully extracted ${newQuestions.length} questions from ${file.name}!`);
          setFiles((prev) => [
            {
              filename: file.name,
              subject: "Imported Data",
              date: new Date().toISOString().slice(0, 10),
            },
            ...prev,
          ]);
        } else {
          console.warn("No valid questions found. Ensure columns are named 'module', 'question', 'answer', 'keywords'.");
          toast.error("No valid questions found in the file. Check column headers.");
        }
      } catch (err) {
        console.error("Error parsing file:", err);
        toast.error("Failed to parse file.");
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <h1 className="font-mono text-3xl text-foreground">Upload Resources</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Drop PDFs, slides, or questions (.csv, .xlsx) for your students.
      </p>

      <input 
        type="file" 
        accept=".csv, .xlsx" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full max-w-3xl border-2 border-dashed border-border rounded p-12 text-center hover:border-primary transition-colors mb-6 cursor-pointer"
      >
        <FileUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <div className="text-foreground font-mono">Click to upload Questions (.csv, .xlsx)</div>
        <div className="text-xs text-muted-foreground mt-1">Extracts questions automatically to student flashcards</div>
      </button>

      <div className="border border-border bg-card rounded overflow-hidden max-w-3xl">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Filename</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-4 py-3 font-mono">{f.filename}</td>
                <td className="px-4 py-3">{f.subject}</td>
                <td className="px-4 py-3 text-muted-foreground">{f.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConductTab() {
  const storeQuestions = questionStore.getQuestions();
  const subjects = Array.from(new Set(storeQuestions.map(q => q.subject || "General"))).filter(Boolean);
  
  const [subject, setSubject] = useState(subjects[0] || "General");
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
            Subject
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-input border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
          >
            {subjects.length > 0 ? subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            )) : (
              <option value="General">General</option>
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
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_FACULTY_RESULTS.map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-4 py-3">{r.student}</td>
                <td className="px-4 py-3">{r.subject}</td>
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