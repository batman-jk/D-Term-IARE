/**
 * mistralService.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Wrapper around the Mistral API for flashcard + notes generation.
 * Uses VITE_MISTRAL_API_KEY from environment variables.
 * Falls back gracefully when the key is not yet configured.
 */

export interface MistralFlashcard {
  id?: string;
  question: string;
  answer: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  keywords: string[];
}

export interface MistralNotes {
  overview: string;
  concepts: { term: string; definition: string; importance: string }[];
  explanations: { concept: string; explanation: string; example: string }[];
  definitions: { term: string; value: string }[];
  examQuestions: { q: string; a: string }[];
  summary: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────
const API_KEY = import.meta.env.VITE_MISTRAL_API_KEY as string | undefined;
const AGENT_ID = import.meta.env.VITE_MISTRAL_AGENT_ID as string | undefined;
const MISTRAL_URL = AGENT_ID
  ? "https://api.mistral.ai/v1/agents/completions"
  : "https://api.mistral.ai/v1/chat/completions";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// ── Cache (session) ───────────────────────────────────────────────────────
const flashcardCache = new Map<string, MistralFlashcard[]>();
const notesCache = new Map<string, MistralNotes>();

function cacheKey(subject: string, module: string) {
  return `${subject.toLowerCase()}::${module.toLowerCase()}`;
}

// ── Core fetch helper with retry ──────────────────────────────────────────
async function callMistral(prompt: string, attempt = 1): Promise<string> {
  if (!API_KEY) {
    throw new Error("VITE_MISTRAL_API_KEY is not configured. Add it to your .env.local file.");
  }

  try {
    const res = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        ...(AGENT_ID ? { agent_id: AGENT_ID } : { model: "mistral-small-latest", temperature: 0.7 }),
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        `Mistral API error ${res.status}: ${(err as { error?: { message?: string } }).error?.message ?? res.statusText}`
      );
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Empty response from Mistral");
    return text;
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
      return callMistral(prompt, attempt + 1);
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
Return ONLY a valid JSON object with a single key "flashcards" containing the array of flashcards. No markdown, no explanation.
Format: {"flashcards": [{"question":"...","answer":"...","difficulty":"EASY","keywords":["..."]}]}
`;

export async function generateFlashcards(
  subject: string,
  module: string,
  count = 50
): Promise<MistralFlashcard[]> {
  const key = `${cacheKey(subject, module)}::${count}`;
  const cached = flashcardCache.get(key);
  if (cached) return cached;

  const raw = await callMistral(FLASHCARD_PROMPT(subject, module, count));
  const parsedObj = safeParseJSON<{ flashcards?: MistralFlashcard[] }>(raw);
  const parsed = parsedObj.flashcards || [];

  if (!Array.isArray(parsed)) throw new Error("Mistral returned non-array for flashcards");

  // Normalise difficulty values
  const normalised = parsed.map((c, i) => ({
    ...c,
    difficulty: (["EASY", "MEDIUM", "HARD"].includes(c.difficulty)
      ? c.difficulty
      : "MEDIUM") as MistralFlashcard["difficulty"],
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
  "summary": ["bullet point 1", "bullet point 2"]
}

Requirements:
- concepts: 6-8 key concepts
- explanations: one per concept (include a real-world example)
- definitions: important technical terms (5-8)
- examQuestions: 5 likely exam questions with brief model answers
- summary: 10 key takeaways

Return ONLY a valid JSON object matching the exact structure requested.
`;

export async function generateNotes(
  subject: string,
  module: string
): Promise<MistralNotes> {
  const key = cacheKey(subject, module);
  const cached = notesCache.get(key);
  if (cached) return cached;

  // Try localStorage persistence so the user doesn't re-generate on page reload
  const lsKey = `dterm_notes::${key}`;
  try {
    const stored = localStorage.getItem(lsKey);
    if (stored) {
      const parsed = JSON.parse(stored) as MistralNotes;
      notesCache.set(key, parsed);
      return parsed;
    }
  } catch { /* ignore */ }

  const raw = await callMistral(NOTES_PROMPT(subject, module));
  const parsed = safeParseJSON<MistralNotes>(raw);

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

// ── Spreadsheet Parsing ───────────────────────────────────────────────────
export interface ParsedSpreadsheetRow {
  question: string;
  answer: string;
  keywords: string[];
}

const PARSE_SPREADSHEET_PROMPT = `
You are an expert data extractor. I will provide you with a JSON array representing rows from an uploaded spreadsheet (like Excel/CSV).
Your task is to identify which column represents the "Question" (or term/concept), which represents the "Answer" (or definition/explanation), and extract them.
If there is no "keywords" column, or if the keywords are empty, please automatically generate 3-5 relevant keywords based on the answer.

Return ONLY a valid JSON object with a single key "questions" containing an array.
Each object in the array MUST have exactly three keys: "question", "answer", and "keywords" (an array of strings).

Example output:
{
  "questions": [
    {
      "question": "What is an API?",
      "answer": "An Application Programming Interface allows two applications to talk to each other.",
      "keywords": ["API", "Application", "Interface"]
    }
  ]
}

Here is the data:
`;

export async function parseSpreadsheet(data: any[]): Promise<ParsedSpreadsheetRow[]> {
  // To avoid exceeding token limits, we stringify the array. If it's too huge, slice it?
  // We'll pass up to 150 rows.
  const sample = data.slice(0, 150);
  const prompt = PARSE_SPREADSHEET_PROMPT + JSON.stringify(sample);

  const raw = await callMistral(prompt);
  const parsedObj = safeParseJSON<{ questions?: ParsedSpreadsheetRow[] }>(raw);
  
  if (!parsedObj.questions || !Array.isArray(parsedObj.questions)) {
    throw new Error("Mistral failed to return an array of questions.");
  }
  
  return parsedObj.questions.filter(q => q.question && q.answer);
}

export const mistralService = { generateFlashcards, generateNotes, clearNotesCache, parseSpreadsheet };
