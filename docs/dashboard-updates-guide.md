# How to Update Insights Dashboards

Last updated: 14 May 2026

Three of the 13 dashboards now read from Google Sheets, so you can update them with no code, no commit, no push.

## Quick reference

| Dashboard | Update method | Sheet |
|---|---|---|
| **Cost of Education in Nigeria Tracker** | Edit Google Sheet | [Open sheet](https://docs.google.com/spreadsheets/d/1E6tWIv3BLQIfM9oqAqJ8NC_d-IEFpYuYKK070zmuSlM/edit) |
| **Nigeria Education in 20 Numbers (Stats Card)** | Edit Google Sheet | [Open sheet](https://docs.google.com/spreadsheets/d/1FxH4hZXOLLu6GZS1AEJcGou0WjeCNU-uCzUCh7zAvoQ/edit) |
| **AI Tools for Teachers Directory** | Edit Google Sheet | [Open sheet](https://docs.google.com/spreadsheets/d/1leuhgyNtwjTqEdXIG61UHYn4XwGJz5AnDixPONMcn_c/edit) |
| **Course modules system** | Edit Google Sheet (existing) | (see previous handoff brief) |
| All other 9 dashboards | Edit the HTML file in `dashboards/` and commit | — |

---

## ONE-TIME SETUP (do this first)

For each of the 3 sheets above, you must change sharing to "Anyone with the link can view" — otherwise the dashboards can't read them.

1. Open the sheet
2. Click the green **Share** button (top-right)
3. Under "General access", change `Restricted` → `Anyone with the link`
4. Make sure the role is **Viewer** (not Editor)
5. Click **Done**

Once done, the dashboards will start showing live sheet data on the next page refresh. Until then, they show built-in fallback data, so visitors never see a broken page.

---

## Dashboard 1: Cost of Education Tracker

**Sheet:** [Cost of Education sheet](https://docs.google.com/spreadsheets/d/1E6tWIv3BLQIfM9oqAqJ8NC_d-IEFpYuYKK070zmuSlM/edit)
**Worksheet name:** `Fees`

### Columns

| Column | Meaning | Example |
|---|---|---|
| A — Year | Calendar year | 2025 |
| B — Public K-12 per term (NGN) | Levies, uniform, PTA contributions | 14000 |
| C — Private K-12 per term (NGN) | Mid-tier urban schools median | 320000 |
| D — Federal University per session | Median across federal unis | 45000 |
| E — State University per session | Median across state unis | 400000 |
| F — Private University per session | Median across private unis | 2800000 |
| G — Inflation % | Annual headline inflation (NBS CPI) | 23.5 |

### To add a new year (e.g. 2026)

1. Open the sheet
2. Add a new row below 2025 with the 7 values
3. Save (auto-saves)
4. The dashboard line charts, table, and inflation-adjusted toggle update on next page load — no code change

### To revise an existing year

Just edit the cells in place. The change shows up immediately on the live site once you refresh the dashboard page.

---

## Dashboard 2: Nigeria Education in 20 Numbers (Stats Card)

**Sheet:** [Stats Card sheet](https://docs.google.com/spreadsheets/d/1FxH4hZXOLLu6GZS1AEJcGou0WjeCNU-uCzUCh7zAvoQ/edit)
**Worksheet name:** `Stats`

### Columns

| Column | Meaning |
|---|---|
| A — Order | Display order (1, 2, 3 …). Sort the sheet by this column. |
| B — Number | The big statistic shown (e.g. `309`, `44.4%`, `18.3M`). Keep short. |
| C — Label | Short description under the number (e.g. `NUC-accredited universities`). |
| D — Source | Attribution shown at the bottom of the tile (e.g. `NUC · 2025`). |
| E — Style | Visual style of the tile. Must be one of: `plain`, `dark`, `accent`. |

### Style rules

- `plain` — white tile, teal number (use this for ~75% of stats)
- `dark` — teal background, white number (use for the most important / headline stats)
- `accent` — light amber background, rust number (use for warnings / striking figures)

The infographic is designed for visual rhythm. As a guide, aim for roughly: **12 plain, 5 dark, 3 accent**, spread out evenly.

### To replace a stat

Edit the row directly. To swap one stat for another, just replace the Number / Label / Source / Style on the same row.

### To add or remove stats

The dashboard works with any number of stats but is visually designed for exactly 20 (4 columns × 5 rows). If you go to 21 or 19, the bottom row will look uneven. Stick to 20 unless you also want to update the print layout.

---

## Dashboard 3: AI Tools for Teachers Directory

**Sheet:** [AI Tools sheet](https://docs.google.com/spreadsheets/d/1leuhgyNtwjTqEdXIG61UHYn4XwGJz5AnDixPONMcn_c/edit)
**Worksheet name:** `Tools`

### Columns

| Column | Meaning |
|---|---|
| A — Name | Tool name (e.g. `ChatGPT (OpenAI)`) |
| B — Category | Free-text category. Used to build the filter dropdown. Try to reuse existing categories. |
| C — Score (1-5) | Harmony's classroom-usefulness rating |
| D — Budget | One of: `free`, `freemium`, `paid` (lowercase) |
| E — Level | One of: `primary`, `secondary`, `tertiary`, `all` (lowercase) |
| F — Price | Free-text price summary (e.g. `Free tier; Plus $20/mo`) |
| G — Description | 1-2 sentence description |
| H — Use Case | One concrete classroom example |
| I — URL | Tool homepage **— this is where you paste your affiliate link** when you have one |

### To add a new tool

Add a new row. The category dropdown rebuilds automatically.

### To rotate the directory (monthly refresh cadence)

- Sort by Score (1-5) descending occasionally to keep the strongest tools on top
- Replace tools that have shut down or dropped quality
- Update prices when vendors change them
- Swap homepage URLs to affiliate links as you sign up for partner programmes

### Existing categories used

If you want to keep filter UI clean, reuse these:

- General AI Assistant
- Teacher Productivity
- Differentiation
- Interactive Lessons
- Student-facing AI
- Content Creation
- Assessment
- Chrome Extension
- Tutoring
- Research
- Writing Feedback
- Language Teaching

---

## Sheet-driven flow under the hood

```
Google Sheet (you edit)
      ↓
gviz/tq JSON endpoint  (e.g. .../gviz/tq?tqx=out:json&sheet=Fees )
      ↓
Dashboard's <script> fetches JSON on page load
      ↓
Renders charts / table / cards from the data
```

No API key needed. No build step. No deploy. Just edit the sheet → save → refresh the dashboard.

### What if the sheet is down or you make a mistake?

Each dashboard ships with a built-in fallback copy of the current data, embedded in the HTML. If the gviz fetch fails for any reason (sheet deleted, sharing reverted, Google outage), visitors still see a complete dashboard — just with the values from the last code deploy.

You'll see a console warning in the browser developer tools if the sheet fetch fails. Visitors won't see any error.

---

## How to update the remaining 10 dashboards

These are still hard-coded in HTML. To update them, edit the file in `dashboards/` and commit:

| Dashboard | File | Where the data lives |
|---|---|---|
| Nigeria Digital Skills Gap | `dashboards/nigeria-digital-skills-gap.html` | Inline data in `<script>` block |
| E-Learning Platform Comparison | `dashboards/elearning-platform-comparison.html` | `PLATFORMS` array near bottom |
| School ICT Readiness Scorecard | `dashboards/school-ict-readiness-scorecard.html` | `QUESTIONS` array |
| Teacher Digital Skills Self-Assessment | `dashboards/teacher-digital-skills-self-assessment.html` | `COMPETENCIES` array |
| WAEC & NECO Pass Rate Dashboard | `dashboards/waec-neco-pass-rate-dashboard.html` | `WAEC_DATA` / `NECO_DATA` arrays |
| Out-of-School Children in Nigeria | `dashboards/out-of-school-children-nigeria.html` | Inline data |
| Nigeria vs. Kenya EdTech | `dashboards/nigeria-vs-kenya-edtech.html` | Inline data |
| EdTech Vendor Procurement Checklist | `dashboards/edtech-vendor-procurement-checklist.html` | `CATEGORIES` array |
| Tertiary Institution Tech Adoption Index | `dashboards/tertiary-institution-tech-adoption-index.html` | `UNIVERSITIES` array |
| Glossary of EdTech Terms | `dashboards/edtech-glossary-african-context.html` | `TERMS` array |

To edit:
1. Open the file in GitHub or locally
2. Find the data array near the bottom of the file (in the `<script>` block)
3. Edit, add, or remove items
4. Commit and push — GitHub Pages rebuilds in ~1 minute

If you'd like any of these moved to Google Sheets as well, send a note. Each one takes ~15 minutes to convert.

---

## Maintenance summary

| Task | Frequency | Action |
|---|---|---|
| Add new year of fee data | Annually (Q2) | Add row to **Cost of Education sheet** |
| Update inflation figure | Annually | Edit column G in **Cost of Education sheet** |
| Add new tool to directory | Whenever you find one | Add row to **AI Tools sheet** |
| Rotate affiliate links | When you sign new partner deals | Edit column I in **AI Tools sheet** |
| Refresh stats card | When NCC, JAMB, UBEC release new reports | Edit the relevant rows in **Stats Card sheet** |
| Refresh "Last verified update" | Whenever you touch the sheet | Edit row 20 of **Stats Card sheet** (Number column) |
