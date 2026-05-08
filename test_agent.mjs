const API_KEY = "cmXwEjWtvw4VWMSlxcw6mbr0iUgxJ7FW";
const AGENT_ID = "ag_019e00e4d7187362945fe435678c971e";

const MISTRAL_URL = "https://api.mistral.ai/v1/agents/completions";

console.log("=== Test 1: Mistral Agent connectivity ===");

const PROMPT = `
You are an expert data extractor. I will provide you with a JSON array representing rows from an uploaded spreadsheet.
Your task is to identify which column represents the "Question" (or term/concept), which represents the "Answer" (or definition/explanation), and extract them.
If there is no "keywords" column, generate 3-5 relevant keywords based on the answer.

Return ONLY a valid JSON object with a single key "questions" containing an array.
Each object MUST have exactly three keys: "question", "answer", and "keywords" (an array of strings).

Here is the data:
[{"Term": "What is an OS?", "Definition": "An Operating System is software that manages hardware and software resources."}]
`;

async function test() {
  try {
    const res = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        agent_id: AGENT_ID,
        messages: [{ role: "user", content: PROMPT }],
        response_format: { type: "json_object" }
      })
    });

    console.log("Status:", res.status);
    const body = await res.json();
    
    if (res.ok) {
      const content = body.choices?.[0]?.message?.content;
      console.log("Raw content:", content);
      try {
        const parsed = JSON.parse(content);
        console.log("Parsed JSON:", JSON.stringify(parsed, null, 2));
        console.log("\n✅ Mistral Agent is working correctly!");
      } catch (e) {
        console.log("⚠️ Response is not valid JSON:", e.message);
      }
    } else {
      console.log("❌ Error:", JSON.stringify(body, null, 2));
    }
  } catch (e) {
    console.error("❌ Network error:", e.message);
  }
}

test();
