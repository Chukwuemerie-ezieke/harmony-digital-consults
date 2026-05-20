# Harmony Digital Consults — Website Documentation

Last updated: 2026-05-20

This document explains how the Harmony Digital Consults website is built, hosted, and maintained. Anyone with editor access to the Google Sheet CMS and write access to the GitHub repo should be able to make day-to-day changes using only this guide.

---

## 1. The 30-second overview

| Layer | What it is | Where it lives |
|---|---|---|
| Code | Static HTML, CSS, vanilla JS | GitHub repo `Chukwuemerie-ezieke/harmony-digital-consults` (branch `main`) |
| Hosting | GitHub Pages | `harmonydigitalconsults.com.ng` (custom domain via `CNAME`) |
| Content (CMS) | Google Sheets fetched as CSV at page load | Spreadsheet `Harmony Digital CMS` (ID `194Dk1gM2hd-BaqwQXMSTm6hx53-fgijsGmAqwoNwc54`) |
| Forms | Google Forms (contact + leads) | Linked to a "Form Responses" tab in the CMS sheet |
| Selling | Selar.com (one product per ebook) | Each Publications row stores its `selar_url` |
| Analytics | Google tag (gtag.js) | Tag ID `G-4B2KCDEWER`, embedded in every page |
| Admin editor | In-browser editor for the CMS sheet | `harmonydigitalconsults.com.ng/admin/editor.html` |

**No backend, no database, no build step.** Edits to the Google Sheet are visible on the live site within seconds. Edits to HTML/CSS/JS go live within ~1 minute of pushing to `main` (GitHub Pages rebuild).

---

## 2. Repository layout

```
harmony-digital-consults/
├── CNAME                       # Custom domain (harmonydigitalconsults.com.ng)
├── index.html                  # Homepage
├── about.html
├── products.html
├── services.html
├── process.html
├── publications.html           # Ebook catalog (CMS-driven)
├── blog.html                   # Blog index (CMS-driven)
├── contact.html
├── 404.html
├── sitemap.xml
├── robots.txt
│
├── courses/                    # Course landing pages (one HTML file per course)
│   └── index.html
├── insights/                   # Insight articles (static HTML, one per article)
│   └── index.html
├── blog/
│   └── post.html               # Single-blog-post template (loads ?slug=... from CMS)
├── products/                   # Product detail pages
├── services/                   # Service detail pages
├── dashboards/                 # Interactive dashboards / mini-apps
├── learn/                      # Learning resources
├── docs/                       # This documentation lives here
│
├── admin/
│   └── editor.html             # In-browser CMS editor (writes to Google Sheets)
│
├── css/
│   └── style.css               # Single global stylesheet
├── js/
│   ├── cms.js                  # Google Sheets CMS module (THE most important JS file)
│   ├── config.js               # Page-level config / feature flags
│   ├── main.js                 # Theme toggle, mobile nav, scroll reveal, common UI
│   ├── ng-states-lgas.js       # Nigerian states + LGAs dataset (used by forms)
│   └── vendor/
│       └── lucide.min.js       # Icon library
├── images/                     # All static images (logos, ebook covers, OG cards)
│
└── *.html                      # Misc landing pages: harmonyshield.html, eduplanner.html,
                                # edutrack-nigeria.html, exam-prep.html, docbridge.html,
                                # acif.html, school-readiness.html, ai-in-education-program.html,
                                # career-guidance.html, timegrid.html
```

### Key conventions

- All pages link the same `css/style.css` and `js/main.js`.
- All pages include the same Google Analytics snippet.
- Pages that need dynamic content (`publications.html`, `blog.html`, `products.html`, homepage) also include `js/cms.js`.
- Image filenames use kebab-case and follow the pattern `<slug>-cover.png` for ebooks, `<slug>.png` for everything else.

---

## 3. Hosting and deployment

### How it ships

1. Push a commit to `main` on GitHub.
2. GitHub Pages automatically rebuilds (usually within 30–90 seconds).
3. The custom domain `harmonydigitalconsults.com.ng` serves the latest commit. The `CNAME` file in the repo root tells GitHub Pages which domain to serve.

### DNS

- Domain: `harmonydigitalconsults.com.ng`
- Registrar/DNS: HostAfrica
- A records point to GitHub Pages IPs (`185.199.108-111.153`).
- `www.harmonydigitalconsults.com.ng` is a CNAME to `chukwuemerie-ezieke.github.io`.

### SSL

GitHub Pages issues and renews a Let's Encrypt certificate automatically for the custom domain. Don't toggle "Enforce HTTPS" off — it stays on.

### Reverting a bad deploy

```bash
git revert <bad-commit-sha>
git push origin main
```

GitHub Pages rebuilds within a minute.

---

## 4. The CMS: Google Sheets as content store

### Why this design

- No server. No CMS license. No build pipeline.
- Anyone with editor access to the sheet can update content from a phone.
- Static HTML in the repo serves as a fallback if the sheet is ever unreachable.

### The CMS spreadsheet

- **Name:** `Harmony Digital CMS`
- **ID:** `194Dk1gM2hd-BaqwQXMSTm6hx53-fgijsGmAqwoNwc54`
- **URL:** [Open in Google Sheets](https://docs.google.com/spreadsheets/d/194Dk1gM2hd-BaqwQXMSTm6hx53-fgijsGmAqwoNwc54)

The sheet must be set to **"Anyone with the link can view"** for `cms.js` to fetch it. Editing remains restricted to whoever you grant edit access.

### Tabs

| Tab name | Used by page | What it controls |
|---|---|---|
| `Products` | `index.html`, `products.html` | Cards on the homepage + Products page |
| `Blog Posts` | `blog.html`, `blog/post.html` | Blog index + individual post bodies |
| `Publications` | `publications.html` | Ebook catalog |
| `Form Responses 1` | (read-only output) | Contact form submissions (Google Forms appends here) |

### Adding a tab

If you add a new tab, you also need to add a `case` to the `switch` block at the bottom of `js/cms.js` mapping the tab name to a renderer function.

---

## 5. How `js/cms.js` works

`js/cms.js` is the heart of the CMS. It runs on every page that loads it.

### Flow

1. On `DOMContentLoaded`, detect the current page filename (e.g. `publications.html`).
2. Build the Sheets CSV URL: `https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=<TabName>`
3. `fetch()` the CSV. If it fails (offline, sheet deleted, network error) → fail silently and leave the static HTML in place.
4. Parse the CSV (custom parser handles quoted commas and escaped quotes).
5. Pick a renderer based on the current page and pass it the row objects.
6. The renderer finds the container element (e.g. `.ebooks-list`) and rewrites its `innerHTML`.
7. After rewriting, call `reinitUI()` to re-bind Lucide icons and scroll-reveal observers.

### Why the fallback matters

If you delete the spreadsheet or break the sheet structure, the live site does NOT break — visitors see whatever static markup was committed to `publications.html`, `blog.html`, etc. Always keep the static fallback in sync with the latest published state as a safety net.

### Adding a new renderer

```js
// 1. Add a new case in initCMS():
case 'newpage.html': {
  const data = await fetchSheet('NewTab');
  if (data) renderNewPage(data);
  break;
}

// 2. Add the renderer function:
function renderNewPage(data) {
  const container = document.querySelector('.new-grid');
  if (!container) return;
  const published = data
    .filter(item => (item.status || '').toLowerCase() === 'published')
    .sort((a, b) => parseInt(a.order || 0) - parseInt(b.order || 0));
  if (published.length === 0) return;
  container.innerHTML = published.map(item => `
    <div class="new-card">${escapeHtml(item.title)}</div>
  `).join('');
  reinitUI();
}
```

---

## 6. Publications (ebooks) — full schema

The `Publications` tab drives the ebook catalog on `publications.html`. Every column is read by `renderPublications()` in `js/cms.js`.

| Column | Header | Required | Example | Notes |
|---|---|---|---|---|
| A | `id` | ✅ | `from-chalk-to-clicks` | Kebab-case, unique. Used for analytics and future deep links. |
| B | `title` | ✅ | `From Chalk to Clicks: ...` | Full title shown as `<h2>`. |
| C | `description` | ✅ | `A beginner-friendly companion...` | One-paragraph card description. |
| D | `features` | optional | `252 pages \| Beginner Friendly` | Legacy field, currently unused by renderer but kept for reference. |
| E | `badge` | optional | `NEW` | Badge text shown top-right of card. Leave empty for no badge. |
| F | `page_count` | optional | `252` | Used as fallback if `meta_items` is empty. |
| G | `word_count` | optional | `70602` | Currently informational only. |
| H | `status` | ✅ | `published` | Only `published` rows render. Use `draft` to hide. |
| I | `order` | ✅ | `6` | Sort order ascending. Lower numbers appear first. |
| J | `selar_url` | ✅ | `https://selar.com/t7129815th` | Buy Now button destination. |
| K | `cover_image` | ✅ | `images/from-chalk-to-clicks-cover.png` | Relative path to a PNG in `/images/`. |
| L | `alt_text` | optional | `From Chalk to Clicks cover` | Image alt text. Falls back to title if empty. |
| M | `badge_type` | optional | `new` | One of: `new`, `bestseller`, `featured`, `popular`. Controls badge color. |
| N | `tags` | optional | `Teachers, Digital Skills, Beginner Friendly` | Comma-separated. Each becomes a chip. |
| O | `meta_items` | optional | `pages:252\|chapters:14\|edition:2026 Edition` | Pipe-separated `key:label` pairs. See below. |
| P | `price` | ✅ | `₦4,900` or `$2.58` | Main displayed price. Include currency symbol. |
| Q | `price_original` | optional | `₦10,000` | Strikethrough price. |
| R | `price_ngn_secondary` | optional | `($3.61)` or `(₦3,500)` | Secondary price in another currency. Keep parentheses. |
| S | `savings_label` | optional | `51% OFF` or `LAUNCH` | Orange pill next to price. |
| T | `edition` | optional | `2026 Edition` | Used in default meta when `meta_items` is empty. |

### `meta_items` format

Pipe-separated `key:label` pairs. The key picks the icon; the label is what shows on the chip.

Supported keys (each maps to a specific SVG icon):

- `pages` — book icon
- `chapters` — list icon
- `parts` — star icon
- `prompts` — speech-bubble icon
- `bonus` — star icon
- `words` — list icon
- `templates` — shield icon
- `edition` — calendar icon
- `shield` — shield icon
- anything else → falls back to a generic info icon

**Numeric-only labels get a friendly suffix.** Example: `pages:252` renders as `252 Pages`. Use a non-numeric label like `pages:252 Pages` if you want full control.

**Examples:**
- `pages:252|chapters:14|edition:2026 Edition` → `252 Pages` / `14 Chapters` / `2026 Edition`
- `pages:182|prompts:120|bonus:3 Bonus Materials` → `182 Pages` / `120 Prompts` / `3 Bonus Materials`

### Adding a new ebook

1. Upload the cover image to the repo at `images/<slug>-cover.png`. Recommended size: 600×900px or larger, PNG.
2. Commit and push the image.
3. In the Publications sheet, add a new row at the bottom with all required columns filled in.
4. Refresh `publications.html` — your new ebook appears.

That's it. No code change required.

### Editing prices

Change column P (price), Q (price_original), R (price_ngn_secondary), or S (savings_label) directly in the sheet. Within seconds of saving, refreshing `publications.html` shows the new prices.

**Important:** Selar prices are set in your Selar dashboard. The website prices and Selar prices must be kept in sync manually. Buyers will see whatever Selar charges them, regardless of what the website shows. When you change one, change the other.

### Hiding an ebook

Set column H (status) to anything other than `published` (e.g. `draft`, `archived`). The row stays in the sheet but disappears from the website.

### Reordering

Change column I (order). Lower numbers appear first.

---

## 7. Blog Posts schema

The `Blog Posts` tab drives `blog.html` (index) and `blog/post.html` (individual posts).

| Column | Header | Notes |
|---|---|---|
| `id` | Unique row id |
| `slug` | URL slug. `blog/post.html?slug=<slug>` opens this post. |
| `title` | Post title. |
| `excerpt` | Shown on the blog index card. |
| `content` | Full body. Plain text or HTML. |
| `date` | ISO format (`2026-05-20`) — sorted descending. |
| `read_time` | e.g. `5 min`. |
| `author` | Display name. |
| `status` | Set to `published` to publish. |

---

## 8. Products schema

The `Products` tab drives the cards on the homepage (first 6) and on `products.html` (all).

| Column | Header | Notes |
|---|---|---|
| `name` | Product name. |
| `description` | One-paragraph description. |
| `icon` | A Lucide icon name (e.g. `book`, `shield`, `graduation-cap`). |
| `tags` | Comma-separated chips. |
| `cta_link` | Where the "Request Demo" link goes. Defaults to `contact.html`. |
| `cta_text` | Button text. Defaults to `Request Demo`. |
| `status` | `published` to show. |
| `order` | Ascending sort order. |

---

## 9. Forms

Contact and lead forms are Google Forms. Submissions land in the CMS sheet under `Form Responses 1`.

To create a new form:

1. In the CMS spreadsheet, **Tools → Create a new form**.
2. Build the form in Google Forms.
3. Get the embed URL or pre-filled link.
4. Embed it in the relevant HTML page using an `<iframe>` OR link out to it from a button.

Submission notifications can be turned on in the Google Form: **Responses → ⋮ → Get email notifications for new responses**.

---

## 10. Theming, typography, and global styles

### Brand colors

| Token | Hex | Where it's used |
|---|---|---|
| `--color-primary` | `#01696F` | Teal — buttons, links, ebook prices |
| Dark teal | `#0C4E54` | Hero gradients, headers |
| Gold | `#D4A843` | Accents, cover designs |
| `--color-surface` (dark) | `#1f2937` | Dark-mode card background |
| `--color-text` | `#111827` (light) / `#f9fafb` (dark) | Body text |
| `--color-text-muted` | `#6b7280` (light) / `#9ca3af` (dark) | Secondary text |
| `--color-surface-alt` | `#f3f4f6` | Tag chips, meta badges |
| `--color-border` | `#e5e7eb` | Card borders, footer dividers |

### Typography

- Body / UI font: **Plus Jakarta Sans** (Google Fonts, weights 400/500/600/700/800).
- The font is preconnected and stylesheet-linked from `<head>` on every page.

### Dark mode

`js/main.js` reads/writes `data-theme="dark"` on `<html>`. The theme toggle button in the header switches it. All component styles have a `[data-theme="dark"] .xxx` override defined in `css/style.css` or inline `<style>` blocks where needed.

### Scroll reveal animation

Elements with class `reveal` start hidden and fade in when scrolled into view, via an `IntersectionObserver` set up in `js/main.js` and re-bound by `cms.js` whenever new content is injected. Add `reveal-delay-1` through `reveal-delay-4` to stagger animations.

---

## 11. Admin editor

`admin/editor.html` is an in-browser form for editing the CMS sheet without opening Google Sheets directly. It uses the Google Sheets API on the user's behalf (the user signs in with their Google account).

URL: [`harmonydigitalconsults.com.ng/admin/editor.html`](https://harmonydigitalconsults.com.ng/admin/editor.html)

Use it when:
- You're on mobile and the Google Sheets app is awkward.
- You want guided fields instead of free cell editing.

Always falls back to editing the Google Sheet directly — both paths write to the same underlying cells.

---

## 12. Analytics

Every page loads:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-4B2KCDEWER"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-4B2KCDEWER');
</script>
```

Tag ID: `G-4B2KCDEWER`. Login at [analytics.google.com](https://analytics.google.com) to see traffic.

To add an event:

```js
gtag('event', 'buy_now_click', { ebook_id: 'from-chalk-to-clicks' });
```

---

## 13. Common tasks — cookbook

### Add a new ebook to the catalog

1. Drop cover image into `/images/`. Commit + push.
2. Add a row in the Publications sheet with all required columns.
3. Done. No HTML edit needed.

### Change an ebook price

1. Edit columns P / Q / R / S in the Publications row.
2. Also update the matching price in the Selar dashboard.

### Add a new blog post

1. Add a row in the Blog Posts tab.
2. Set `status` to `published`.
3. Done.

### Add a new product (for homepage and Products page)

1. Add a row in the Products tab.
2. Set `status` to `published` and pick an `order` value.
3. Done.

### Change a phone number / email / address

Search the repo for the old value (case-insensitive). It appears in the footer of every page and in some structured-data blocks. Update all occurrences and push.

### Add a new top-level page

1. Create `newpage.html` in the repo root.
2. Copy the `<head>`, `<header>`, `<nav>`, and `<footer>` from another page (e.g. `about.html`).
3. Add the new page link to the `<nav>` and `<nav class="mobile-nav">` blocks of every existing page (and `404.html`).
4. Add a `<url>` entry to `sitemap.xml`.

### Roll back a bad deploy

```bash
git log --oneline -10            # find the last good commit
git revert <bad-sha>             # creates a new commit that undoes it
git push origin main             # GitHub Pages rebuilds
```

---

## 14. Troubleshooting

**The site is showing old content.**
GitHub Pages cache. Wait 60–120 seconds and hard-refresh (Cmd-Shift-R / Ctrl-Shift-R). The CMS sheet also has its own ~30s edge cache.

**Sheet edits not showing on the site.**
1. Confirm the row's `status` column is `published`.
2. Confirm the spreadsheet is set to "Anyone with the link can view".
3. Open the browser DevTools console and look for "CMS fetch failed" warnings.
4. Visit the CSV URL directly:
   `https://docs.google.com/spreadsheets/d/194Dk1gM2hd-BaqwQXMSTm6hx53-fgijsGmAqwoNwc54/gviz/tq?tqx=out:csv&sheet=Publications`
   If you can see the row in the CSV, the sheet side is fine — it's a renderer issue.

**A page renders without styles.**
The path to `css/style.css` is relative. Pages in subdirectories (e.g. `courses/index.html`) must use `../css/style.css`. Check the `<link rel="stylesheet">`.

**A new ebook card has no cover.**
Confirm the file at `images/<slug>-cover.png` is committed and pushed. Check the exact filename matches the `cover_image` column in the sheet (case-sensitive on GitHub Pages).

**Buy Now button goes to the wrong Selar product.**
Edit column J (`selar_url`) for that row in the Publications sheet.

**Dark mode looks broken on a new card.**
Add a `[data-theme="dark"] .your-class { ... }` override in `css/style.css` or in the page's inline `<style>` block.

---

## 15. Security and access

- **GitHub repo:** Owner-only by default. Add collaborators via Repo Settings → Collaborators.
- **CMS sheet:** Editor access controlled in the Sheet's share dialog. View must remain "Anyone with the link" for `cms.js` to read it.
- **Domain registrar (HostAfrica):** Login credentials stored separately. DNS records should rarely change.
- **Selar:** Each ebook is a Selar product. Selar login controls payouts and customer data.
- **Analytics:** Google account owns the property.

Never commit secrets (API keys, passwords, private tokens) to the repo. The site is fully static and does not need any.

---

## 16. Contacts

- Company: Harmony Digital Consults Ltd
- Address: 13, Stadium Road, Ekwulobia, Anambra State, Nigeria
- Email: info@harmonydigitalconsults.com.ng
- Phone: +234 810 097 8587
- RC Number: 8949899

---

*End of document.*
