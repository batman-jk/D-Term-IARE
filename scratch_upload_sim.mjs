import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import fs from "fs";

const SUPABASE_URL = "https://wkpqudzsoxmmqdidnklv.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcHF1ZHpzb3htbXFkaWRua2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTk0NDIsImV4cCI6MjA5MjkzNTQ0Mn0.yTQB9WVvAckOgyL1o5Wa-ZMO9OnY8HSfxvlb9dnZcxs";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const questionStore = {
  async addQuestions(newQuestions, fileId) {
    const questionsToAdd = newQuestions.map((q) => ({
      id: `m${q.module}-q${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      module: String(q.module),
      subject: q.subject || null,
      course: q.course || null,
      question: q.question,
      answer: q.answer,
      keywords: q.keywords || [],
      file_id: fileId || null,
    }));

    console.log("Questions to add to supabase: ", JSON.stringify(questionsToAdd, null, 2));

    const { data, error } = await supabase.from("questions").insert(questionsToAdd).select();
    if (error) {
       console.error("Supabase Error:", error);
       return { ok: false, error: error.message };
    }
    return { ok: true, data };
  }
};

async function testUpload() {
  // Create a mock excel file
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([
    { question: "What is testing?", answer: "Testing is good", keywords: "test, good" }
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const wbRead = XLSX.read(buf, { type: "buffer" });
  const wsname = wbRead.SheetNames[0];
  const wsRead = wbRead.Sheets[wsname];

  const jsonData = XLSX.utils.sheet_to_json(wsRead);
  
  const course = "Software Engineering";
  const modules = [1];

  const newQuestions = jsonData
    .flatMap((row) => {
      const normalizedRow = {};
      for (const key in row) {
        normalizedRow[key.toLowerCase().trim()] = row[key];
      }
      
      const rawModule =
        normalizedRow.module ??
        normalizedRow.modulename ??
        normalizedRow.module_name;

      const targetModules = (rawModule !== null && rawModule !== undefined && typeof rawModule !== "boolean")
        ? [rawModule]
        : modules;

      if (targetModules.length === 0) return [];

      return targetModules.map((mod) => ({
        course: String(normalizedRow.course || normalizedRow.subject || wsname || course),
        subject: String(normalizedRow.subject || normalizedRow.course || wsname || course),
        module: mod,
        question: String(normalizedRow.question ?? ""),
        answer: String(normalizedRow.answer ?? ""),
        keywords:
          typeof normalizedRow.keywords === "string"
            ? normalizedRow.keywords.split(",").map((k) => k.trim())
            : [],
      }));
    })
    .filter((q) => q.question && q.answer);
    
    console.log("Parsed new questions:", newQuestions);
    await questionStore.addQuestions(newQuestions, "test-file");
}

testUpload();
