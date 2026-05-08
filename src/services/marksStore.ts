import { supabase } from "@/lib/supabase";

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

let listeners: (() => void)[] = [];

function emit() {
  listeners.forEach((l) => l());
}

const mapMark = (row: any): StudentMark => ({
  id: row.id,
  studentUsername: row.student_username,
  studentName: row.student_name,
  department: row.department || "",
  sem: row.sem || "",
  section: row.section || "",
  subject: row.subject || "",
  testType: row.test_type as "dt" | "practice" | "imported",
  score: Number(row.score),
  date: row.date,
  notes: row.notes || undefined,
});

export const marksStore = {
  subscribe(cb: () => void) {
    listeners.push(cb);
    return () => {
      listeners = listeners.filter((l) => l !== cb);
    };
  },

  async getAll(): Promise<StudentMark[]> {
    const { data, error } = await supabase.from("student_marks").select("*");
    if (error || !data) return [];
    return data.map(mapMark);
  },

  async getByStudent(username: string): Promise<StudentMark[]> {
    const { data, error } = await supabase
      .from("student_marks")
      .select("*")
      .ilike("student_username", username);
    
    if (error || !data) return [];
    return data.map(mapMark);
  },

  async filter(opts: {
    department?: string;
    sem?: string;
    section?: string;
    subject?: string;
    testType?: StudentMark["testType"];
  }): Promise<StudentMark[]> {
    let query = supabase.from("student_marks").select("*");
    
    if (opts.department) query = query.eq("department", opts.department);
    if (opts.sem) query = query.eq("sem", opts.sem);
    if (opts.section) query = query.eq("section", opts.section);
    if (opts.subject) query = query.eq("subject", opts.subject);
    if (opts.testType) query = query.eq("test_type", opts.testType);

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(mapMark);
  },

  async addMarks(incoming: Omit<StudentMark, "id">[]): Promise<number> {
    const newMarks = incoming.map((m, i) => ({
      id: `mark-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
      student_username: m.studentUsername,
      student_name: m.studentName,
      department: m.department,
      sem: m.sem,
      section: m.section,
      subject: m.subject,
      test_type: m.testType,
      score: m.score,
      date: m.date,
      notes: m.notes || null,
    }));

    const { error } = await supabase.from("student_marks").insert(newMarks);
    if (error) return 0;
    
    emit();
    return newMarks.length;
  },

  async addMark(m: Omit<StudentMark, "id">): Promise<{ ok: boolean; error?: string }> {
    const newMarkId = `mark-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const { error } = await supabase.from("student_marks").insert([{
      id: newMarkId,
      student_username: m.studentUsername,
      student_name: m.studentName,
      department: m.department,
      sem: m.sem,
      section: m.section,
      subject: m.subject,
      test_type: m.testType,
      score: m.score,
      date: m.date,
      notes: m.notes || null,
    }]);

    if (error) return { ok: false, error: error.message };
    emit();
    return { ok: true };
  },

  async deleteMark(id: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.from("student_marks").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    emit();
    return { ok: true };
  },

  async clearImported(): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.from("student_marks").delete().eq("test_type", "imported");
    if (error) return { ok: false, error: error.message };
    emit();
    return { ok: true };
  },

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
