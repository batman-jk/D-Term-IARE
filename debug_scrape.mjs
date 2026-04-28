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
  
  // Save the raw HTML for inspection
  fs.writeFileSync('debug_faculty_page.html', html);
  
  // Let's find the pattern around faculty entries
  // Look for IARE IDs and their surrounding context
  const iareIdRegex = /IARE[\s\-]*(\d+)/gi;
  let match;
  const ids = [];
  while ((match = iareIdRegex.exec(html)) !== null) {
    const start = Math.max(0, match.index - 300);
    const end = Math.min(html.length, match.index + 100);
    const context = html.substring(start, end);
    
    // Find the nearest <h3> before this IARE ID
    const h3Match = context.match(/<h3>([^<]+)<\/h3>/);
    ids.push({
      iareId: `IARE ${match[1]}`,
      position: match.index,
      nearestH3: h3Match ? h3Match[1] : 'NOT FOUND',
    });
  }
  
  // Also find all h3 names
  const h3Regex = /<h3>([^<]+)<\/h3>/g;
  const names = [];
  while ((match = h3Regex.exec(html)) !== null) {
    const name = match[1].trim();
    if (name.startsWith('Dr.') || name.startsWith('Mr') || name.startsWith('Ms') || name.startsWith('Prof')) {
      names.push({ name, position: match.index });
    }
  }
  
  console.log(`Found ${ids.length} IARE IDs and ${names.length} faculty names\n`);
  
  // Print first 5 pairings to understand the structure
  console.log("=== First 5 IARE IDs with context ===");
  for (let i = 0; i < Math.min(5, ids.length); i++) {
    console.log(`${ids[i].iareId} => nearest h3: ${ids[i].nearestH3}`);
  }
  
  console.log("\n=== First 5 H3 Names ===");
  for (let i = 0; i < Math.min(5, names.length); i++) {
    console.log(`${names[i].name} at position ${names[i].position}`);
  }
  
  // Now let's look at the actual HTML structure around the first faculty entry
  const firstId = html.indexOf('IARE');
  if (firstId > -1) {
    console.log("\n=== HTML around first IARE ID (500 chars before, 200 after) ===");
    console.log(html.substring(Math.max(0, firstId - 500), firstId + 200));
  }
}

debug();
