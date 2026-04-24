const API_KEY = "AIzaSyAfw_KA9sSQUU_Z6vfwAgP0uuqryA0eaHA";

export async function evaluateAnswer(student: string, correct: string): Promise<number> {
  if (!correct || correct.trim() === "") return 0;

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
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("Gemini API error:", response.status, response.statusText);
      return 0;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "0";
    const percentage = parseInt(text, 10);
    return isNaN(percentage) ? 0 : percentage;
  } catch (error) {
    console.error("Gemini API request failed:", error);
    return 0;
  }
}
