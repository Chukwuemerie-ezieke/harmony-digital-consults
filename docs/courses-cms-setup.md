# Harmony Teacher Training — Course CMS Setup Guide

This guide explains how the **Sheet-driven course platform** works and how to use it to publish new courses, set up payments, and issue certificates.

---

## 🧭 How it works (one-paragraph summary)

You manage every course (title, price, lessons, links, status) in a single **Google Sheet**. The website (`/courses/`) reads the Sheet's **Published CSV URL** every time a visitor opens it. To add or update a course, you edit a row in the Sheet — no code, no commit, no deploy. Changes appear on the site within ~5 minutes (Google's CSV cache).

---

## ⚙️ One-time setup (15 minutes)

### Step 1: Publish the Course Sheet to the web

1. Open the [Course Content (CMS) sheet](https://docs.google.com/spreadsheets/d/1bbBvDaBvrHVSpWzmMOOfVpcgh8D2xYNIAczV2dXyX1s/edit)
2. Click **File → Share → Publish to web**
3. In the dialog:
   - **Link** tab
   - Dropdown 1: select **"Courses"** (NOT "Entire Document")
   - Dropdown 2: select **"Comma-separated values (.csv)"**
   - Click **Publish** → confirm
4. Copy the URL it shows (looks like `https://docs.google.com/spreadsheets/d/e/2PACX-XXXXXXX/pub?gid=0&single=true&output=csv`)
5. Open the repo file **`courses/courses-data.js`** on GitHub
6. Click the pencil to edit, replace the `SHEET_CSV_URL` value with the URL you copied (keep the quotes)
7. Commit the change. The site is now live and reading from your Sheet.

### Step 2: Set up Paystack (free)

1. Sign up at [paystack.com](https://paystack.com) (Nigerian-owned, supports Nigerian banks)
2. Verify your business (BVN, ID, business reg if available — Paystack accepts individuals too)
3. In dashboard → **Payments → Payment Pages → Create page**
4. For each course:
   - Name: `HDT-207 — AI-Assisted Content Creation`
   - Amount: ₦15,000 (set to whatever you sell at)
   - Description: brief course summary
   - Success URL: `https://harmonydigitalconsults.com.ng/courses/welcome.html?id=HDT-207` (you can create this thank-you page later)
   - Save → copy the Paystack link (e.g., `https://paystack.com/pay/hdt-207`)
5. Paste that link into the `paystack_url` column for that course's row in the Sheet

Paystack charges **1.5% + ₦100** per transaction. No monthly fees.

### Step 3: Set up Google Forms quiz + auto-certificate

1. Open [Google Forms](https://forms.google.com) → create a new form
2. Settings (gear icon) → **Make this a quiz**: ON
3. Add 8–12 questions with correct answers and point values
4. Set **Passing score** (e.g., 70%)
5. Get the share link (e.g., `https://forms.gle/abc123`)
6. Paste into the `quiz_url` column for that course's row
7. **For auto-certificates:** install the free **"Certify'em"** Google Workspace add-on:
   - Open the form → 3 dots menu → **Add-ons** → search "Certify'em" → install
   - Configure: pass score, certificate template (Canva → PDF), email subject
   - Now when a learner passes the quiz, they auto-receive a PDF certificate in their email

### Step 4 (optional): Welcome / access-delivery email

Use your already-connected **Resend** account:
1. After a successful Paystack payment, you'll get an email from Paystack with the buyer's email
2. Manually (for now) reply with: workbook link + WhatsApp group invite + quiz link
3. **Later:** automate this with a Paystack webhook → Resend (~30 min setup, ask me when ready)

---

## ✏️ Adding a new course (3 minutes)

1. Open the [Course Sheet](https://docs.google.com/spreadsheets/d/1bbBvDaBvrHVSpWzmMOOfVpcgh8D2xYNIAczV2dXyX1s/edit)
2. Go to the **Courses** tab
3. Add a new row. See the **Field Guide** tab if any column is unclear.
4. Set `status` = `published` when ready to go live
5. Set `featured` = `yes` to highlight on the courses index page
6. Save (Google auto-saves). The course appears on the site within 5 minutes.

### Tips for each column

- **course_id**: Use the format `HDT-###` from your curriculum scope. This is also the URL: `/courses/course.html?id=HDT-207`
- **outcomes**: Separate with `|` (pipe). The site renders each one as a tick-mark line.
- **lessons_json**: Use this exact format:
  ```
  [{"n":1,"title":"Lesson 1 title","duration":"45 min","desc":"What this lesson covers"},
   {"n":2,"title":"Lesson 2 title","duration":"60 min","desc":"..."}]
  ```
  **Tip:** Compose lessons in a separate tab as plain columns, then concatenate with a formula like `="[{\"n\":1,\"title\":\""&B2&"\",..."&"}]"` — or just paste the JSON directly.
- **intro_video_url**: Must be a **YouTube embed URL** (the `youtube.com/embed/VIDEO_ID` format). Upload your intro video to YouTube as **Unlisted**, then click Share → Embed → copy the `src=` URL.
- **workbook_url**: Upload PDF to Google Drive → Share → Anyone with link can view → copy link
- **price_ngn**: Numbers only, no commas (e.g., `15000` not `15,000`)
- **status**: Only courses with `published` (lowercase) show on the site

---

## 🎬 Recommended module production workflow

For each new module (HDT-207 first):

1. **Outline** the 6 lessons (titles + 1-line description each) → paste into `lessons_json`
2. **Record intro video** (3–5 min, phone, well-lit) → upload to YouTube unlisted → paste embed URL
3. **Build workbook** in Canva (or Google Doc) → export PDF → upload to Drive → paste share URL
4. **Build quiz** in Google Forms → 10 questions → install Certify'em → paste form URL
5. **Create Paystack link** for the price → paste URL
6. **Set status = published** in the Sheet
7. Promote — your course is now live, sells itself, delivers automatically, and certifies graduates

Total time per module after the first: **~12 hours of content production, ~30 min of setup**.

---

## 🔧 Troubleshooting

| Symptom | Fix |
|---|---|
| "Could not load course" on site | Sheet not published, or `SHEET_CSV_URL` in `courses-data.js` not set |
| Edit to Sheet not appearing | Wait 5 min (Google's CSV cache); force browser refresh with Ctrl+F5 |
| Lessons not rendering | Check `lessons_json` is valid JSON (use [jsonlint.com](https://jsonlint.com) to validate) |
| Video not showing | Use `youtube.com/embed/` URL, not `youtube.com/watch?v=` |
| Course not appearing | Check `status` column says `published` (lowercase) |

---

## 📂 File locations

| File | Purpose |
|---|---|
| `/courses/index.html` | Browse all courses page |
| `/courses/course.html` | Individual course detail page (template — all courses share this) |
| `/courses/courses-data.js` | Loader that fetches the Sheet CSV |
| Google Sheet | Content management (you edit only this) |
| `/docs/courses-cms-setup.md` | This guide |

---

*Once you complete Step 1 (publish the Sheet + paste URL), the entire system is live. Every future course is a single sheet row away.*
