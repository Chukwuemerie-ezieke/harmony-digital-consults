# Service Operations — Setup & Daily Use

## ONE-TIME SETUP (~15 minutes)

### 1. Deploy the intake endpoint (Apps Script)
1. Open https://script.google.com → New project
2. Replace the default code with the contents of `apps-script-intake.gs`
3. Save (give it a name, e.g. "Harmony Intake")
4. Click **Deploy → New deployment**
   • Type: **Web app**
   • Execute as: **Me**
   • Who has access: **Anyone**
5. Click **Deploy** → authorise → copy the **Web app URL** (ends in `/exec`)
6. Open `/js/config.js` in this repo, paste the URL into `formEndpoint`, commit & push.

That's it — forms now write to your master sheet and email you on every submission.

### 2. Paystack payment links
Create 4 product/payment pages in https://dashboard.paystack.com/#/products:
| Product | Amount | Use for |
|---|---|---|
| Study-Abroad Strategy Call | ₦35,000 | Page: services/study-abroad-call.html |
| Career Strategy Call | ₦20,000 | Page: services/career-strategy-call.html |
| Parent Brief (deposit) | ₦12,500 | 50% of ₦25k |
| Institutional Brief (deposit) | varies | Send custom invoice link |

Save each Payment Link URL — you'll paste them into the "payment link" email template per request.

### 3. Calendar slots
1. Open https://calendar.google.com → Create → **Appointment schedule**
2. Create two:
   • "Study-Abroad Strategy Call" — 60 min, weekdays 5–9 PM, Sat 10 AM–4 PM
   • "Career Strategy Call" — 45 min, same hours
3. Copy each booking page URL — paste into the calendar-link email after payment.

### 4. Resend (optional — for branded auto-replies)
The Apps Script already emails YOU on every submission. To auto-reply to the client too:
1. Add `MailApp.sendEmail({to: data.Email, subject: ..., body: ...})` after the existing MailApp call in the Apps Script (copy the body from `email-1-intake-received.txt`).
2. Or send manually using the templates — recommended for the first 10 clients so you can tailor tone.

## DAILY WORKFLOW PER REQUEST
1. **Email arrives** (from Apps Script notification) → open the master sheet to see the row.
2. **Reply within 24 hrs** using `email-1-intake-received.txt` (paste & personalise).
3. **Qualify** (60 seconds). If fit, send `email-2-payment-link.txt` with the right Paystack link.
4. **Paystack notifies you of payment** → send calendar link (calls) or scope confirmation (briefs).
5. **Deliver** on the agreed date using `email-3-delivery.txt`.
6. **Mark the row** in the master sheet as Done (add a column manually).

## METRICS TO TRACK WEEKLY (in the master sheet)
• Submissions by service
• Conversion rate to payment (target: >40% for calls, >25% for briefs)
• Median response time (target: <4 hours during workday)
• Net Promoter / one-line client feedback

## ESCALATION
• Form errors → check Apps Script logs at script.google.com → your project → Executions
• Payment issues → reply asking client to retry; offer bank transfer fallback
