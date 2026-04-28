import https from 'https';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function debugSyllabus() {
  const html = await fetchUrl('https://www.iare.ac.in/?q=pages/btech-course-syllabi-bt25-cse');
  // Match <a> tags linking to BT25 PDF files, allowing nested HTML inside
  const linkRegex = /<a[^>]*href="[^"]*BT25[^"]*\.pdf"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  let i = 0;
  while ((match = linkRegex.exec(html)) !== null && i < 3) {
    const start = Math.max(0, match.index - 200);
    const end = match.index + 500;
    console.log(`\n\n--- MATCH ${i+1} ---`);
    console.log(html.substring(start, end));
    i++;
  }
}

debugSyllabus();
