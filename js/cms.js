/* ==========================================================================
   Harmony Digital Consults — Google Sheets CMS Module v1.0
   Fetches content from a published Google Sheet and overwrites static HTML.
   Static HTML serves as fallback if the Sheet is unavailable.
   ========================================================================== */

(function () {
  'use strict';

  // ===== Configuration =====
  const CMS_SPREADSHEET_ID = '194Dk1gM2hd-BaqwQXMSTm6hx53-fgijsGmAqwoNwc54';

  function getCsvUrl(sheetName) {
    return `https://docs.google.com/spreadsheets/d/${CMS_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  }

  // ===== CSV Parser =====
  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (line[i] === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += line[i];
      }
    }
    result.push(current);
    return result;
  }

  function parseCsv(csv) {
    const lines = csv.split('\n');
    if (lines.length < 2) return [];
    const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = parseCSVLine(line);
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = (values[i] || '').replace(/^"|"$/g, '').trim();
        });
        return obj;
      });
  }

  async function fetchSheet(sheetName) {
    try {
      const res = await fetch(getCsvUrl(sheetName));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const csv = await res.text();
      return parseCsv(csv);
    } catch (e) {
      console.warn('CMS fetch failed for "' + sheetName + '", using static fallback:', e);
      return null;
    }
  }

  // ===== Icon map for products (Lucide icon names) =====
  function getLucideIcon(iconName) {
    // Return a data-lucide attribute string; Lucide will render it
    return `<i data-lucide="${iconName || 'box'}"></i>`;
  }

  // ===== Renderers =====

  // --- Products Page ---
  function renderProducts(data) {
    const container = document.querySelector('.products-grid');
    if (!container) return;

    const published = data
      .filter(item => (item.status || '').toLowerCase() === 'published')
      .sort((a, b) => parseInt(a.order || 0) - parseInt(b.order || 0));

    if (published.length === 0) return; // Keep static fallback

    container.innerHTML = published.map((product, i) => {
      const tags = (product.tags || '').split(',').map(t => t.trim()).filter(Boolean);
      const delayClass = `reveal-delay-${(i % 3) + 1}`;
      return `
        <div class="product-card product-card--featured reveal ${delayClass}">
          <div class="product-card__icon-wrap">
            ${getLucideIcon(product.icon)}
          </div>
          <h3 class="product-card__name">${escapeHtml(product.name)}</h3>
          <p class="product-card__desc">${escapeHtml(product.description)}</p>
          <div class="product-card__tags">
            ${tags.map(t => `<span class="product-card__tag">${escapeHtml(t)}</span>`).join('')}
          </div>
          <a href="${escapeHtml(product.cta_link || 'contact.html')}" class="product-card__link">${escapeHtml(product.cta_text || 'Request Demo')} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
        </div>
      `;
    }).join('');

    // Re-init Lucide icons and scroll reveal
    reinitUI();
  }

  // --- Homepage Featured Products ---
  function renderFeaturedProducts(data) {
    const container = document.querySelector('.products-grid');
    if (!container) return;

    const published = data
      .filter(item => (item.status || '').toLowerCase() === 'published')
      .sort((a, b) => parseInt(a.order || 0) - parseInt(b.order || 0))
      .slice(0, 6);

    if (published.length === 0) return;

    container.innerHTML = published.map((product, i) => {
      const tags = (product.tags || '').split(',').map(t => t.trim()).filter(Boolean);
      const delayClass = `reveal-delay-${i + 1}`;
      return `
        <div class="product-card reveal ${delayClass}">
          <div class="product-card__icon-wrap">
            ${getLucideIcon(product.icon)}
          </div>
          <h3 class="product-card__name">${escapeHtml(product.name)}</h3>
          <p class="product-card__desc">${escapeHtml(product.description)}</p>
          <div class="product-card__tags">
            ${tags.map(t => `<span class="product-card__tag">${escapeHtml(t)}</span>`).join('')}
          </div>
          <a href="${escapeHtml(product.cta_link || 'contact.html')}" class="product-card__link">${escapeHtml(product.cta_text || 'Request Demo')} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
        </div>
      `;
    }).join('');

    reinitUI();
  }

  // --- Blog Page ---
  function renderBlogCards(data) {
    const container = document.querySelector('.blog-grid');
    if (!container) return;

    const published = data
      .filter(item => (item.status || '').toLowerCase() === 'published')
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    if (published.length === 0) return;

    container.innerHTML = published.map((post, i) => {
      const delayClass = `reveal-delay-${(i % 3) + 1}`;
      const dateStr = post.date ? new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
      return `
        <article class="blog-card reveal ${delayClass}">
          <div class="blog-card__image">
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <polygon points="16,1 29,8.5 29,23.5 16,31 3,23.5 3,8.5" fill="var(--color-primary)"/>
              <path d="M11,11 L11,21 M11,16 L21,16 M21,11 L21,21" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="blog-card__body">
            <div class="blog-card__meta">
              <span class="blog-card__date">${escapeHtml(dateStr)}</span>
              <span class="blog-card__read-time">${escapeHtml(post.read_time || '')} read</span>
            </div>
            <h3 class="blog-card__title">${escapeHtml(post.title)}</h3>
            <p class="blog-card__excerpt">${escapeHtml(post.excerpt)}</p>
            <a href="blog/post.html?slug=${encodeURIComponent(post.slug)}" class="blog-card__link">Read Article <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
          </div>
        </article>
      `;
    }).join('');

    reinitUI();
  }

  // --- Publications Page ---
  // SVG icons used inside ebook card meta items (lightweight, no Lucide dependency)
  const META_ICONS = {
    pages: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    chapters: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    edition: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    parts: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    bonus: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    prompts: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    words: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    templates: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    default: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="7" x2="12" y2="13"/><circle cx="12" cy="16" r="1"/></svg>'
  };

  const BUY_ARROW_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  // Parse "key:label|key:label" → [{ key, label }]
  // Falls back gracefully when only a label is provided.
  function parseMetaItems(raw, fallback) {
    const source = (raw || '').trim();
    if (!source) {
      // Build minimal default meta from page_count + edition
      const defaults = [];
      if (fallback && fallback.page_count) defaults.push({ key: 'pages', label: fallback.page_count + ' Pages' });
      if (fallback && fallback.edition) defaults.push({ key: 'edition', label: fallback.edition });
      return defaults;
    }
    return source.split('|').map(part => {
      const trimmed = part.trim();
      if (!trimmed) return null;
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) return { key: 'default', label: trimmed };
      const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
      let label = trimmed.slice(colonIdx + 1).trim();
      // Numeric-only labels get a friendly suffix matching the key
      if (/^\d[\d,]*$/.test(label)) {
        const niceKey = key.charAt(0).toUpperCase() + key.slice(1);
        label = label + ' ' + niceKey;
      }
      return { key, label };
    }).filter(Boolean);
  }

  function renderPublications(data) {
    // Prefer the actual container used by publications.html
    const container = document.querySelector('.ebooks-list') || document.querySelector('.publications-grid');
    if (!container) return;

    const published = data
      .filter(item => (item.status || '').toLowerCase() === 'published')
      .sort((a, b) => parseInt(a.order || 0) - parseInt(b.order || 0));

    if (published.length === 0) return; // Keep static fallback if any

    container.innerHTML = published.map((pub, i) => {
      const delayClass = `reveal-delay-${(i % 4) + 1}`;
      const badgeType = (pub.badge_type || 'new').toLowerCase().trim();
      const badgeText = pub.badge || '';
      const tags = (pub.tags || '').split(',').map(t => t.trim()).filter(Boolean);
      const metaItems = parseMetaItems(pub.meta_items, pub);
      const cover = pub.cover_image || 'images/logo.png';
      const alt = pub.alt_text || (pub.title + ' cover');
      const url = pub.selar_url || '#';
      const price = pub.price || '';
      const priceOriginal = pub.price_original || '';
      const priceSecondary = pub.price_ngn_secondary || '';
      const savings = pub.savings_label || '';

      return `
        <div class="ebook-card reveal ${delayClass}">
          ${badgeText ? `<span class="ebook-card__badge ebook-card__badge--${escapeHtml(badgeType)}">${escapeHtml(badgeText)}</span>` : ''}
          <div class="ebook-card__cover-wrap">
            <img src="${escapeHtml(cover)}" alt="${escapeHtml(alt)}" class="ebook-card__cover" loading="lazy">
          </div>
          <div class="ebook-card__body">
            <h2 class="ebook-card__title">${escapeHtml(pub.title)}</h2>
            <p class="ebook-card__desc">${escapeHtml(pub.description)}</p>
            ${metaItems.length > 0 ? `
            <div class="ebook-card__meta">
              ${metaItems.map(m => `
                <span class="ebook-card__meta-item">
                  ${META_ICONS[m.key] || META_ICONS.default}
                  ${escapeHtml(m.label)}
                </span>
              `).join('')}
            </div>` : ''}
            ${tags.length > 0 ? `
            <div class="ebook-card__tags">
              ${tags.map(t => `<span class="ebook-card__tag">${escapeHtml(t)}</span>`).join('')}
            </div>` : ''}
            <div class="ebook-card__footer">
              <div class="ebook-card__pricing">
                ${price ? `<span class="ebook-card__price">${escapeHtml(price)}</span>` : ''}
                ${priceOriginal ? `<span class="ebook-card__price-original">${escapeHtml(priceOriginal)}</span>` : ''}
                ${priceSecondary ? `<span class="ebook-card__price-ngn">${escapeHtml(priceSecondary)}</span>` : ''}
                ${savings ? `<span class="ebook-card__savings">${escapeHtml(savings)}</span>` : ''}
              </div>
              <a href="${escapeHtml(url)}" class="ebook-card__buy-btn" target="_blank" rel="noopener noreferrer">
                Buy Now
                ${BUY_ARROW_SVG}
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');

    reinitUI();
  }

  // ===== Utilities =====
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function reinitUI() {
    // Re-init Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    // Re-observe new reveal elements
    const elements = document.querySelectorAll('.reveal:not(.is-visible)');
    if (elements.length && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      );
      elements.forEach(el => observer.observe(el));
    }
  }

  // ===== Page Detection & Init =====
  function getCurrentPage() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    return path;
  }

  async function initCMS() {
    const page = getCurrentPage();

    switch (page) {
      case 'products.html': {
        const data = await fetchSheet('Products');
        if (data) renderProducts(data);
        break;
      }
      case 'index.html':
      case '': {
        const data = await fetchSheet('Products');
        if (data) renderFeaturedProducts(data);
        break;
      }
      case 'blog.html': {
        const data = await fetchSheet('Blog Posts');
        if (data) renderBlogCards(data);
        break;
      }
      case 'publications.html': {
        const data = await fetchSheet('Publications');
        if (data) renderPublications(data);
        break;
      }
    }
  }

  // ===== Expose fetchSheet globally for dynamic pages =====
  window.fetchSheet = fetchSheet;

  // ===== Start =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCMS);
  } else {
    initCMS();
  }
})();
