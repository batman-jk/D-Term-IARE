/**
 * dtTestStore.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Admin-managed DT Scheduled Exams.
 * Admin schedules an exam for a specific Department, Semester, and Subject
 * with a strict Start and End time.
 */

import type { Question } from "@/utils/mockData";

export interface ScheduledExam {
  id: string;
  department: string;
  semester: string;
  subject: string;
  module: string;       // "All" or a specific module
  startTime: string;    // ISO string
  endTime: string;      // ISO string
  createdBy: string;    // admin displayName
  createdAt: number;    // Date.now()
  questions: Question[];
  duration: number;     // minutes
}

const STORAGE_KEY = "dterm_dt_tests_scheduled";

// ── Helpers ───────────────────────────────────────────────────────────────

function load(): ScheduledExam[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ScheduledExam[]) : [];
  } catch {
    return [];
  }
}

function save(tests: ScheduledExam[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
  } catch { /* ignore */ }
}

// ── State ─────────────────────────────────────────────────────────────────
let tests: ScheduledExam[] = load();
let listeners: (() => void)[] = [];

function emit() {
  listeners.forEach((l) => l());
}

// ── Public API ────────────────────────────────────────────────────────────
export const dtTestStore = {
  subscribe(cb: () => void) {
    listeners.push(cb);
    return () => {
      listeners = listeners.filter((l) => l !== cb);
    };
  },

  getTests(): ScheduledExam[] {
    return tests;
  },

  getActiveTestsForStudent(department: string, semester: string): ScheduledExam[] {
    const now = new Date();
    return tests.filter(t => 
      t.department === department && 
      t.semester === semester && 
      new Date(t.startTime) <= now && 
      new Date(t.endTime) >= now
    );
  },

  createTest(params: {
    department: string;
    semester: string;
    subject: string;
    module: string;
    startTime: string;
    endTime: string;
    duration: number;
    questions: Question[];
    createdBy: string;
  }): ScheduledExam {
    const newTest: ScheduledExam = {
      id: `dt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...params,
      createdAt: Date.now(),
    };

    tests = [newTest, ...tests];
    save(tests);
    emit();
    return newTest;
  },

  deleteTest(id: string): void {
    tests = tests.filter((t) => t.id !== id);
    save(tests);
    emit();
  },
};
