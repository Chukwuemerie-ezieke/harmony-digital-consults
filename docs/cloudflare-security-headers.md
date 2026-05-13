# Cloudflare Security Headers Setup

GitHub Pages cannot set security response headers ([GitHub Community discussion](https://github.com/orgs/community/discussions/54257)). The solution is to put Cloudflare's free CDN in front of the site and add headers via **Transform Rules**. Roughly 15 minutes of setup, no cost.

## Why this matters
A cybersecurity-selling brand without HSTS, CSP, or X-Frame-Options fails its own pitch. Mozilla Observatory and securityheaders.com both grade the current site **F**. After this setup it becomes **A**.

## Step 1 — Add the domain to Cloudflare (5 min)
1. Sign up at [cloudflare.com](https://www.cloudflare.com) (Free plan is enough).
2. Add `harmonydigitalconsults.com.ng` as a site.
3. Cloudflare scans existing DNS — confirm the GitHub Pages `A` records (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) and the `CNAME` for `www` are all **proxied** (orange cloud ON).
4. At your domain registrar, change nameservers to the two Cloudflare provided. Propagation: 1–24 hours.
5. Wait for Cloudflare dashboard to show "Active" before continuing.

## Step 2 — Force HTTPS (1 min)
- **SSL/TLS → Overview** → set to **Full**.
- **SSL/TLS → Edge Certificates** → enable **Always Use HTTPS**, **Automatic HTTPS Rewrites**, **Opportunistic Encryption**.

## Step 3 — Add security headers via Transform Rules (8 min)
**Rules → Transform Rules → Modify Response Header → Create rule**

- Name: `Security Headers`
- When incoming requests match: `Hostname equals harmonydigitalconsults.com.ng` (or "All incoming requests")

Add these header operations (Set):

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |
| `Content-Security-Policy` | See below |

CSP value (single line):
```
default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://www.google-analytics.com; connect-src 'self' https://www.google-analytics.com https://docs.google.com; frame-ancestors 'self'
```

Save and deploy. Test at [securityheaders.com](https://securityheaders.com/?q=harmonydigitalconsults.com.ng) — target grade: **A**.

## Step 4 — Brotli + Auto Minify (1 min)
- **Speed → Optimization → Content Optimization** → enable **Brotli**.
- **Speed → Optimization → Auto Minify** → tick HTML, CSS, JS.

## Step 5 — HSTS preload (optional, after 30 days)
Once HSTS has been live and stable for 30+ days, submit at [hstspreload.org](https://hstspreload.org) to bake the domain into browsers permanently.

## CSP troubleshooting
If anything breaks after enabling CSP, check the browser console for `Refused to load` messages and add the blocked origin to the relevant directive. The CSP above is configured for current dependencies (Google Fonts, GA4, Sheets CMS via `docs.google.com`).

---
Maintained by Harmony Digital Consults Ltd.
