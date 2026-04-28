import https from 'https';
import fs from 'fs';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function debug() {
  const html = await fetchUrl('https://www.iare.ac.in/?q=departmentlist/28');
  
  // Find the container div class used for each faculty entry
  // Look for the pattern around the first few faculty members
  
  // Find "Aswini Kilaru" and get surrounding HTML
  const idx = html.indexOf('Aswini Kilaru');
  if (idx > -1) {
    console.log("=== Around Aswini Kilaru ===");
    console.log(html.substring(Math.max(0, idx - 1000), idx + 500));
    console.log("\n\n");
  }
  
  // Find "Praveen kumar" and get surrounding HTML
  const idx2 = html.indexOf('Praveen kumar');
  if (idx2 > -1) {
    console.log("=== Around Praveen kumar ===");
    console.log(html.substring(Math.max(0, idx2 - 1000), idx2 + 500));
  }
  
  // Also check: does each entry have a views-row class?
  const viewsRowCount = (html.match(/views-row/g) || []).length;
  console.log(`\nTotal views-row occurrences: ${viewsRowCount}`);
  
  // Check image filenames with IARE IDs
  const imgRegex = /IARE(\d+)[^"]*\.(png|jpg)/gi;
  let match;
  const imgIds = [];
  while ((match = imgRegex.exec(html)) !== null) {
    imgIds.push(`IARE${match[1]}`);
  }
  console.log(`\nImage IARE IDs found: ${imgIds.length}`);
  console.log("First 10:", imgIds.slice(0, 10));
}

debug();
