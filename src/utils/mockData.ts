export interface Question {
  id: string;
  module: number | string;
  subject?: string;
  question: string;
  answer: string;
  keywords: string[];
}

export const QUESTIONS: Question[] = [];

export const SUBJECTS: string[] = []; // Removed mock subjects

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