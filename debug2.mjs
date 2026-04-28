import fs from 'fs';

const html = fs.readFileSync('debug_faculty_page.html', 'utf8');

// Find Dr. L V Narasimha Prasad and print surrounding HTML
const idx = html.indexOf('Dr. L V Narasimha Prasad');
if (idx > -1) {
  console.log("=== Context around first faculty name ===");
  console.log(html.substring(Math.max(0, idx - 300), idx + 1000));
  console.log("\n\n=== END ===");
}

// Also find where IARE 10952 appears
const idx2 = html.indexOf('10952');
if (idx2 > -1) {
  console.log("\n=== Context around IARE 10952 ===");
  console.log(html.substring(Math.max(0, idx2 - 300), idx2 + 300));
}
