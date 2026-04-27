/**
 * marksStore.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Admin-only student marks registry.
 * Sources:
 *   1. Auto-recorded from exam results (examHistoryStore)
 *   2. Manually imported via Excel upload
 */

export interface StudentMark {
  id: string;
  studentUsername: string;
  studentName: string;
  department: string;
  sem: string;
  section: string;
  subject: string;
  testType: "dt" | "practice" | "imported";
  score: number;     // 0-100
  date: string;      // ISO date string "YYYY-MM-DD"
  notes?: string;
}

const STORAGE_KEY = "dterm_marks";

// ── Helpers ───────────────────────────────────────────────────────────────
function load(): StudentMark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StudentMark[]) : [];
  } catch {
    return [];
  }
}

function save(marks: StudentMark[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
  } catch { /* ignore */ }
}

// ── State ─────────────────────────────────────────────────────────────────
let marks: StudentMark[] = load();
let listeners: (() => void)[] = [];

function emit() {
  listeners.forEach((l) => l());
}

// ── Public API ────────────────────────────────────────────────────────────
export const marksStore = {
  subscribe(cb: () => void) {
    listeners.push(cb);
    return () => {
      listeners = listeners.filter((l) => l !== cb);
    };
  },

  /** Admin: get all marks across all students */
  getAll(): StudentMark[] {
    return marks;
  },

  /** Student: get marks for a specific username */
  getByStudent(username: string): StudentMark[] {
    return marks.filter(
      (m) => m.studentUsername.toLowerCase() === username.toLowerCase()
    );
  },

  /** Filter helpers for Admin */
  filter(opts: {
    department?: string;
    sem?: string;
    section?: string;
    subject?: string;
    testType?: StudentMark["testType"];
  }): StudentMark[] {
    return marks.filter((m) => {
      if (opts.department && m.department !== opts.department) return false;
      if (opts.sem && m.sem !== opts.sem) return false;
      if (opts.section && m.section !== opts.section) return false;
      if (opts.subject && m.subject !== opts.subject) return false;
      if (opts.testType && m.testType !== opts.testType) return false;
      return true;
    });
  },

  /** Add multiple marks (bulk import or single record) */
  addMarks(incoming: Omit<StudentMark, "id">[]): number {
    const newMarks: StudentMark[] = incoming.map((m, i) => ({
      ...m,
      id: `mark-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
    }));
    marks = [...marks, ...newMarks];
    save(marks);
    emit();
    return newMarks.length;
  },

  /** Add a single mark (used when a student completes an exam) */
  addMark(m: Omit<StudentMark, "id">): void {
    marks = [
      { ...m, id: `mark-${Date.now()}-${Math.floor(Math.random() * 1000)}` },
      ...marks,
    ];
    save(marks);
    emit();
  },

  /** Admin: delete a specific mark record */
  deleteMark(id: string): void {
    marks = marks.filter((m) => m.id !== id);
    save(marks);
    emit();
  },

  /** Admin: clear all imported marks */
  clearImported(): void {
    marks = marks.filter((m) => m.testType !== "imported");
    save(marks);
    emit();
  },

  /** Parse an Excel row into a StudentMark (used by Admin import UI) */
  parseRow(row: Record<string, unknown>): Omit<StudentMark, "id"> | null {
    const get = (keys: string[]): string => {
      for (const k of keys) {
        const v = row[k] ?? row[k.toLowerCase()] ?? row[k.toUpperCase()];
        if (v !== undefined && v !== null && v !== "") return String(v).trim();
      }
      return "";
    };

    const studentUsername = get(["studentUsername", "username", "rollno", "roll_no"]);
    const studentName = get(["studentName", "name", "student"]);
    const score = Number(get(["score", "marks", "Score", "Marks"]));

    if (!studentUsername || isNaN(score)) return null;

    return {
      studentUsername,
      studentName: studentName || studentUsername,
      department: get(["department", "dept", "Department"]),
      sem: get(["sem", "semester", "Sem", "Semester"]),
      section: get(["section", "sec", "Section"]),
      subject: get(["subject", "course", "Subject", "Course"]),
      testType: "imported",
      score: Math.min(100, Math.max(0, score)),
      date: get(["date", "Date"]) || new Date().toISOString().slice(0, 10),
    };
  },
};
