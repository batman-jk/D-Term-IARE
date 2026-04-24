import { Question, QUESTIONS as INITIAL_QUESTIONS } from "./mockData";

let questions = [...INITIAL_QUESTIONS];
let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

// Load from local storage on initial load
try {
  const stored = localStorage.getItem("dterm_questions");
  if (stored) {
    questions = JSON.parse(stored);
  } else {
    // Save initial to local storage if not present
    localStorage.setItem("dterm_questions", JSON.stringify(questions));
  }
} catch (e) {
  console.error("Failed to load questions from local storage", e);
}

export const questionStore = {
  addQuestions(newQuestions: Omit<Question, "id">[]) {
    const questionsToAdd = newQuestions.map((q) => ({
      ...q,
      id: `m${q.module}-q${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    }));
    
    questions = [...questions, ...questionsToAdd];
    
    try {
      localStorage.setItem("dterm_questions", JSON.stringify(questions));
    } catch (e) {
      console.error("Failed to save questions to local storage", e);
    }
    
    emitChange();
  },

  getQuestions() {
    return questions;
  },

  subscribe(listener: () => void) {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};
