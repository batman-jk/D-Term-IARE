export interface Question {
  id: string;
  module: number | string;
  subject?: string;
  course?: string;
  question: string;
  answer: string;
  keywords: string[];
  fileId?: string;
}

const BASE: Omit<Question, "id" | "module">[] = [
  {
    course: "Computer Networks",
    subject: "Computer Networks",
    question: "What is a protocol?",
    answer: "A set of rules that govern data communication between devices",
    keywords: ["rules", "govern", "data", "communication", "devices"],
  },
  {
    course: "Computer Networks",
    subject: "Computer Networks",
    question: "What is bandwidth?",
    answer: "The maximum rate of data transfer across a network path",
    keywords: ["maximum", "rate", "data", "transfer", "network"],
  },
  {
    course: "DBMS",
    subject: "DBMS",
    question: "What is latency?",
    answer: "The time delay between sending and receiving data",
    keywords: ["time", "delay", "sending", "receiving", "data"],
  },
  {
    course: "DBMS",
    subject: "DBMS",
    question: "What is a router?",
    answer: "A device that forwards data packets between computer networks",
    keywords: ["device", "forwards", "packets", "computer", "networks"],
  },
  {
    course: "OS",
    subject: "OS",
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
        course: base.course,
        subject: base.subject,
        module: m,
        question: base.question,
        answer: base.answer,
        keywords: base.keywords,
      });
    }
  }
  return out;
})();

import { GENERATED_SUBJECTS } from "./generatedData";

export const SUBJECTS: string[] = GENERATED_SUBJECTS.length > 0 ? Array.from(new Set(GENERATED_SUBJECTS.map(s => s.name))) : [
  "Computer Networks",
  "DBMS",
  "OS",
  "Data Structures",
  "Software Engineering",
];

export const COURSES = SUBJECTS;

export const MOCK_USERS = [
  { id: 1, name: "Arjun Mehta", email: "arjun@college.edu", role: "Student" },
  { id: 2, name: "Priya Sharma", email: "priya@college.edu", role: "Student" },
  { id: 3, name: "Dr. Rao", email: "rao@college.edu", role: "Faculty" },
  { id: 4, name: "Dr. Iyer", email: "iyer@college.edu", role: "Faculty" },
  { id: 5, name: "Admin User", email: "admin@college.edu", role: "Admin" },
];

export const MOCK_RESOURCES = [
  { filename: "CN_Module1_Notes.pdf", course: "Computer Networks", module: 1, date: "2025-04-10" },
  { filename: "DBMS_Module2_Slides.pdf", course: "DBMS", module: 2, date: "2025-04-12" },
  { filename: "OS_Process_Mgmt.pdf", course: "OS", module: 3, date: "2025-04-15" },
];

export const MOCK_FACULTY_RESULTS = [
  { student: "Arjun Mehta", course: "Computer Networks", score: 78, date: "2025-04-18" },
  { student: "Priya Sharma", course: "Computer Networks", score: 85, date: "2025-04-18" },
  { student: "Rohan Das", course: "DBMS", score: 64, date: "2025-04-19" },
];

export const MOCK_ALL_RESULTS = [
  {
    student: "Arjun Mehta",
    course: "Computer Networks",
    dt: 82,
    practice: "78, 71",
    date: "2025-04-20",
  },
  {
    student: "Priya Sharma",
    course: "Computer Networks",
    dt: 90,
    practice: "85, 88",
    date: "2025-04-20",
  },
  { student: "Rohan Das", course: "DBMS", dt: 0, practice: "64", date: "2025-04-19" },
  { student: "Neha Verma", course: "OS", dt: 75, practice: "70, 72", date: "2025-04-20" },
];
