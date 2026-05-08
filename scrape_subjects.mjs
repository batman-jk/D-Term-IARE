import https from 'https';
import fs from 'fs';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Handle redirect
        resolve(fetchUrl(res.headers.location.startsWith('http') ? res.headers.location : 'https://www.iare.ac.in' + res.headers.location));
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch ${url}, status: ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrapeSubjects() {
  try {
    console.log("Fetching IARE B.Tech Syllabus...");
    // Let's use the main page or syllabus page
    const html = await fetchUrl('https://www.iare.ac.in/?q=pages/btech-syllabus');
    
    // Attempting to extract branch and semester data
    // Usually B.Tech syllabus has tables with Subject Name, Subject Code, etc.
    const subjectRegex = /<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>(?:Core|Elective)<\/td>/gi;
    
    let match;
    const subjects = [];
    while ((match = subjectRegex.exec(html)) !== null) {
       subjects.push({
         code: match[1].trim(),
         name: match[2].trim()
       });
    }

    if (subjects.length > 0) {
      console.log(`Found ${subjects.length} subjects!`);
      fs.writeFileSync('scraped_subjects.json', JSON.stringify(subjects, null, 2));
    } else {
      console.log("No subjects matched the regex on the syllabus page.");
      // Fallback: Dump the HTML for manual inspection
      fs.writeFileSync('debug_syllabus.html', html);
    }
  } catch (err) {
    console.error("Scraping failed:", err.message);
  }
}

scrapeSubjects();
