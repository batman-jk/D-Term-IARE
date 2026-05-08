import { supabase } from "@/lib/supabase";
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

// ── Helpers ───────────────────────────────────────────────────────────────
function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const mapConfig = (row: any): PracticeTestConfig => ({
  id: row.id,
  code: row.code,
  subject: row.subject,
  modules: typeof row.modules === "string" ? JSON.parse(row.modules) : row.modules,
  duration: row.duration,
  createdBy: row.created_by,
  createdAt: Number(row.created_at),
  questions: typeof row.questions === "string" ? JSON.parse(row.questions) : row.questions,
  isActive: row.is_active,
});

// ── State ─────────────────────────────────────────────────────────────────
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

  async getConfigs(): Promise<PracticeTestConfig[]> {
    const { data, error } = await supabase.from("practice_tests").select("*").order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map(mapConfig);
  },

  /** Faculty: create a new joinable practice test */
  async createTest(params: {
    subject: string;
    modules: string[];
    duration: number;
    questions: Question[];
    createdBy: string;
  }): Promise<{ ok: boolean; test?: PracticeTestConfig; error?: string }> {
    // Generate a code (ideally we would check collision against DB, but for now just generate)
    const code = generateCode();
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

    const { error } = await supabase.from("practice_tests").insert([{
      id: newConfig.id,
      code: newConfig.code,
      subject: newConfig.subject,
      modules: newConfig.modules,
      duration: newConfig.duration,
      created_by: newConfig.createdBy,
      created_at: new Date(newConfig.createdAt).toISOString(),
      questions: newConfig.questions,
      is_active: newConfig.isActive,
    }]);

    if (error) return { ok: false, error: error.message };

    emit();
    return { ok: true, test: newConfig };
  },

  /** Student: get an active practice test by join code */
  async getByCode(code: string): Promise<PracticeTestConfig | null> {
    const upper = code.trim().toUpperCase();
    const { data, error } = await supabase
      .from("practice_tests")
      .select("*")
      .eq("code", upper)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) return null;
    return mapConfig(data);
  },

  /** Faculty/Admin: deactivate a test */
  async setActive(id: string, active: boolean): Promise<void> {
    await supabase.from("practice_tests").update({ is_active: active }).eq("id", id);
    emit();
  },

  /** Faculty/Admin: delete a test */
  async deleteTest(id: string): Promise<void> {
    await supabase.from("practice_tests").delete().eq("id", id);
    emit();
  },
};
