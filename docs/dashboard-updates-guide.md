# How to Update Insights Dashboards

Last updated: 14 May 2026

**All 13 dashboards now read from Google Sheets.** Update any of them with no code, no commit, no push — just edit the sheet and refresh the page.

## Quick reference — all sheets

| # | Dashboard | Sheet | Worksheet tab |
|---|---|---|---|
| 1 | **Cost of Education in Nigeria Tracker** | [Open sheet](https://docs.google.com/spreadsheets/d/1E6tWIv3BLQIfM9oqAqJ8NC_d-IEFpYuYKK070zmuSlM/edit) | `Fees` |
| 2 | **Nigeria Education in 20 Numbers (Stats Card)** | [Open sheet](https://docs.google.com/spreadsheets/d/1FxH4hZXOLLu6GZS1AEJcGou0WjeCNU-uCzUCh7zAvoQ/edit) | `Stats` |
| 3 | **AI Tools for Teachers Directory** | [Open sheet](https://docs.google.com/spreadsheets/d/1leuhgyNtwjTqEdXIG61UHYn4XwGJz5AnDixPONMcn_c/edit) | `Tools` |
| 4 | **WAEC & NECO Pass Rate Dashboard** | [Open sheet](https://docs.google.com/spreadsheets/d/1qWdEp-BXT3vxhEU9S0ckPFVwBpSi_ZaMhhqLnegdWlM/edit) | `Rates` |
| 5 | **E-Learning Platform Comparison** | [Open sheet](https://docs.google.com/spreadsheets/d/1GdWmkN5sPIfQivzkjRzHxUMKHQueqGpe263Nl5VcoaE/edit) | `Platforms` |
| 6 | **Tertiary Institution Tech Adoption Index** | [Open sheet](https://docs.google.com/spreadsheets/d/17BNfHR5o7evWZ9h79DDJc-sYB76uweU-yb3xVcSOmq4/edit) | `Universities` |
| 7 | **Glossary of EdTech Terms (African Context)** | [Open sheet](https://docs.google.com/spreadsheets/d/1bP6HRx_R3jYm8pDa0dLv6KmjtRNTeriwEG_laEqS1m0/edit) | `Terms` |
| 8 | **Teacher Digital Skills Self-Assessment** | [Open sheet](https://docs.google.com/spreadsheets/d/1hFcjF6AXEeRKEj1HYIkaWsH68IjBA-Fi3eWUVFthkrg/edit) | `Skills` |
| 9 | **School ICT Readiness Scorecard** | [Open sheet](https://docs.google.com/spreadsheets/d/1ACAeS45RzCgD7kdIJMv0qJ8k1nb56PiWAgxookhZF1Q/edit) | `Questions` |
| 10 | **EdTech Vendor Procurement Checklist** | [Open sheet](https://docs.google.com/spreadsheets/d/1herYE7kKsejDDd6bVtzn6jhaxMWgvRHoUfPy7Q7DoVY/edit) | `Items` |
| 11 | **Nigeria Digital Skills Gap** | [Open sheet](https://docs.google.com/spreadsheets/d/1B2Rcw812BQWD8UbS0pBIy37SrqVEZXvErKnU019ZEvA/edit) | `Sectors` |
| 12 | **Out-of-School Children in Nigeria** | [Open sheet](https://docs.google.com/spreadsheets/d/1aftdpUGdEicGHbrnIYnkLBLt4zHgkrh2nQsPVDjnB6Q/edit) | `Data` |
| 13 | **Nigeria vs. Kenya EdTech** | [Open sheet](https://docs.google.com/spreadsheets/d/1AIB-1HoLhtSiVRulF1ZYZS5IhrtzC8Yfy7qqVFn2ENg/edit) | `Metrics` |

---

## ONE-TIME SETUP (do this first for the 10 new sheets)

The first 3 sheets are already shared. For sheets **4 through 13**, you must change sharing to "Anyone with the link can view" — otherwise the dashboards can't read them and they'll keep showing built-in fallback data.

For each sheet:

1. Open the sheet
2. Click the green **Share** button (top-right)
3. Under "General access", change `Restricted` → `Anyone with the link`
4. Make sure the role is **Viewer** (not Editor)
5. Click **Done**

Once done, the dashboards start showing live sheet data on the next page refresh.

---

## Dashboard 1: Cost of Education Tracker

**Sheet:** [Cost of Education sheet](https://docs.google.com/spreadsheets/d/1E6tWIv3BLQIfM9oqAqJ8NC_d-IEFpYuYKK070zmuSlM/edit) · **Tab:** `Fees`

| Column | Meaning | Example |
|---|---|---|
| A — Year | Calendar year | 2025 |
| B — Public K-12 per term (NGN) | Levies, uniform, PTA contributions | 14000 |
| C — Private K-12 per term (NGN) | Mid-tier urban schools median | 320000 |
| D — Federal University per session | Median across federal unis | 45000 |
| E — State University per session | Median across state unis | 400000 |
| F — Private University per session | Median across private unis | 2800000 |
| G — Inflation % | Annual headline inflation (NBS CPI) | 23.5 |

**To add a new year:** add a row below 2025 with the 7 values. **To revise a year:** edit cells in place.

---

## Dashboard 2: Nigeria Education in 20 Numbers (Stats Card)

**Sheet:** [Stats Card sheet](https://docs.google.com/spreadsheets/d/1FxH4hZXOLLu6GZS1AEJcGou0WjeCNU-uCzUCh7zAvoQ/edit) · **Tab:** `Stats`

| Column | Meaning |
|---|---|
| A — Order | Display order (1, 2, 3 …) |
| B — Number | The big statistic (e.g. `309`, `44.4%`, `18.3M`) |
| C — Label | Short description |
| D — Source | Attribution (e.g. `NUC · 2025`) |
| E — Style | One of: `plain`, `dark`, `accent` |

**Style rules:** `plain` (white tile, teal number — ~75% of stats), `dark` (teal background, white number — headline stats), `accent` (light amber, rust number — warnings). Aim for ~12 plain, 5 dark, 3 accent.

The dashboard works with any number of stats but is visually designed for 20 (4 × 5).

---

## Dashboard 3: AI Tools for Teachers Directory

**Sheet:** [AI Tools sheet](https://docs.google.com/spreadsheets/d/1leuhgyNtwjTqEdXIG61UHYn4XwGJz5AnDixPONMcn_c/edit) · **Tab:** `Tools`

| Column | Meaning |
|---|---|
| A — Name | Tool name |
| B — Category | Free-text — builds the filter dropdown |
| C — Score (1-5) | Classroom-usefulness rating |
| D — Budget | `free`, `freemium`, or `paid` (lowercase) |
| E — Level | `primary`, `secondary`, `tertiary`, or `all` (lowercase) |
| F — Price | Free-text price summary |
| G — Description | 1-2 sentence description |
| H — Use Case | One concrete classroom example |
| I — URL | Homepage — paste affiliate links here |

---

## Dashboard 4: WAEC & NECO Pass Rate Dashboard

**Sheet:** [Pass Rates sheet](https://docs.google.com/spreadsheets/d/1qWdEp-BXT3vxhEU9S0ckPFVwBpSi_ZaMhhqLnegdWlM/edit) · **Tab:** `Rates`

| Column | Meaning |
|---|---|
| A — Year | Calendar year |
| B — WAEC % | WAEC credit-pass rate (5+ credits incl. English & Math) |
| C — NECO % | NECO credit-pass rate (same criteria) |

**To add a new year:** add a row. The line charts and table update automatically.

---

## Dashboard 5: E-Learning Platform Comparison

**Sheet:** [Platforms sheet](https://docs.google.com/spreadsheets/d/1GdWmkN5sPIfQivzkjRzHxUMKHQueqGpe263Nl5VcoaE/edit) · **Tab:** `Platforms`

| Column | Meaning |
|---|---|
| A — Name | Platform name |
| B — Category | Free-text category (builds filter chips) |
| C — Pricing | Free-text price summary |
| D — Best For | Short description of ideal use case |
| E — Languages | Supported languages (e.g. `English, Hausa, Yoruba`) |
| F — Offline | `yes` or `no` |
| G — Certification | `yes` or `no` |
| H — Mobile App | `yes` or `no` |
| I — Local Content | Notes on Nigeria/Africa content |
| J — URL | Platform homepage |

---

## Dashboard 6: Tertiary Institution Tech Adoption Index

**Sheet:** [Universities sheet](https://docs.google.com/spreadsheets/d/17BNfHR5o7evWZ9h79DDJc-sYB76uweU-yb3xVcSOmq4/edit) · **Tab:** `Universities`

| Column | Meaning |
|---|---|
| A — Name | Institution name |
| B — Type | `Federal`, `State`, or `Private` |
| C — Region | Geopolitical zone (e.g. `South West`) |
| D — LMS | LMS adoption score (0-10) |
| E — Online Exams | Online exams score (0-10) |
| F — Digital Library | Digital library score (0-10) |
| G — Free Wi-Fi | Free Wi-Fi score (0-10) |
| H — Online Reg | Online registration score (0-10) |
| I — E-Lectures | E-lectures / hybrid teaching score (0-10) |

The composite index is calculated from the 6 sub-scores automatically.

---

## Dashboard 7: Glossary of EdTech Terms

**Sheet:** [Glossary sheet](https://docs.google.com/spreadsheets/d/1bP6HRx_R3jYm8pDa0dLv6KmjtRNTeriwEG_laEqS1m0/edit) · **Tab:** `Terms`

| Column | Meaning |
|---|---|
| A — Term | The term being defined |
| B — Short Definition | One-line definition for the card |
| C — Long Definition | Detailed definition shown on expand |
| D — Africa Context | One sentence on relevance/example in African schools |
| E — Tags | Comma-separated tags (e.g. `policy, infrastructure`) |

**To add a term:** add a row. The A-Z index and search both update automatically.

---

## Dashboard 8: Teacher Digital Skills Self-Assessment

**Sheet:** [Skills sheet](https://docs.google.com/spreadsheets/d/1hFcjF6AXEeRKEj1HYIkaWsH68IjBA-Fi3eWUVFthkrg/edit) · **Tab:** `Skills`

| Column | Meaning |
|---|---|
| A — Competency | Skill area name |
| B — Description | Short description shown under the heading |
| C — Question 1 | First self-rating question (1-5 scale) |
| D — Question 2 | Second self-rating question |
| E — Question 3 | Third self-rating question |
| F — Resource | Recommended resource link or title for low scorers |

---

## Dashboard 9: School ICT Readiness Scorecard

**Sheet:** [Scorecard sheet](https://docs.google.com/spreadsheets/d/1ACAeS45RzCgD7kdIJMv0qJ8k1nb56PiWAgxookhZF1Q/edit) · **Tab:** `Questions`

| Column | Meaning |
|---|---|
| A — Category | Question category (e.g. `Infrastructure`, `Teacher Capacity`) |
| B — Question | The yes/no/partial question |
| C — Weight | Weight in the final score (1-3) |
| D — Guidance | Help text shown to the respondent |

---

## Dashboard 10: EdTech Vendor Procurement Checklist

**Sheet:** [Checklist sheet](https://docs.google.com/spreadsheets/d/1herYE7kKsejDDd6bVtzn6jhaxMWgvRHoUfPy7Q7DoVY/edit) · **Tab:** `Items`

| Column | Meaning |
|---|---|
| A — Category | Procurement category (e.g. `Technical`, `Commercial`, `Legal`) |
| B — Item | The check item / question |
| C — Why It Matters | Short explanation for the buyer |
| D — Red Flag | What a bad answer looks like |

---

## Dashboard 11: Nigeria Digital Skills Gap

**Sheet:** [Skills Gap sheet](https://docs.google.com/spreadsheets/d/1B2Rcw812BQWD8UbS0pBIy37SrqVEZXvErKnU019ZEvA/edit) · **Tab:** `Sectors`

This sheet uses a **union-row layout** — each row holds slices of multiple datasets. Empty cells are skipped.

| Column | Meaning |
|---|---|
| A — Sector | Sector name (e.g. `Banking`, `Telecoms`) |
| B — Demand Index | 0-100 demand score |
| C — Supply Index | 0-100 supply score |
| D — Skill | Specific skill name (e.g. `Data Analysis`, `Cybersecurity`) |
| E — Gap % | Gap percentage for that skill |
| F — Year | Year for the timeline (e.g. 2021, 2022 …) |
| G — Gap Score | Overall gap score for that year |

Add rows as you collect new data — fill only the columns relevant to the chart you're updating.

---

## Dashboard 12: Out-of-School Children in Nigeria

**Sheet:** [OOS sheet](https://docs.google.com/spreadsheets/d/1aftdpUGdEicGHbrnIYnkLBLt4zHgkrh2nQsPVDjnB6Q/edit) · **Tab:** `Data`

Union-row layout — each row holds slices of multiple charts:

| Column | Meaning |
|---|---|
| A — State | Nigerian state |
| B — Percent_Out | % of children 6-15 out of school |
| C — Age_Group | `Primary age` or `Secondary age` |
| D — Age_Millions | Millions of children in that age group |
| E — Region | Geopolitical zone |
| F — Region_Share_Percent | Region's share of total OOS (%) |
| G — Country | Country name (for global context) |
| H — Country_Millions | OOS millions in that country |

---

## Dashboard 13: Nigeria vs. Kenya EdTech

**Sheet:** [NG vs KE sheet](https://docs.google.com/spreadsheets/d/1AIB-1HoLhtSiVRulF1ZYZS5IhrtzC8Yfy7qqVFn2ENg/edit) · **Tab:** `Metrics`

Union-row layout — each row holds slices of 4 charts:

| Column | Meaning |
|---|---|
| A — Year | Year for funding trend |
| B — Funding_NG_USDm | Nigeria EdTech funding (USD millions) |
| C — Funding_KE_USDm | Kenya EdTech funding (USD millions) |
| D — Subsector | Subsector name (e.g. `K-12 Content`) |
| E — Subsector_NG_Pct | NG share of subsector (%) |
| F — Subsector_KE_Pct | KE share of subsector (%) |
| G — Reach_Indicator | Reach metric (e.g. `Internet %`) |
| H — Reach_NG | NG value |
| I — Reach_KE | KE value |
| J — Spend_Metric | Spend metric label |
| K — Spend_NG | NG value |
| L — Spend_KE | KE value |

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

Each dashboard ships with a built-in fallback copy of the current data, embedded in the HTML. If the gviz fetch fails for any reason (sheet deleted, sharing reverted, Google outage, typo in a row), visitors still see a complete dashboard — just with the values from the last code deploy.

You'll see a console warning in the browser developer tools if the sheet fetch fails. Visitors won't see any error.

---

## Maintenance summary

| Task | Frequency | Action |
|---|---|---|
| Add new year of fee data | Annually (Q2) | Add row to **Cost of Education sheet** |
| Update inflation figure | Annually | Edit column G in **Cost of Education sheet** |
| Add new tool to AI directory | Whenever you find one | Add row to **AI Tools sheet** |
| Rotate affiliate links | When you sign new partner deals | Edit column I in **AI Tools sheet** |
| Refresh stats card | When NCC, JAMB, UBEC release reports | Edit relevant rows in **Stats Card sheet** |
| Add new WAEC/NECO year | Annually (Aug–Sept) | Add row to **Pass Rates sheet** |
| Refresh platform pricing | Quarterly | Update price/feature cells in **Platforms sheet** |
| Update tertiary index scores | Annually | Edit scores in **Universities sheet** |
| Add new glossary term | As terminology emerges | Add row to **Glossary sheet** |
| Update OOS data | When UNESCO/UBEC publish new figures | Edit rows in **OOS sheet** |
| Refresh NG vs Kenya funding | Annually | Add new year row to **NG vs KE sheet** |
