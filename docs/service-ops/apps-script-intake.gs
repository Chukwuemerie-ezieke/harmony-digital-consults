// Harmony Digital Consults — Service Intake Web App
// Deploy: script.google.com > paste this > Deploy > New deployment >
//   Type: Web app, Execute as: Me, Who has access: Anyone > Deploy >
//   Copy the /exec URL into /js/config.js (HARMONY_CONFIG.formEndpoint)

const SHEET_ID = '1dXUFSljhOvIz0yIiSlSq-yu4y3jlNndOI_dsom3yTCg';
const NOTIFY_EMAIL = 'info@harmonydigitalconsults.com.ng';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const tab = sanitizeTab(data.service || 'Other');
    let sh = ss.getSheetByName(tab);
    if (!sh) sh = ss.insertSheet(tab);

    // First time: write headers from the data keys (timestamp first)
    if (sh.getLastRow() === 0) {
      const headers = ['Timestamp','Service','Source', ...Object.keys(data).filter(k => !['timestamp','service','source'].includes(k))];
      sh.appendRow(headers);
      sh.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#01696F').setFontColor('#ffffff');
      sh.setFrozenRows(1);
    }
    const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
    const row = headers.map(h => {
      if (h === 'Timestamp') return new Date();
      if (h === 'Service') return data.service || '';
      if (h === 'Source') return data.source || '';
      return data[h] !== undefined ? data[h] : '';
    });
    sh.appendRow(row);

    // Notify admin
    try {
      const lines = Object.entries(data).filter(([k]) => !['service','source','timestamp'].includes(k)).map(([k,v]) => `${k}: ${v}`).join('\n');
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: `[Harmony] New ${data.service || 'service'} request — ${data.Name || data.name || 'no name'}`,
        body: `New submission via ${data.source || 'site'}\n\n${lines}\n\nReply within 24 hours.`
      });
    } catch(err) { /* ignore mail errors */ }

    return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false, error: String(err)})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('Harmony Intake Endpoint — POST only.');
}

function sanitizeTab(s) {
  return String(s).replace(/[^A-Za-z0-9 _-]/g,'').slice(0,40) || 'Other';
}
