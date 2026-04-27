import requests
from bs4 import BeautifulSoup
import json
import re

DEPARTMENTS = {
    "CSE": "cse",
    "CSE (AI & ML)": "cseaiml",
    "CSE (DS)": "cseds",
    "CSE (CS)": "csecs",
    "IT": "it",
    "ECE": "ece",
    "EEE": "eee",
    "ME": "me",
    "CE": "ce",
    "AE": "ae"
}

REGULATIONS = ["BT23", "BT25"]

def get_url(reg, dept_code):
    return f"https://www.iare.ac.in/?q=pages/btech-course-syllabi-{reg.lower()}-{dept_code}"

def scrape_syllabus(reg, dept_name, dept_code):
    url = get_url(reg, dept_code)
    print(f"Scraping: {url}")
    try:
        response = requests.get(url, timeout=15)
        if response.status_code != 200:
            print(f"Failed to load {url} (Status: {response.status_code})")
            # Special case for CSE (CS) BT25 -> fallback to CSE BT25 if needed? 
            # Or just return empty
            return None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the main container
        body = soup.find('div', {'class': 'field-name-body'})
        if not body:
            body = soup.find('article')
        if not body:
            print(f"No body found for {url}")
            return None
            
        semesters = []
        
        # We need to find semesters (I, II, III, IV, V, VI, VII, VIII)
        # And for each semester, find theory subjects.
        
        # Let's extract all text and tags in order
        elements = body.find_all(['h3', 'h4', 'strong', 'b', 'li', 'a', 'p'])
        
        current_sem_name = None
        current_subjects = []
        
        # Patterns
        sem_pattern = re.compile(r'(I|II|III|IV|V|VI|VII|VIII)\s*Semester', re.I)
        subject_pattern = re.compile(r'([A-Z0-9]{6})\s*:\s*([^(\n\r<]+)')
        
        skip_keywords = [
            "Laboratory", "Workshop", "Practical", "Seminar", "Project", 
            "Internship", "Mandatory", "Skill Enhancement", "Mini Project",
            "Technical Seminar", "Design Project", "Comprehensive Viva",
            "Capstone Project", "Dissertation", "Skill Development"
        ]

        for elem in elements:
            txt = elem.get_text().strip()
            if not txt: continue
            
            # Check for Semester header
            sem_match = sem_pattern.search(txt)
            if sem_match:
                # Save previous
                if current_sem_name and current_subjects:
                    semesters.append({"Semester": current_sem_name, "Subjects": current_subjects})
                
                # Update current
                current_sem_name = sem_match.group(1).upper()
                current_subjects = []
                continue
            
            # Check for subject link or list item
            if current_sem_name:
                # Check if it's a theory subject
                if any(sk.lower() in txt.lower() for sk in skip_keywords):
                    continue
                
                m = subject_pattern.search(txt)
                if m:
                    code = m.group(1)
                    name = m.group(2).strip()
                    # Avoid duplicates in same sem
                    if not any(s['code'] == code for s in current_subjects):
                        current_subjects.append({"code": code, "name": name})
        
        # Final sem
        if current_sem_name and current_subjects:
            semesters.append({"Semester": current_sem_name, "Subjects": current_subjects})
            
        return {
            "Regulation": reg,
            "Department": dept_name,
            "Semesters": semesters
        }
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None

all_data = []
for reg in REGULATIONS:
    for dept_name, dept_code in DEPARTMENTS.items():
        data = scrape_syllabus(reg, dept_name, dept_code)
        if data:
            all_data.append(data)
        else:
            # Fallback check for known misses
            if reg == "BT25" and dept_code == "csecs":
                print("Skipping BT25 for CSE(CS) - Not Available")

with open('src/utils/iare_syllabus.json', 'w') as f:
    json.dump(all_data, f, indent=2)

print("Scraping complete. Data saved to src/utils/iare_syllabus.json")
