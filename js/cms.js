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
      .slice(0, 3);

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
  function renderPublications(data) {
    const container = document.querySelector('.publications-grid');
    if (!container) return;

    const published = data
      .filter(item => (item.status || '').toLowerCase() === 'published')
      .sort((a, b) => parseInt(a.order || 0) - parseInt(b.order || 0));

    if (published.length === 0) return;

    container.innerHTML = published.map((pub, i) => {
      const delayClass = `reveal-delay-${(i % 2) + 1}`;
      const features = (pub.features || '').split('|').map(f => f.trim()).filter(Boolean);
      const badgeClass = i === 0 ? '' : ' pub-card__badge--accent';
      return `
        <div class="pub-card pub-card--large reveal ${delayClass}">
          ${pub.badge ? `<div class="pub-card__badge${badgeClass}">
            <i data-lucide="${i === 0 ? 'sparkles' : 'award'}"></i>
            ${escapeHtml(pub.badge)}
          </div>` : ''}
          <h3 class="pub-card__title">${escapeHtml(pub.title)}</h3>
          <p class="pub-card__desc">${escapeHtml(pub.description)}</p>
          ${features.length > 0 ? `
          <div class="pub-card__features">
            ${features.map(f => `
              <div class="pub-card__feature">
                <i data-lucide="check-circle"></i>
                <span>${escapeHtml(f)}</span>
              </div>
            `).join('')}
          </div>` : ''}
          <div class="pub-card__meta">
            ${pub.page_count ? `<span class="pub-card__meta-item">${escapeHtml(pub.page_count)} Pages</span>` : ''}
            ${pub.word_count ? `<span class="pub-card__meta-item">${escapeHtml(pub.word_count)} Words</span>` : ''}
            <span class="pub-card__meta-item">2026</span>
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
