/**
 * practiceTestStore.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Faculty-created practice test registry.
 * Faculty creates a test (selects subject + module from uploaded flashcards),
 * gets a join code, and students can use that code to take the exact test.
 */

import type { Question } from "@/utils/mockData";

export interface PracticeTestConfig {
  id: string;
  code: string;         // 6-char uppercase join code
  subject: string;
  modules: string[];    // one or more module numbers/names
  duration: number;     // minutes
  createdBy: string;    // faculty displayName
  createdAt: number;
  questions: Question[];
  isActive: boolean;
}

const STORAGE_KEY = "dterm_practice_tests";

// ── Helpers ───────────────────────────────────────────────────────────────
function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function load(): PracticeTestConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PracticeTestConfig[]) : [];
  } catch {
    return [];
  }
}

function save(configs: PracticeTestConfig[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  } catch { /* ignore */ }
}

// ── State ─────────────────────────────────────────────────────────────────
let configs: PracticeTestConfig[] = load();
let listeners: (() => void)[] = [];

function emit() {
  listeners.forEach((l) => l());
}

// ── Public API ────────────────────────────────────────────────────────────
export const practiceTestStore = {
  subscribe(cb: () => void) {
    listeners.push(cb);
    return () => {
      listeners = listeners.filter((l) => l !== cb);
    };
  },

  getConfigs(): PracticeTestConfig[] {
    return configs;
  },

  /** Faculty: create a new joinable practice test */
  createTest(params: {
    subject: string;
    modules: string[];
    duration: number;
    questions: Question[];
    createdBy: string;
  }): PracticeTestConfig {
    let code = generateCode();
    while (configs.some((c) => c.code === code)) {
      code = generateCode();
    }

    const newConfig: PracticeTestConfig = {
      id: `pt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      code,
      subject: params.subject,
      modules: params.modules,
      duration: params.duration,
      createdBy: params.createdBy,
      createdAt: Date.now(),
      questions: params.questions,
      isActive: true,
    };

    configs = [newConfig, ...configs];
    save(configs);
    emit();
    return newConfig;
  },

  /** Student: get an active practice test by join code */
  getByCode(code: string): PracticeTestConfig | null {
    const upper = code.trim().toUpperCase();
    return configs.find((c) => c.code === upper && c.isActive) ?? null;
  },

  /** Faculty/Admin: deactivate a test */
  setActive(id: string, active: boolean): void {
    configs = configs.map((c) => (c.id === id ? { ...c, isActive: active } : c));
    save(configs);
    emit();
  },

  /** Faculty/Admin: delete a test */
  deleteTest(id: string): void {
    configs = configs.filter((c) => c.id !== id);
    save(configs);
    emit();
  },
};
