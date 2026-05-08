import { supabase } from "@/lib/supabase";

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

let listeners: (() => void)[] = [];

function emit() { listeners.forEach(l => l()); }

const mapRecord = (row: any): ExamRecord => ({
  id: row.id,
  type: row.type as "practice" | "dt",
  course: row.course,
  startedAt: Number(row.started_at),
  endedAt: Number(row.ended_at),
  questionsTotal: row.questions_total,
  questionsAttempted: row.questions_attempted,
  score: row.score,
  results: typeof row.results === "string" ? JSON.parse(row.results) : row.results,
});

export const examHistory = {
  subscribe(cb: () => void) {
    listeners.push(cb);
    return () => { listeners = listeners.filter(l => l !== cb); };
  },

  async getRecords(studentId: string): Promise<ExamRecord[]> {
    const { data, error } = await supabase
      .from("exam_history")
      .select("*")
      .eq("user_id", studentId)
      .order("started_at", { ascending: false });

    if (error || !data) return [];
    return data.map(mapRecord);
  },

  async addRecord(studentId: string, record: Omit<ExamRecord, "id">): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.from("exam_history").insert([{
      id: crypto.randomUUID(),
      user_id: studentId,
      type: record.type,
      course: record.course,
      started_at: record.startedAt,
      ended_at: record.endedAt,
      questions_total: record.questionsTotal,
      questions_attempted: record.questionsAttempted,
      score: record.score,
      results: record.results,
    }]);

    if (error) return { ok: false, error: error.message };
    
    emit();
    return { ok: true };
  },

  async clearAll(studentId: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.from("exam_history").delete().eq("user_id", studentId);
    if (error) return { ok: false, error: error.message };
    
    emit();
    return { ok: true };
  },
};
