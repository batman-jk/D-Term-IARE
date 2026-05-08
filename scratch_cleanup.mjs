import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wkpqudzsoxmmqdidnklv.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcHF1ZHpzb3htbXFkaWRua2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTk0NDIsImV4cCI6MjA5MjkzNTQ0Mn0.yTQB9WVvAckOgyL1o5Wa-ZMO9OnY8HSfxvlb9dnZcxs";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanup() {
  const { data, error } = await supabase.from('questions').delete().eq('subject', 'Sheet1');
  console.log("Cleanup:", data, error);
}

cleanup();
