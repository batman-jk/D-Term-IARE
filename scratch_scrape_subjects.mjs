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
  const html = await fetchUrl('https://www.iare.ac.in/');
  
  // Find all links
  const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]*)<\/a>/gi;
  let match;
  const links = [];
  while ((match = linkRegex.exec(html)) !== null) {
    links.push({ url: match[1], text: match[2].trim() });
  }
  
  const syllabusLinks = links.filter(l => l.text.toLowerCase().includes('syllabus') || l.url.toLowerCase().includes('syllabus'));
  const curriculumLinks = links.filter(l => l.text.toLowerCase().includes('curricul') || l.url.toLowerCase().includes('curricul'));
  
  console.log("Syllabus Links:", syllabusLinks);
  console.log("Curriculum Links:", curriculumLinks);
}

debug();
