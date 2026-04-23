const STOP_WORDS = new Set([
  "a","an","the","is","are","was","were","be","been","being",
  "have","has","had","do","does","did","will","would","could",
  "should","may","might","shall","can","need","dare","ought",
  "used","for","of","to","in","on","at","by","from","with",
  "about","called","known","referred",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w));
}

export function evaluateAnswer(student: string, correct: string): number {
  const studentTokens = new Set(tokenize(student));
  const correctTokens = tokenize(correct);
  if (correctTokens.length === 0) return 0;
  const matched = correctTokens.filter((w) => studentTokens.has(w)).length;
  return Math.round((matched / correctTokens.length) * 100);
}