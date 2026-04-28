import https from 'https';

https.get('https://www.iare.ac.in/?q=departmentlist/28', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // try to find IARE
    const matches = data.match(/IARE\s*\d+/gi);
    if (matches) {
        console.log("Found matches:", matches.slice(0, 10));
    } else {
        console.log("No IARE matches found.");
        
        // Let's print out the structure near Dr. M Madhubala
        const idx = data.indexOf('Dr. M Madhu');
        if (idx > -1) {
            console.log(data.substring(Math.max(0, idx - 200), idx + 500));
        }
    }
  });
});
