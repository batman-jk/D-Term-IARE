import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wkpqudzsoxmmqdidnklv.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcHF1ZHpzb3htbXFkaWRua2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTk0NDIsImV4cCI6MjA5MjkzNTQ0Mn0.yTQB9WVvAckOgyL1o5Wa-ZMO9OnY8HSfxvlb9dnZcxs";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('questions').insert([
    {
      id: `m1-q${Date.now()}-123`,
      module: "1",
      subject: "Test Subject",
      course: "Test Course",
      question: "What is testing?",
      answer: "Testing is good.",
      keywords: ["test", "good"],
      file_id: "test-file-123"
    }
  ]).select();
  console.log("With ID:", data, error);
  
  if (error) {
    const { data: data2, error: error2 } = await supabase.from('questions').insert([
      {
        module: "1",
        subject: "Test Subject",
        course: "Test Course",
        question: "What is testing?",
        answer: "Testing is good.",
        keywords: ["test", "good"],
        file_id: "test-file-123"
      }
    ]).select();
    console.log("Without ID:", data2, error2);
  }
}

test();
