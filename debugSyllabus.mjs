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
  // Print some relevant parts to see if modules are mentioned
  const idx = html.indexOf('AITD01'); // Find a specific subject code if possible, or just print a bit
  console.log(html.substring(Math.max(0, idx - 500), idx + 2000));
}

debugSyllabus();
