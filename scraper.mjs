import fs from 'fs';
import https from 'https';

const DEPARTMENTS = {
  "CSE": { code: "cse", id: "28" },
  "CSE (AI & ML)": { code: "cseaiml", id: "113" },
  "CSE (DS)": { code: "cseds", id: "116" },
  "CSE (CS)": { code: "csecs", id: "115" },
  "IT": { code: "it", id: "27" },
  "ECE": { code: "ece", id: "29" },
  "EEE": { code: "eee", id: "30" },
  "ME": { code: "me", id: "31" },
  "CE": { code: "ce", id: "32" },
  "AE": { code: "ae", id: "26" }
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Small delay to avoid hammering the server
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrape() {
  const allFaculty = [];
  const allSubjects = [];
  const allDeps = Object.keys(DEPARTMENTS);

  console.log("Starting scraping...");

  for (const [deptName, info] of Object.entries(DEPARTMENTS)) {
    const deptCode = info.code;
    
    // Scrape Faculty
    try {
      console.log(`Scraping faculty for ${deptName}...`);
      const html = await fetchUrl(`https://www.iare.ac.in/?q=departmentlist/${info.id}`);
      
      // Each faculty entry is inside a facInfo div with this structure:
      //   <div class="facInfo ...">
      //     <div class="facImg">
      //       <img src="...IARE10556_0.png..." />
      //     </div>
      //     <div class="facRight">
      //       <h3>Mr. C Praveen kumar </h3>
      //     </div>
      //   </div>
      // We match the image IARE ID and the h3 name within the same facInfo block.
      const facInfoRegex = /<div class="facInfo[^"]*">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
      let match;
      let count = 1;
      
      while ((match = facInfoRegex.exec(html)) !== null) {
        const block = match[1];
        
        // Extract IARE ID from image src
        const imgMatch = block.match(/IARE(\d+)/i);
        // Extract name from h3
        const nameMatch = block.match(/<h3>([^<]+)<\/h3>/);
        
        if (nameMatch) {
          let name = nameMatch[1].trim().replace(/&amp;/g, '&');
          
          if (name && (name.startsWith('Dr.') || name.startsWith('Mr') || name.startsWith('Ms') || name.startsWith('Prof'))) {
            const facId = imgMatch ? `IARE ${imgMatch[1]}` : `FAC-${deptCode.toUpperCase()}-${String(count).padStart(3, '0')}`;
            
            allFaculty.push({
              id: facId,
              username: facId,
              password: facId,
              role: "Faculty",
              displayName: name,
              department: deptName,
              firstLogin: true
            });
            
            process.stdout.write(`    ${name} => ${facId}\n`);
            count++;
          }
        }
      }
      
      console.log(`  Completed ${deptName}: ${count - 1} faculty`);
    } catch (e) {
      console.error(`Error scraping faculty for ${deptName}:`, e);
    }

    // Scrape Subjects
    try {
      console.log(`Scraping subjects for ${deptName}...`);
      const html = await fetchUrl(`https://www.iare.ac.in/?q=pages/btech-course-syllabi-bt25-${info.code}`);
      // Match <a> tags linking to BT25 PDF files, allowing nested HTML inside
      const linkRegex = /<a[^>]*href="[^"]*BT25[^"]*\.pdf"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = linkRegex.exec(html)) !== null) {
        // Strip any inner HTML tags (e.g. <span>) and decode entities
        let txt = match[1].replace(/<[^>]+>/g, '').trim().replace(/&amp;/g, '&').replace(/\s+/g, ' ');
        // Match subject code (4-6 alphanumeric chars) followed by colon/dash and subject name
        const m = txt.match(/^([A-Z]{3,5}\d{2,3})\s*[:\-–]\s*(.+)$/i);
        if (m) {
          const code = m[1].trim().toUpperCase();
          const name = m[2].trim();
          
          if (!allSubjects.some(s => s.code === code)) {
            allSubjects.push({
              code,
              name,
              department: deptName,
              modules: [1, 2, 3, 4, 5]
            });
          }
        }
      }
      console.log(`  Found ${allSubjects.filter(s => s.department === deptName).length} subjects for ${deptName}`);
    } catch (e) {
      console.error(`Error scraping subjects for ${deptName}:`, e);
    }
  }

  // Create generatedData.ts
  const tsContent = `// Auto-generated data from IARE website
export interface GeneratedSubject {
  code: string;
  name: string;
  department: string;
  modules: number[];
}

export const GENERATED_FACULTY = ${JSON.stringify(allFaculty, null, 2)};
export const GENERATED_SUBJECTS: GeneratedSubject[] = ${JSON.stringify(allSubjects, null, 2)};
export const GENERATED_DEPARTMENTS = ${JSON.stringify(allDeps, null, 2)};
`;

  fs.writeFileSync('src/utils/generatedData.ts', tsContent);
  console.log(`\nData successfully saved to src/utils/generatedData.ts!`);
  console.log(`Total: ${allFaculty.length} faculty, ${allSubjects.length} subjects, ${allDeps.length} departments`);
}

scrape();
