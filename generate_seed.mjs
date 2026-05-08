// Generates supabase_seed.sql from generatedData.ts
// Run: node generate_seed.mjs

import fs from 'fs';

// Read the generatedData.ts file
const content = fs.readFileSync('./src/utils/generatedData.ts', 'utf8');

// Extract GENERATED_FACULTY array
const facultyMatch = content.match(/export const GENERATED_FACULTY = \[([\s\S]*?)\];/);
if (!facultyMatch) { console.error('Could not find GENERATED_FACULTY'); process.exit(1); }

// Parse the faculty JSON (it's valid JSON inside the array)
const facultyJson = JSON.parse(`[${facultyMatch[1]}]`);

// Build SQL
let sql = `-- ============================================================\n`;
sql += `-- D-Term-IARE Seed Data\n`;
sql += `-- Run this AFTER supabase_schema.sql\n`;
sql += `-- ============================================================\n\n`;

// Admin user
sql += `-- Root admin\n`;
sql += `INSERT INTO users (id, username, password, role, display_name, first_login) VALUES\n`;
sql += `  ('admin-root', 'D-TERM-IARE', 'defter', 'Admin', 'D-Term Admin', false)\n`;
sql += `ON CONFLICT (id) DO NOTHING;\n\n`;

// Faculty users in batches of 50
sql += `-- Faculty users (${facultyJson.length} total)\n`;
const batchSize = 50;
for (let i = 0; i < facultyJson.length; i += batchSize) {
  const batch = facultyJson.slice(i, i + batchSize);
  sql += `INSERT INTO users (id, username, password, role, display_name, department, first_login) VALUES\n`;
  const rows = batch.map(f => {
    const id = f.id.replace(/'/g, "''");
    const username = f.username.replace(/'/g, "''");
    const password = f.password.replace(/'/g, "''");
    const displayName = f.displayName.replace(/'/g, "''");
    const dept = (f.department || '').replace(/'/g, "''");
    return `  ('${id}', '${username}', '${password}', 'Faculty', '${displayName}', '${dept}', true)`;
  });
  sql += rows.join(',\n');
  sql += `\nON CONFLICT (id) DO NOTHING;\n\n`;
}

// Default questions from mockData
sql += `-- Default seed questions\n`;
sql += `INSERT INTO questions (id, module, subject, course, question, answer, keywords) VALUES\n`;
const questions = [];
const BASE = [
  { course: 'Computer Networks', subject: 'Computer Networks', question: 'What is a protocol?', answer: 'A set of rules that govern data communication between devices', keywords: ['rules', 'govern', 'data', 'communication', 'devices'] },
  { course: 'Computer Networks', subject: 'Computer Networks', question: 'What is bandwidth?', answer: 'The maximum rate of data transfer across a network path', keywords: ['maximum', 'rate', 'data', 'transfer', 'network'] },
  { course: 'DBMS', subject: 'DBMS', question: 'What is latency?', answer: 'The time delay between sending and receiving data', keywords: ['time', 'delay', 'sending', 'receiving', 'data'] },
  { course: 'DBMS', subject: 'DBMS', question: 'What is a router?', answer: 'A device that forwards data packets between computer networks', keywords: ['device', 'forwards', 'packets', 'computer', 'networks'] },
  { course: 'OS', subject: 'OS', question: 'What is DNS?', answer: 'Domain Name System that translates domain names to IP addresses', keywords: ['domain', 'name', 'system', 'translates', 'IP', 'addresses'] },
];
for (let m = 1; m <= 5; m++) {
  for (let i = 0; i < 6; i++) {
    const base = BASE[i % BASE.length];
    const id = `m${m}-q${i + 1}`;
    const kw = `{${base.keywords.map(k => `"${k}"`).join(',')}}`;
    questions.push(`  ('${id}', '${m}', '${base.subject}', '${base.course}', '${base.question}', '${base.answer}', '${kw}')`);
  }
}
sql += questions.join(',\n');
sql += `\nON CONFLICT (id) DO NOTHING;\n`;

fs.writeFileSync('./supabase_seed.sql', sql);
console.log(`Generated supabase_seed.sql with ${facultyJson.length} faculty + 30 questions`);
