/**
 * Courses data loader — reads from Google Sheets published CSV.
 *
 * SETUP (one-time):
 *   1. Open the Course CMS sheet: https://docs.google.com/spreadsheets/d/1bbBvDaBvrHVSpWzmMOOfVpcgh8D2xYNIAczV2dXyX1s/edit
 *   2. File → Share → Publish to web → Sheet: "Courses" → Format: "Comma-separated values (.csv)" → Publish
 *   3. Copy the published URL and paste it below as SHEET_CSV_URL
 *   4. Commit the file. Done — every edit to the sheet now appears on the site within ~5 minutes (Google's cache).
 *
 * To force-refresh after editing: add `?t=` + Date.now() to the URL (already done below).
 */

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/PASTE_YOUR_PUBLISHED_CSV_URL_HERE/pub?gid=0&single=true&output=csv";

// Minimal CSV parser — handles quoted fields, embedded commas, embedded quotes, newlines inside quoted cells
function parseCSV(text){
  const rows = [];
  let row = [], cell = '', inQuotes = false;
  for(let i = 0; i < text.length; i++){
    const ch = text[i], next = text[i+1];
    if(inQuotes){
      if(ch === '"' && next === '"'){ cell += '"'; i++; }
      else if(ch === '"'){ inQuotes = false; }
      else cell += ch;
    } else {
      if(ch === '"'){ inQuotes = true; }
      else if(ch === ','){ row.push(cell); cell = ''; }
      else if(ch === '\n'){ row.push(cell); rows.push(row); row = []; cell = ''; }
      else if(ch === '\r'){ /* skip */ }
      else cell += ch;
    }
  }
  if(cell !== '' || row.length){ row.push(cell); rows.push(row); }
  return rows;
}

async function loadCourses(){
  const url = SHEET_CSV_URL + (SHEET_CSV_URL.includes('?') ? '&' : '?') + 't=' + Math.floor(Date.now()/300000); // cache-bust every 5 min
  const resp = await fetch(url);
  if(!resp.ok) throw new Error('Sheet fetch failed: ' + resp.status);
  const text = await resp.text();
  const rows = parseCSV(text);
  if(rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).filter(r => r.some(c => c && c.trim())).map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = (r[i]||'').trim());
    return obj;
  });
}

window.loadCourses = loadCourses;
