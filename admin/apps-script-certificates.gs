/**
 * Harmony Learn — Certificate issuer (Google Apps Script web app)
 * ----------------------------------------------------------------
 * Receives a POST from the learner's browser when they generate their
 * certificate, writes a row to the Certificates tab of the access sheet,
 * and emails the learner a PDF certificate from harmonydigitalconsults@gmail.com.
 *
 * Bound to: Harmony Learn — Access Codes spreadsheet
 *   https://docs.google.com/spreadsheets/d/1P96xJ6P9j4Xdsycny5fGs2wC9NUkejHNJf0JSMTmYzc/edit
 *
 * Deploy steps:
 *   1. In the spreadsheet menu: Extensions -> Apps Script
 *   2. Replace any existing Code.gs with the contents of this file
 *   3. Save (floppy disk icon) -> name the project "Harmony Learn Certificates"
 *   4. Click Deploy -> New deployment -> Type "Web app"
 *      - Description: "Harmony Learn cert issuer v1"
 *      - Execute as: Me (harmonydigitalconsults@gmail.com)
 *      - Who has access: Anyone
 *   5. Click Deploy -> grant the permissions it asks for
 *   6. Copy the Web app URL (it ends in /exec) and paste it as
 *      CERT_API_URL in learn/<course>/js/course.js for both courses.
 *
 * Re-deploying (after edits): Deploy -> Manage deployments -> pencil/edit
 *   -> Version: "New version" -> Deploy.  The URL stays the same.
 */

var SHEET_ID = '1P96xJ6P9j4Xdsycny5fGs2wC9NUkejHNJf0JSMTmYzc';
var CERTS_TAB = 'Certificates';
var BRAND_NAME = 'Harmony Digital Consults';
var BRAND_EMAIL = 'info@harmonydigitalconsults.com.ng';
var SITE_BASE = 'https://harmonydigitalconsults.com.ng';
var SIGNATORY = 'Mr Chukwuemerie Ezieke';
var SIGNATORY_TITLE = 'Director';

/**
 * Web app entrypoint. Accepts a POST with JSON body:
 *   { cert_id, learner_name, email, course, course_title, score }
 * Returns JSON { ok: true, cert_id, verify_url } or { ok: false, error }.
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || '{}');
    var certId = (body.cert_id || '').toString().trim();
    var name   = (body.learner_name || '').toString().trim();
    var email  = (body.email || '').toString().trim();
    var course = (body.course || '').toString().trim();   // e.g. HDT-208
    var title  = (body.course_title || '').toString().trim();
    var score  = parseInt(body.score, 10) || 0;

    if (!certId || !name || !email || !course || score < 70) {
      return _json({ ok: false, error: 'missing_or_invalid_fields' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return _json({ ok: false, error: 'invalid_email' });
    }

    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(CERTS_TAB);
    if (!sheet) return _json({ ok: false, error: 'certs_tab_missing' });

    // De-dupe: if this cert_id already exists, return its verify URL without rewriting.
    var existing = _findByCertId(sheet, certId);
    var verifyPath = '/learn/' + (course === 'HDT-207' ? 'ai-in-education' : 'classroom-management') + '/verify.html?id=' + encodeURIComponent(certId);
    var verifyUrl  = SITE_BASE + verifyPath;

    if (!existing) {
      sheet.appendRow([
        certId,
        new Date(),
        name,
        email,
        course,
        score,
        verifyUrl,
        'valid',
        ''
      ]);
    }

    // Build and send email
    var subject = 'Your ' + course + ' certificate from ' + BRAND_NAME;
    var html = _buildEmailHtml({
      name: name, course: course, title: title || course,
      score: score, certId: certId, verifyUrl: verifyUrl
    });
    var pdfBlob = _buildCertificatePdf({
      name: name, course: course, title: title || course,
      score: score, certId: certId, verifyUrl: verifyUrl
    });

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: html,
      name: BRAND_NAME,
      replyTo: BRAND_EMAIL,
      attachments: pdfBlob ? [pdfBlob] : []
    });

    return _json({ ok: true, cert_id: certId, verify_url: verifyUrl });
  } catch (err) {
    return _json({ ok: false, error: String(err && err.message || err) });
  }
}

/**
 * Public GET endpoint for verifying a certificate.
 * Usage: <web-app-url>?action=verify&id=HDC-CM-A7K9P2
 * Returns: { ok: true, valid: true|false, learner_name, course, score, issued_at }
 */
function doGet(e) {
  var params = e && e.parameter || {};
  if (params.action === 'verify') {
    var certId = (params.id || '').toString().trim();
    if (!certId) return _json({ ok: false, error: 'missing_id' });
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(CERTS_TAB);
    var row = _findByCertId(sheet, certId);
    if (!row) return _json({ ok: true, valid: false });
    return _json({
      ok: true,
      valid: row.status === 'valid',
      cert_id:      row.cert_id,
      learner_name: row.learner_name,
      course:       row.course,
      score:        row.score,
      issued_at:    row.issued_at,
      status:       row.status
    });
  }
  return _json({ ok: false, error: 'unknown_action' });
}

// ---- helpers -------------------------------------------------------------

function _findByCertId(sheet, certId) {
  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return null;
  var headers = data[0];
  var idCol = headers.indexOf('cert_id');
  if (idCol === -1) return null;
  var target = certId.toUpperCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]).toUpperCase() === target) {
      return _rowObj(headers, data[i]);
    }
  }
  return null;
}

function _rowObj(headers, row) {
  var o = {};
  for (var i = 0; i < headers.length; i++) o[headers[i]] = row[i];
  return o;
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _buildEmailHtml(d) {
  var dateStr = Utilities.formatDate(new Date(), 'Africa/Lagos', 'dd MMMM yyyy');
  return [
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;line-height:1.55;">',
    '<p style="font-size:14px;letter-spacing:3px;color:#b45309;text-transform:uppercase;font-weight:700;margin:0 0 8px;">Harmony Digital Consults</p>',
    '<h2 style="margin:0 0 16px;font-size:24px;">Congratulations, ' + _esc(d.name) + '</h2>',
    '<p>You have successfully completed <strong>' + _esc(d.title) + '</strong> (' + _esc(d.course) + ') with a final score of <strong>' + d.score + '%</strong>.</p>',
    '<p>Your certificate is attached to this email as a PDF. You can also verify it any time at:</p>',
    '<p><a href="' + d.verifyUrl + '" style="color:#b45309;font-weight:600;">' + d.verifyUrl + '</a></p>',
    '<div style="margin:24px 0;padding:14px 16px;background:#f1f5f9;border-left:4px solid #b45309;">',
    '<p style="margin:0;font-size:13px;color:#475569;">Certificate ID</p>',
    '<p style="margin:4px 0 0;font-size:16px;font-weight:700;letter-spacing:1px;">' + _esc(d.certId) + '</p>',
    '</div>',
    '<p>Issued on ' + dateStr + ' by ' + SIGNATORY + ', ' + SIGNATORY_TITLE + '.</p>',
    '<p>If anyone wants to verify your certificate, please share the verification link above or the Certificate ID. We confirm authenticity in seconds.</p>',
    '<p style="margin-top:28px;">Warm regards,<br>' + SIGNATORY + '<br>' + SIGNATORY_TITLE + ', ' + BRAND_NAME + '</p>',
    '<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">',
    '<p style="font-size:12px;color:#64748b;">' + BRAND_NAME + ' &middot; <a href="' + SITE_BASE + '" style="color:#64748b;">harmonydigitalconsults.com.ng</a> &middot; ' + BRAND_EMAIL + '</p>',
    '</div>'
  ].join('');
}

/**
 * Builds a PDF certificate using an HTML-to-PDF round-trip via Drive.
 * We create a temporary Google Doc with HTML, export as PDF, delete the doc.
 * Returns a Blob (PDF) or null on failure.
 */
function _buildCertificatePdf(d) {
  try {
    var dateStr = Utilities.formatDate(new Date(), 'Africa/Lagos', 'dd MMMM yyyy');
    var html = _certHtml(d, dateStr);
    // Convert HTML -> Doc -> PDF
    var blob = Utilities.newBlob(html, 'text/html', 'cert.html');
    var resource = { title: 'temp-cert-' + d.certId, mimeType: 'application/vnd.google-apps.document' };
    var file = Drive.Files.insert(resource, blob, { convert: true });
    var doc = DriveApp.getFileById(file.id);
    var pdf = doc.getAs('application/pdf').setName(d.course + '-Certificate-' + d.certId + '.pdf');
    doc.setTrashed(true);
    return pdf;
  } catch (err) {
    // Fallback: send without attachment rather than fail the whole flow
    return null;
  }
}

function _certHtml(d, dateStr) {
  // Landscape A4-ish layout. Inline styles only — Docs strips <style> tags.
  return '' +
  '<div style="border:3px double #0f172a;padding:40px;font-family:Georgia,serif;text-align:center;">' +
    '<p style="letter-spacing:4px;font-size:12px;color:#b45309;font-weight:bold;text-transform:uppercase;margin:0;">' + BRAND_NAME + '</p>' +
    '<h1 style="font-size:38px;margin:8px 0 4px;color:#0f172a;">Certificate of Completion</h1>' +
    '<p style="color:#475569;font-size:13px;margin:0 0 20px;">Teachers Training Programme &middot; Course Code ' + _esc(d.course) + '</p>' +
    '<p style="color:#475569;margin:18px 0 4px;">This certificate is proudly awarded to</p>' +
    '<p style="font-size:34px;color:#0f172a;font-weight:bold;border-bottom:2px solid #b45309;display:inline-block;padding:0 24px 4px;margin:6px 0;">' + _esc(d.name) + '</p>' +
    '<p style="margin:18px auto 0;max-width:640px;font-size:14px;line-height:1.5;">for the successful completion of <strong>' + _esc(d.title) + '</strong>, including all learning units and the final assessment, with a score of <strong>' + d.score + '%</strong>.</p>' +
    '<table style="width:100%;margin-top:40px;border-collapse:collapse;"><tr>' +
      '<td style="text-align:center;font-size:12px;color:#0f172a;border-top:1px solid #0f172a;padding-top:6px;width:33%;"><strong style="font-family:Georgia,serif;font-size:14px;">' + dateStr + '</strong><br>DATE OF AWARD</td>' +
      '<td style="text-align:center;font-size:12px;color:#0f172a;border-top:1px solid #0f172a;padding-top:6px;width:34%;"><strong style="font-family:Georgia,serif;font-size:14px;">' + _esc(d.certId) + '</strong><br>CERTIFICATE ID</td>' +
      '<td style="text-align:center;font-size:12px;color:#0f172a;border-top:1px solid #0f172a;padding-top:6px;width:33%;"><strong style="font-family:Georgia,serif;font-size:14px;">' + SIGNATORY + '</strong><br>' + SIGNATORY_TITLE.toUpperCase() + '</td>' +
    '</tr></table>' +
    '<p style="margin-top:30px;font-size:11px;color:#64748b;">Verify: ' + d.verifyUrl + '</p>' +
  '</div>';
}

function _esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
