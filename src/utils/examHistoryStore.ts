export interface ExamRecord {
  id: string;
  type: "practice" | "dt";
  course: string;
  startedAt: number;   // Date.now()
  endedAt: number;
  questionsTotal: number;
  questionsAttempted: number;  // non-blank answers
  score: number;               // average match %
  results: { question: string; correct: string; given: string; match: number }[];
}

const KEY = "dterm_exam_history";

function load(): ExamRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ExamRecord[]) : [];
  } catch {
    return [];
  }
}

function save(records: ExamRecord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
  } catch { /* ignore */ }
}

let records: ExamRecord[] = load();
let listeners: (() => void)[] = [];

function emit() { listeners.forEach(l => l()); }

export const examHistory = {
  subscribe(cb: () => void) {
    listeners.push(cb);
    return () => { listeners = listeners.filter(l => l !== cb); };
  },
  getRecords() { return records; },

  addRecord(record: Omit<ExamRecord, "id">) {
    const newRecord: ExamRecord = { ...record, id: `exam-${Date.now()}` };
    records = [newRecord, ...records].slice(0, 100); // keep last 100
    save(records);
    emit();
  },

  clearAll() {
    records = [];
    save(records);
    emit();
  },
};
