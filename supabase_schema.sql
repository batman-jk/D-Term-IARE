-- ============================================================
-- D-Term-IARE Supabase Schema Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Users table (replaces userStore + generatedData faculty)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Faculty', 'Student')),
  display_name TEXT NOT NULL,
  department TEXT,
  sem TEXT,
  section TEXT,
  subject TEXT,
  first_login BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Questions table (replaces questionStore)
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  subject TEXT,
  course TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  file_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Course assignments (replaces departmentStore)
CREATE TABLE IF NOT EXISTS course_assignments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  department TEXT NOT NULL,
  semester TEXT NOT NULL,
  regulation TEXT NOT NULL,
  section TEXT NOT NULL,
  subject TEXT NOT NULL,
  faculty_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduled exams (replaces dtTestStore)
CREATE TABLE IF NOT EXISTS scheduled_exams (
  id TEXT PRIMARY KEY,
  department TEXT NOT NULL,
  semester TEXT NOT NULL,
  subject TEXT NOT NULL,
  module TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  duration INTEGER NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'
);

-- Exam history (replaces examHistoryStore)
CREATE TABLE IF NOT EXISTS exam_history (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('practice', 'dt')),
  course TEXT NOT NULL,
  started_at BIGINT NOT NULL,
  ended_at BIGINT NOT NULL,
  questions_total INTEGER NOT NULL,
  questions_attempted INTEGER NOT NULL,
  score NUMERIC NOT NULL,
  results JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Student marks (replaces marksStore)
CREATE TABLE IF NOT EXISTS student_marks (
  id TEXT PRIMARY KEY,
  student_username TEXT NOT NULL,
  student_name TEXT NOT NULL,
  department TEXT,
  sem TEXT,
  section TEXT,
  subject TEXT,
  test_type TEXT NOT NULL CHECK (test_type IN ('dt', 'practice', 'imported')),
  score NUMERIC NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Uploaded files metadata (replaces fileStore)
CREATE TABLE IF NOT EXISTS uploaded_files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  course TEXT NOT NULL,
  module TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Practice tests (replaces practiceTestStore)
CREATE TABLE IF NOT EXISTS practice_tests (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  modules TEXT[] DEFAULT '{}',
  duration INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  questions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true
);

-- ============================================================
-- Disable RLS for initial development (enable later with proper policies)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_tests ENABLE ROW LEVEL SECURITY;

-- Allow full access for anon role (open access for now)
CREATE POLICY "Allow all for anon" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON course_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON scheduled_exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON exam_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON student_marks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON uploaded_files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON practice_tests FOR ALL USING (true) WITH CHECK (true);
