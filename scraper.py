import requests
from bs4 import BeautifulSoup
import json
import re

DEPARTMENTS = {
    "CSE": {"code": "cse", "id": "28"},
    "CSE (AI & ML)": {"code": "cseaiml", "id": "4232"},
    "CSE (DS)": {"code": "cseds", "id": "4234"},
    "CSE (CS)": {"code": "csecs", "id": "4233"},
    "IT": {"code": "it", "id": "29"},
    "ECE": {"code": "ece", "id": "31"},
    "EEE": {"code": "eee", "id": "32"},
    "ME": {"code": "me", "id": "33"},
    "CE": {"code": "ce", "id": "34"},
    "AE": {"code": "ae", "id": "35"}
}

all_faculty = []
all_subjects = []

for dept_name, info in DEPARTMENTS.items():
    dept_code = info["code"]
    dept_id = info["id"]
    
    # 1. Scrape Faculty
    fac_url = f"https://www.iare.ac.in/?q=departmentlist/{dept_id}"
    print(f"Scraping Faculty: {fac_url}")
    try:
        res = requests.get(fac_url, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # In the HTML, faculty names are usually in <h3> tags under the main content
        main_content = soup.find(id="main-content") or soup
        h3s = main_content.find_all('h3')
        
        fac_count = 1
        for h3 in h3s:
            name = h3.get_text(strip=True)
            if not name or name in ['Outcome Based Education (OBE)', 'Handbook - Computer Science and Engineering', 'Governance', 'Facilities', 'Student Research Initiative', 'NIRF Data', 'Helpful Links', 'Infrastructure']:
                continue
            
            # Simple heuristic to check if it's a faculty name
            if name.startswith('Dr.') or name.startswith('Mr') or name.startswith('Ms'):
                fac_id = f"FAC-{dept_code.upper()}-{fac_count:03d}"
                all_faculty.append({
                    "id": fac_id,
                    "username": fac_id,
                    "password": fac_id,
                    "role": "Faculty",
                    "displayName": name,
                    "department": dept_name,
                    "firstLogin": True
                })
                fac_count += 1
    except Exception as e:
        print(f"Failed to scrape faculty for {dept_name}: {e}")
        
    # 2. Scrape Subjects (BT25 only)
    sub_url = f"https://www.iare.ac.in/?q=pages/btech-course-syllabi-bt25-{dept_code}"
    print(f"Scraping Subjects: {sub_url}")
    try:
        res = requests.get(sub_url, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Look for links ending with .pdf and starting with a course code
        links = soup.find_all('a', href=re.compile(r'\.pdf$'))
        
        for link in links:
            txt = link.get_text(strip=True)
            # Match "CODE : Name" or just take the text if it has a hyphen/colon
            m = re.match(r'([A-Z0-9]+)\s*[:\-]\s*(.*)', txt)
            if m:
                code = m.group(1).strip()
                name = m.group(2).strip()
                
                # Check if we already added it
                if not any(s['name'] == name for s in all_subjects):
                    all_subjects.append({
                        "code": code,
                        "name": name,
                        "department": dept_name,
                        "modules": [1, 2, 3, 4, 5]
                    })
    except Exception as e:
        print(f"Failed to scrape subjects for {dept_name}: {e}")

output = {
    "faculty": all_faculty,
    "subjects": all_subjects,
    "departments": list(DEPARTMENTS.keys())
}

with open("src/utils/scraped_data.json", "w") as f:
    json.dump(output, f, indent=2)

print("Scraping complete! Saved to src/utils/scraped_data.json")
