// ── evaluate.ts ─────────────────────────────────────────────────────────────
const API_KEY = import.meta.env.VITE_MISTRAL_API_KEY as string | undefined;

export async function evaluateAnswer(student: string, correct: string): Promise<number> {
  if (!correct || correct.trim() === "") return 0;
  if (!API_KEY) {
    console.error("VITE_MISTRAL_API_KEY is not configured. Add it to your .env.local file.");
    return 0;
  }

  const prompt = `
You are an expert examiner. Evaluate the student's answer against the correct answer.
Correct Answer (keywords given by admin): "${correct}"
Student Answer: "${student}"

Rules:
1. Do not include stop words like for, how, from, in, is, and, called, known, as, what, a, where, which, that, so, etc.
2. It should only match and show percentage when the key words given in the correct answer are present.
3. The keywords should match exactly. If a keyword is not present, it counts as a mismatch.
4. If there is no match at all, return 0.
5. Calculate the percentage of non-stop-word keywords from the correct answer that exactly appear in the student's answer.

Output ONLY a single integer representing the percentage (0 to 100). Do not output any other text or characters.
`;

  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      }),
    });

    if (!response.ok) {
      console.error("Mistral API error:", response.status, response.statusText);
      return 0;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "0";
    const percentage = parseInt(text, 10);
    return isNaN(percentage) ? 0 : percentage;
  } catch (error) {
    console.error("Mistral API request failed:", error);
    return 0;
  }
}
