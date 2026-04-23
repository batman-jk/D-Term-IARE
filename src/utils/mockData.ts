export interface Question {
  id: string;
  module: number;
  question: string;
  answer: string;
  keywords: string[];
}

const BASE: Omit<Question, "id" | "module">[] = [
  {
    question: "What is a protocol?",
    answer: "A set of rules that govern data communication between devices",
    keywords: ["rules", "govern", "data", "communication", "devices"],
  },
  {
    question: "What is bandwidth?",
    answer: "The maximum rate of data transfer across a network path",
    keywords: ["maximum", "rate", "data", "transfer", "network"],
  },
  {
    question: "What is latency?",
    answer: "The time delay between sending and receiving data",
    keywords: ["time", "delay", "sending", "receiving", "data"],
  },
  {
    question: "What is a router?",
    answer: "A device that forwards data packets between computer networks",
    keywords: ["device", "forwards", "packets", "computer", "networks"],
  },
  {
    question: "What is DNS?",
    answer: "Domain Name System that translates domain names to IP addresses",
    keywords: ["domain", "name", "system", "translates", "IP", "addresses"],
  },
];

// Build 6 questions per module across 5 modules = 30 cards
export const QUESTIONS: Question[] = (() => {
  const out: Question[] = [];
  for (let m = 1; m <= 5; m++) {
    for (let i = 0; i < 6; i++) {
      const base = BASE[i % BASE.length];
      out.push({
        id: `m${m}-q${i + 1}`,
        module: m,
        question: base.question,
        answer: base.answer,
        keywords: base.keywords,
      });
    }
  }
  return out;
})();

export const SUBJECTS = ["Computer Networks", "DBMS", "OS"];

export const MOCK_USERS = [
  { id: 1, name: "Arjun Mehta", email: "arjun@college.edu", role: "Student" },
  { id: 2, name: "Priya Sharma", email: "priya@college.edu", role: "Student" },
  { id: 3, name: "Dr. Rao", email: "rao@college.edu", role: "Faculty" },
  { id: 4, name: "Dr. Iyer", email: "iyer@college.edu", role: "Faculty" },
  { id: 5, name: "Admin User", email: "admin@college.edu", role: "Admin" },
];

export const MOCK_RESOURCES = [
  { filename: "CN_Module1_Notes.pdf", subject: "Computer Networks", date: "2025-04-10" },
  { filename: "DBMS_Module2_Slides.pdf", subject: "DBMS", date: "2025-04-12" },
  { filename: "OS_Process_Mgmt.pdf", subject: "OS", date: "2025-04-15" },
];

export const MOCK_FACULTY_RESULTS = [
  { student: "Arjun Mehta", subject: "Computer Networks", score: 78, date: "2025-04-18" },
  { student: "Priya Sharma", subject: "Computer Networks", score: 85, date: "2025-04-18" },
  { student: "Rohan Das", subject: "DBMS", score: 64, date: "2025-04-19" },
];

export const MOCK_ALL_RESULTS = [
  { student: "Arjun Mehta", subject: "Computer Networks", dt: 82, practice: "78, 71", date: "2025-04-20" },
  { student: "Priya Sharma", subject: "Computer Networks", dt: 90, practice: "85, 88", date: "2025-04-20" },
  { student: "Rohan Das", subject: "DBMS", dt: 0, practice: "64", date: "2025-04-19" },
  { student: "Neha Verma", subject: "OS", dt: 75, practice: "70, 72", date: "2025-04-20" },
];