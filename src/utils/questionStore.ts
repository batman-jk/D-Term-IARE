import { supabase } from "../lib/supabase";
import { Question } from "./mockData";

let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

// Map from Supabase row to Question
const mapQuestion = (row: any): Question => ({
  id: row.id,
  course: row.course || undefined,
  subject: row.subject || undefined,
  module: row.module,
  question: row.question,
  answer: row.answer,
  keywords: row.keywords || [],
  fileId: row.file_id || undefined,
});

export const questionStore = {
  async addQuestions(newQuestions: Omit<Question, "id" | "fileId">[], fileId?: string): Promise<{ ok: boolean; error?: string }> {
    const questionsToAdd = newQuestions.map((q) => {
      // Ensure keywords is always a proper array of short, clean strings
      let safeKeywords: string[] = [];
      if (Array.isArray(q.keywords)) {
        safeKeywords = q.keywords
          .filter((k): k is string => typeof k === "string" && k.length < 100)
          .map(k => k.trim())
          .filter(Boolean);
      } else if (typeof q.keywords === "string") {
        // If Mistral returned a single string, split by commas
        safeKeywords = (q.keywords as string).split(",").map(k => k.trim()).filter(k => k.length > 0 && k.length < 100);
      }

      return {
        id: crypto.randomUUID(),
        module: String(q.module),
        subject: q.subject || null,
        course: q.course || null,
        question: q.question,
        answer: q.answer,
        keywords: safeKeywords,
        file_id: fileId || null,
      };
    });

    const { error } = await supabase.from("questions").insert(questionsToAdd);
    if (error) return { ok: false, error: error.message };
    
    emitChange();
    return { ok: true };
  },

  /** Remove all questions belonging to a specific file */
  async removeByFileId(fileId: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.from("questions").delete().eq("file_id", fileId);
    if (error) return { ok: false, error: error.message };
    
    emitChange();
    return { ok: true };
  },

  async getQuestions(): Promise<Question[]> {
    const { data, error } = await supabase.from("questions").select("*");
    if (error || !data) return [];
    return data.map(mapQuestion);
  },

  subscribe(listener: () => void) {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};
