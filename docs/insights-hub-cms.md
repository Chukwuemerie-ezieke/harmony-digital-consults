# Insights Hub — Maintenance & CMS Guide

This document explains how to add, update, or retire dashboards in the Harmony Digital Consults Insights Hub.

## 1. Structure

```
/insights/
  index.html              ← Hub landing page (loads dashboards.json)
  data/
    dashboards.json       ← Single source of truth for the registry
/dashboards/
  <slug>.html             ← One file per dashboard
/docs/
  insights-hub-cms.md     ← This guide
```

The hub landing page reads `/insights/data/dashboards.json` on each visit and renders cards dynamically. To add a dashboard, you only need to (a) drop a new HTML file in `/dashboards/`, (b) add one entry to the JSON, and (c) update the sitemap.

## 2. Add a new dashboard (5–30 minutes)

### Step 1 — Create the dashboard HTML
Copy `/dashboards/nigeria-digital-skills-gap.html` as a starting template. Update:
- `<title>` and `<meta>` tags (description, keywords, canonical, OG, Twitter)
- Breadcrumb in the hero section
- KPI tiles, charts, and CTA copy
- Sources block at the bottom

### Step 2 — Register it
Open `/insights/data/dashboards.json` and append one entry to the `dashboards` array:

```json
{
  "id": "your-slug",
  "title": "Your Dashboard Title",
  "slug": "your-slug",
  "url": "/dashboards/your-slug.html",
  "summary": "One-paragraph plain-English summary (1–2 sentences).",
  "category": "Research & Advocacy | Tools & Recommenders | Market Intelligence",
  "tags": ["Tag1", "Tag2"],
  "audience": ["Who it's for"],
  "data_sources": ["Source 1", "Source 2"],
  "update_cadence": "Quarterly | Bi-monthly | Monthly",
  "last_updated": "YYYY-MM-DD",
  "lead_author": "Harmony Digital Consults Team",
  "featured": true,
  "cta": { "label": "CTA Button Text", "url": "/contact.html" }
}
```

### Step 3 — Update sitemap.xml
Add to `/sitemap.xml`:

```xml
<url>
  <loc>https://harmonydigitalconsults.com.ng/dashboards/your-slug.html</loc>
  <lastmod>YYYY-MM-DD</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

### Step 4 — Submit to Google Search Console
- Open Google Search Console → URL inspection → paste the new URL → "Request indexing"
- Also re-submit the sitemap so all new URLs are crawled.

### Step 5 — Promote
- LinkedIn post tagging relevant agencies (NITDA, FME, donor partners)
- WhatsApp Status / Business broadcast
- Email to existing clients and the Harmony newsletter list
- Pitch the comms team of any agency referenced in the dashboard

## 3. Google Sheets as CMS (optional)

If you want non-developers to update dashboard data, follow this pattern:

1. Create a Google Sheet with one tab per chart (e.g. `sector-demand`, `regional-spread`).
2. File → Share → Publish to web → CSV → copy the published URL.
3. In the dashboard `<script>`, replace the static array with a fetch:

```js
const SHEET_CSV = 'https://docs.google.com/spreadsheets/d/.../pub?gid=0&single=true&output=csv';
const rows = await fetch(SHEET_CSV).then(r => r.text());
// parse CSV with PapaParse or split by lines
```

4. Non-technical staff now edit the sheet — dashboards refresh automatically on the next visitor load (or after the sheet's publish cache expires, typically 5 minutes).

## 4. Update cadence (Quality SOP)

| Dashboard | Cadence | Owner | Approx. time |
|-----------|---------|-------|--------------|
| Nigeria Digital Skills Gap | Quarterly | Research Team | 15 min |
| E-Learning Platform Comparison | Bi-monthly | Advisory Team | 30 min |
| Nigeria vs. Kenya EdTech | Quarterly | Market Intelligence Desk | 30 min |

Set Google Alerts for the key source terms (e.g. "NITDA digital skills", "Briter Bridges EdTech") and review weekly.

## 5. Retire a dashboard

1. Remove the entry from `dashboards.json`.
2. Replace the dashboard HTML body with a 301 redirect notice or delete it (Google will drop it after re-crawl).
3. Remove the URL from `sitemap.xml`.

## 6. Affiliate / sponsored links

- Always include the `rel="noopener sponsored"` attribute on affiliate outbound links.
- Always show the affiliate disclosure block at the bottom of any dashboard with affiliate links.
- Track outbound clicks via a query parameter (`?ref=harmonydigital`) and Google Analytics events.

---

Maintained by Harmony Digital Consults Ltd · Last updated: 11 May 2026
