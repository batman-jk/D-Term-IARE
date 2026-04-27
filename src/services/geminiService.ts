/**
 * geminiService.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Wrapper around the Gemini API for flashcard + notes generation.
 * Uses VITE_GEMINI_API_KEY from environment variables.
 * Falls back gracefully when the key is not yet configured.
 */

export interface GeminiFlashcard {
  id?: string;
  question: string;
  answer: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  keywords: string[];
}

export interface GeminiNotes {
  overview: string;
  concepts: { term: string; definition: string; importance: string }[];
  explanations: { concept: string; explanation: string; example: string }[];
  definitions: { term: string; value: string }[];
  examQuestions: { q: string; a: string }[];
  summary: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// ── Cache (session) ───────────────────────────────────────────────────────
const flashcardCache = new Map<string, GeminiFlashcard[]>();
const notesCache = new Map<string, GeminiNotes>();

function cacheKey(subject: string, module: string) {
  return `${subject.toLowerCase()}::${module.toLowerCase()}`;
}

// ── Core fetch helper with retry ──────────────────────────────────────────
async function callGemini(prompt: string, attempt = 1): Promise<string> {
  if (!API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY is not configured. Add it to your .env file.");
  }

  try {
    const res = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        `Gemini API error ${res.status}: ${(err as { error?: { message?: string } }).error?.message ?? res.statusText}`
      );
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) throw new Error("Empty response from Gemini");
    return text;
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
      return callGemini(prompt, attempt + 1);
    }
    throw err;
  }
}

function safeParseJSON<T>(raw: string): T {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(cleaned) as T;
}

// ── Flashcard Generation ──────────────────────────────────────────────────
const FLASHCARD_PROMPT = (subject: string, mod: string, count: number) => `
You are an academic flashcard generator for engineering college students.
Generate exactly ${count} flashcards for the subject "${subject}", Module ${mod}.

Each flashcard must have:
- "question": a clear definition-style question (max 20 words)
- "answer": a precise, concise answer (max 40 words)
- "difficulty": one of "EASY", "MEDIUM", or "HARD"
- "keywords": array of 3-5 key terms from the answer

Distribute difficulty approximately: 40% EASY, 40% MEDIUM, 20% HARD.
Cover different sub-topics within the module — avoid duplicates.
Return ONLY a valid JSON array. No markdown, no explanation, no extra keys.
Format: [{"question":"...","answer":"...","difficulty":"EASY","keywords":["..."]}]
`;

export async function generateFlashcards(
  subject: string,
  module: string,
  count = 50
): Promise<GeminiFlashcard[]> {
  const key = `${cacheKey(subject, module)}::${count}`;
  const cached = flashcardCache.get(key);
  if (cached) return cached;

  const raw = await callGemini(FLASHCARD_PROMPT(subject, module, count));
  const parsed = safeParseJSON<GeminiFlashcard[]>(raw);

  if (!Array.isArray(parsed)) throw new Error("Gemini returned non-array for flashcards");

  // Normalise difficulty values
  const normalised = parsed.map((c, i) => ({
    ...c,
    difficulty: (["EASY", "MEDIUM", "HARD"].includes(c.difficulty)
      ? c.difficulty
      : "MEDIUM") as GeminiFlashcard["difficulty"],
    keywords: Array.isArray(c.keywords) ? c.keywords : [],
    question: c.question ?? "",
    answer: c.answer ?? "",
    // Assign a stable id so FlashcardGrid can use it as key
    id: `ai-${subject}-${module}-${i}`,
  }));

  flashcardCache.set(key, normalised);
  return normalised;
}

// ── Notes Generation ──────────────────────────────────────────────────────
const NOTES_PROMPT = (subject: string, mod: string) => `
You are a senior lecturer creating structured teaching notes for engineering college students.
Generate comprehensive lecture notes for the subject "${subject}", Module ${mod}.

Structure the notes with these exact JSON keys:
{
  "overview": "2-3 sentence module overview",
  "concepts": [{"term":"","definition":"","importance":""}],
  "explanations": [{"concept":"","explanation":"","example":""}],
  "definitions": [{"term":"","value":""}],
  "examQuestions": [{"q":"","a":""}],
  "summary": ["bullet point 1", "bullet point 2", ...]
}

Requirements:
- concepts: 6-8 key concepts
- explanations: one per concept (include a real-world example)
- definitions: important technical terms (5-8)
- examQuestions: 5 likely exam questions with brief model answers
- summary: 10 key takeaways

Return ONLY valid JSON — no markdown fences, no extra text.
`;

export async function generateNotes(
  subject: string,
  module: string
): Promise<GeminiNotes> {
  const key = cacheKey(subject, module);
  const cached = notesCache.get(key);
  if (cached) return cached;

  // Try localStorage persistence so the user doesn't re-generate on page reload
  const lsKey = `dterm_notes::${key}`;
  try {
    const stored = localStorage.getItem(lsKey);
    if (stored) {
      const parsed = JSON.parse(stored) as GeminiNotes;
      notesCache.set(key, parsed);
      return parsed;
    }
  } catch { /* ignore */ }

  const raw = await callGemini(NOTES_PROMPT(subject, module));
  const parsed = safeParseJSON<GeminiNotes>(raw);

  // Store to localStorage for future sessions
  try {
    localStorage.setItem(lsKey, JSON.stringify(parsed));
  } catch { /* ignore */ }

  notesCache.set(key, parsed);
  return parsed;
}

export function clearNotesCache(subject: string, module: string) {
  const key = cacheKey(subject, module);
  notesCache.delete(key);
  try {
    localStorage.removeItem(`dterm_notes::${key}`);
  } catch { /* ignore */ }
}

export const geminiService = { generateFlashcards, generateNotes, clearNotesCache };
