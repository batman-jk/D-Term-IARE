import { supabase } from "@/lib/supabase";
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

const mapExam = (row: any): ScheduledExam => ({
  id: row.id,
  department: row.department,
  semester: row.semester,
  subject: row.subject,
  module: row.module,
  startTime: row.start_time,
  endTime: row.end_time,
  createdBy: row.created_by,
  createdAt: new Date(row.created_at).getTime(),
  questions: typeof row.questions === "string" ? JSON.parse(row.questions) : row.questions,
  duration: row.duration,
});

let listeners: (() => void)[] = [];

function emit() {
  listeners.forEach((l) => l());
}

export const dtTestStore = {
  subscribe(cb: () => void) {
    listeners.push(cb);
    return () => {
      listeners = listeners.filter((l) => l !== cb);
    };
  },

  async getTests(): Promise<ScheduledExam[]> {
    const { data, error } = await supabase.from("scheduled_exams").select("*");
    if (error || !data) return [];
    return data.map(mapExam);
  },

  async getActiveTestsForStudent(department: string, semester: string): Promise<ScheduledExam[]> {
    const { data, error } = await supabase
      .from("scheduled_exams")
      .select("*")
      .eq("department", department)
      .eq("semester", semester);
    
    if (error || !data) return [];
    
    const now = new Date();
    return data.map(mapExam).filter(t => 
      new Date(t.startTime) <= now && 
      new Date(t.endTime) >= now
    );
  },

  async createTest(params: {
    department: string;
    semester: string;
    subject: string;
    module: string;
    startTime: string;
    endTime: string;
    duration: number;
    questions: Question[];
    createdBy: string;
  }): Promise<{ ok: boolean; test?: ScheduledExam; error?: string }> {
    const newTestId = `dt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const { error } = await supabase.from("scheduled_exams").insert([{
      id: newTestId,
      department: params.department,
      semester: params.semester,
      subject: params.subject,
      module: params.module,
      start_time: params.startTime,
      end_time: params.endTime,
      duration: params.duration,
      questions: params.questions,
      created_by: params.createdBy,
    }]);

    if (error) return { ok: false, error: error.message };
    
    emit();
    return { ok: true, test: { ...params, id: newTestId, createdAt: Date.now() } };
  },

  async deleteTest(id: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.from("scheduled_exams").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    emit();
    return { ok: true };
  },
};
