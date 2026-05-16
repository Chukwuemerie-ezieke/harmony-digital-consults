/* ================================================
   Harmony Learn — Course delivery engine
   - Token-based access gate (localStorage)
   - Progress tracking per lesson
   - Sidebar / breadcrumb / pager / right-bar
   - Knowledge check grader
   ================================================ */

(function () {
  'use strict';

  // ============================================================
  // 1. COURSE MANIFEST — single source of truth
  // ============================================================
  const COURSE = {
    id: 'classroom-management',
    code: 'HDT-208',
    title: 'Classroom Management with Digital Tools',
    subtitle: 'Harmony Digital Consults — Professional Certificate',
    description: 'Solve the real challenges of running a classroom — attendance, discipline, parent communication, homework, wellbeing — using free digital tools that work in Nigerian schools.',
    duration: '7 units · ~6.5 hours',
    level: 'Beginner to Intermediate',
    path: '/learn/classroom-management/',
    lessons: [
      { slug: 'lesson-1-setting-the-tone', num: 1, title: 'Setting the Tone Digitally', duration: '45 min', desc: 'Build a class charter, routines and rules reinforced with simple digital tools.' },
      { slug: 'lesson-2-attendance', num: 2, title: 'Attendance & Punctuality', duration: '50 min', desc: 'A reliable digital attendance and late-coming workflow with Google Forms and Sheets.' },
      { slug: 'lesson-3-behaviour-rewards', num: 3, title: 'Behaviour Tracking & Rewards', duration: '55 min', desc: 'Use ClassDojo (or its alternatives) to run a fair, transparent points and rewards system.' },
      { slug: 'lesson-4-discipline-escalation', num: 4, title: 'Discipline, Logs & Escalation', duration: '55 min', desc: 'Incident logs, three-strike systems and restorative scripts that protect you and the pupil.' },
      { slug: 'lesson-5-parent-comms', num: 5, title: 'Parent Communication', duration: '55 min', desc: 'WhatsApp Business, email templates, weekly digests — keep parents informed without burning out.' },
      { slug: 'lesson-6-classwork-homework', num: 6, title: 'Classwork & Homework Flow', duration: '55 min', desc: 'Post, collect, mark and return work efficiently with Google Classroom and friends.' },
      { slug: 'lesson-7-wellbeing-safeguarding', num: 7, title: 'Wellbeing, Safeguarding & Screen-Time', duration: '50 min', desc: 'Pastoral systems, safeguarding flags and healthy device use for pupils and staff.' },
      { slug: 'final-assessment', num: 8, title: 'Final Assessment', duration: '20 min', desc: 'End-of-course quiz — 8 questions, 70% to pass.', isAssessment: true }
    ]
  };

  // ============================================================
  // 2. ACCESS TOKENS (replace with real codes after enrolment)
  // ============================================================
  // Each enrolled teacher gets a unique code. To revoke, remove from this list.
  // ACCEPTED PREFIXES:
  //   HDC-CM-XXXXXX     -> classroom management course-only
  //   HDC-BUNDLE-XXXXXX -> full programme (unlocks every Harmony Learn course)
  //   HDC-AI-XXXXXX     -> legacy AI-in-Education codes; we still honour them so existing learners are not locked out
  // Demo / preview codes — always work, even with the sheet unreachable.
  // Real learner codes live in the Google Sheet (see CODES_SHEET_ID below).
  const DEMO_CODES = new Set([
    'HDC-CM-DEMO01',
    'HDC-CM-PREVUE',
    'HDC-BUNDLE-DEMO1',
    'HDC-AI-DEMO01',
    'HDC-AI-PREVUE'
  ]);
  // Accepted prefixes for HDT-208 access (course-only, bundle, and legacy HDT-207 codes).
  const ACCEPTED_PREFIXES = ['HDC-CM-', 'HDC-BUNDLE-', 'HDC-AI-'];
  // Course code this file represents — used when matching the sheet's `course` column.
  const THIS_COURSE = 'HDT-208';

  // Google Sheet that stores live access codes (Phase A — manual entry; Phase B — Paystack will write here automatically).
  // Sheet must be shared "Anyone with the link · Viewer".
  // Columns expected: code, course, learner_name, email, phone, issued_date, expires_date, status, paystack_ref, notes
  const CODES_SHEET_ID = '1P96xJ6P9j4Xdsycny5fGs2wC9NUkejHNJf0JSMTmYzc';
  const CODES_SHEET_GID = '1754233707';
  const CODES_SHEET_URL = `https://docs.google.com/spreadsheets/d/${CODES_SHEET_ID}/gviz/tq?tqx=out:json&gid=${CODES_SHEET_GID}`;

  const STORAGE_KEY = 'hdc-cm-access';
  const PROGRESS_KEY = 'hdc-cm-progress';

  // Google Apps Script web app endpoint that issues + verifies certificates.
  // Source: /admin/apps-script-certificates.gs in this repo.
  // PASTE the deployed Web App URL below (ends in /exec). Leave '' to disable email + register.
  const CERT_API_URL = '';
  // Director signature shown on certificates and verification page.
  const SIGNATORY = 'Mr Chukwuemerie Ezieke';
  const SIGNATORY_TITLE = 'Director';
  // Brand contact (shown on cert footer).
  const BRAND_NAME = 'Harmony Digital Consults';
  const BRAND_EMAIL = 'info@harmonydigitalconsults.com.ng';
  const SITE_BASE = 'https://harmonydigitalconsults.com.ng';

  // ============================================================
  // 3. PUBLIC API exposed for inline script use
  // ============================================================
  window.HarmonyLearn = {
    course: COURSE,
    hasAccess,
    grantAccess,
    grantAccessAsync,
    revokeAccess,
    getProgress,
    markComplete,
    markIncomplete,
    isComplete,
    renderTopbar,
    renderSidebar,
    renderRightbar,
    renderPager,
    renderHero,
    renderUnits,
    initGate,
    initLesson,
    initIndex,
    initAssessment,
    applyLessonOverlay,
    applyIndexOverlay,
    loadSheetOverlay,
    gradeQuiz,
    progressPercent,
    getFinalScore,
    saveFinalScore,
    getLearnerName,
    setLearnerName,
    generateCertificate,
    verifyCertificate,
    issueCertificate
  };

  // ============================================================
  // 4. ACCESS GATE
  // ============================================================
  // Synchronous gate — reads localStorage only (set by a previous successful grant).
  function hasAccess() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      return !!(data && data.code);
    } catch (e) { return false; }
  }

  // Synchronous — only grants for hardcoded demo codes. Used as offline fallback.
  function grantAccess(code) {
    const normalised = (code || '').trim().toUpperCase();
    if (!DEMO_CODES.has(normalised)) return false;
    if (!ACCEPTED_PREFIXES.some(p => normalised.startsWith(p))) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: normalised, since: new Date().toISOString(), source: 'demo' }));
    return true;
  }

  // Async — validates against the Google Sheet (strict mode). Resolves to a result object:
  //   { ok: true, code, learner }                          // access granted
  //   { ok: false, reason: 'format' | 'not_found' | 'revoked' | 'expired' | 'wrong_course' | 'sheet_unreachable' }
  function grantAccessAsync(code) {
    const normalised = (code || '').trim().toUpperCase();
    if (!ACCEPTED_PREFIXES.some(p => normalised.startsWith(p))) {
      return Promise.resolve({ ok: false, reason: 'format' });
    }
    // Demo codes still work offline — short-circuit.
    if (DEMO_CODES.has(normalised)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: normalised, since: new Date().toISOString(), source: 'demo' }));
      return Promise.resolve({ ok: true, code: normalised, learner: 'DEMO' });
    }
    if (!('fetch' in window)) return Promise.resolve({ ok: false, reason: 'sheet_unreachable' });
    return fetch(CODES_SHEET_URL, { credentials: 'omit' })
      .then(r => r.ok ? r.text() : Promise.reject(new Error('http ' + r.status)))
      .then(text => {
        const data = parseGviz(text);
        if (!data || !data.table || !data.table.rows) return { ok: false, reason: 'sheet_unreachable' };
        const cols = (data.table.cols || []).map(c => (c.label || c.id || '').trim().toLowerCase());
        const rows = data.table.rows.map(r => {
          const obj = {};
          (r.c || []).forEach((cell, i) => {
            const key = cols[i] || ('col' + i);
            obj[key] = cell ? (cell.f != null ? cell.f : (cell.v != null ? cell.v : '')) : '';
          });
          return obj;
        });
        const match = rows.find(r => (r.code || '').toString().trim().toUpperCase() === normalised);
        if (!match) return { ok: false, reason: 'not_found' };
        const status = (match.status || '').toString().trim().toLowerCase();
        if (status === 'revoked') return { ok: false, reason: 'revoked' };
        if (status !== 'active') return { ok: false, reason: 'not_found' };
        // Course match — BUNDLE unlocks everything; otherwise must equal THIS_COURSE.
        const courseField = (match.course || '').toString().trim().toUpperCase();
        if (courseField && courseField !== 'BUNDLE' && courseField !== THIS_COURSE) {
          return { ok: false, reason: 'wrong_course' };
        }
        // Expiry check (optional). Accept blank / 'Never' / future date.
        const exp = (match.expires_date || '').toString().trim();
        if (exp && exp.toLowerCase() !== 'never') {
          const d = new Date(exp);
          if (!isNaN(d.getTime()) && d.getTime() < Date.now()) {
            return { ok: false, reason: 'expired' };
          }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          code: normalised,
          since: new Date().toISOString(),
          source: 'sheet',
          learner: match.learner_name || ''
        }));
        return { ok: true, code: normalised, learner: match.learner_name || '' };
      })
      .catch(() => ({ ok: false, reason: 'sheet_unreachable' }));
  }

  function revokeAccess() { localStorage.removeItem(STORAGE_KEY); }

  // ============================================================
  // 4b. CONTENT OVERLAY — Google Sheets CMS (graceful fallback to HTML)
  // ============================================================
  // No sheet wired yet for HDT-208 — silent fallback to HTML.
  // To enable, create a sheet with the same schema as HDT-207 and paste its ID below.
  const SHEET_ID = '';
  const SHEET_GID = '0';
  // Use the gviz JSON endpoint — works on any sheet shared "anyone with link can view".
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;
  const SHEET_CACHE_KEY = 'hdc-cm-sheet-cache';
  const SHEET_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  function readSheetCache() {
    try {
      const raw = localStorage.getItem(SHEET_CACHE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !obj.at || (Date.now() - obj.at) > SHEET_CACHE_TTL_MS) return null;
      return obj.rows || null;
    } catch (e) { return null; }
  }
  function writeSheetCache(rows) {
    try { localStorage.setItem(SHEET_CACHE_KEY, JSON.stringify({ at: Date.now(), rows })); } catch (e) {}
  }

  // Parse Google's gviz response — it wraps JSON in a JS callback wrapper.
  function parseGviz(text) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end < 0) return null;
    try { return JSON.parse(text.substring(start, end + 1)); } catch (e) { return null; }
  }

  function loadSheetOverlay() {
    // Return a promise that resolves to an array of row objects (or [] on failure).
    if (!SHEET_ID) return Promise.resolve([]);
    const cached = readSheetCache();
    if (cached) return Promise.resolve(cached);
    if (!('fetch' in window)) return Promise.resolve([]);
    return fetch(SHEET_URL, { credentials: 'omit' })
      .then(r => r.ok ? r.text() : '')
      .then(text => {
        if (!text) return [];
        const data = parseGviz(text);
        if (!data || !data.table || !data.table.rows) return [];
        const cols = (data.table.cols || []).map(c => (c.label || c.id || '').trim().toLowerCase());
        const rows = data.table.rows.map(r => {
          const obj = {};
          (r.c || []).forEach((cell, i) => {
            const key = cols[i] || ('col' + i);
            obj[key] = cell ? (cell.f != null ? cell.f : cell.v) : '';
            if (obj[key] == null) obj[key] = '';
          });
          return obj;
        });
        writeSheetCache(rows);
        return rows;
      })
      .catch(() => []);
  }

  // Public: apply sheet overlay to a lesson page (renders an optional notice banner).
  function applyLessonOverlay(slug) {
    loadSheetOverlay().then(rows => {
      if (!rows.length) return; // Silent fallback — hardcoded HTML stands.
      const lessonRow = rows.find(r => (r.lesson_slug || '').trim() === slug);
      const globalRow = rows.find(r => (r.lesson_slug || '').trim() === '_global');
      const notices = [];
      if (globalRow && globalRow.notice) notices.push({ text: globalRow.notice, type: globalRow.notice_type || 'info', scope: 'global' });
      if (lessonRow && lessonRow.notice) notices.push({ text: lessonRow.notice, type: lessonRow.notice_type || 'info', scope: 'unit' });
      if (notices.length) renderNoticeBanner(notices);
    });
  }

  function renderNoticeBanner(notices) {
    const main = document.querySelector('.hl-main');
    if (!main) return;
    // Insert just after the breadcrumb / before the eyebrow
    const html = notices.map(n => {
      const color = n.type === 'warn' ? '#b45309' : (n.type === 'success' ? '#15803d' : '#0f172a');
      const bg = n.type === 'warn' ? '#fffbeb' : (n.type === 'success' ? '#f0fdf4' : '#f1f5f9');
      const border = n.type === 'warn' ? '#fcd34d' : (n.type === 'success' ? '#86efac' : '#cbd5e1');
      return `<div class="hl-overlay-notice" data-scope="${n.scope}" style="border:1px solid ${border};background:${bg};color:${color};padding:12px 14px;border-radius:10px;margin:0 0 14px;font-size:0.94rem;line-height:1.45;"><strong style="margin-right:6px;">${n.scope === 'global' ? '📢 Announcement:' : '📌 Unit update:'}</strong>${escapeHtmlSimple(n.text)}</div>`;
    }).join('');
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    const bc = main.querySelector('.hl-breadcrumb');
    if (bc && bc.nextSibling) bc.parentNode.insertBefore(wrap, bc.nextSibling);
    else main.insertBefore(wrap, main.firstChild);
  }

  function escapeHtmlSimple(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  }

  // Public: apply overlay to the course index (override titles/durations + show global notice).
  function applyIndexOverlay() {
    loadSheetOverlay().then(rows => {
      if (!rows.length) return;
      let touched = false;
      rows.forEach(r => {
        const slug = (r.lesson_slug || '').trim();
        if (!slug || slug === '_global') return;
        const lesson = COURSE.lessons.find(l => l.slug === slug);
        if (!lesson) return;
        if (r.title_override && String(r.title_override).trim()) { lesson.title = String(r.title_override).trim(); touched = true; }
        if (r.duration_override && String(r.duration_override).trim()) { lesson.duration = String(r.duration_override).trim(); touched = true; }
      });
      if (touched) {
        const unitsHost = document.querySelector('.hl-units');
        if (unitsHost) unitsHost.outerHTML = renderUnits();
        const sb = document.getElementById('hlSidebarMount');
        if (sb) sb.innerHTML = renderSidebar(null);
      }
      const globalRow = rows.find(r => (r.lesson_slug || '').trim() === '_global');
      if (globalRow && globalRow.notice) renderNoticeBanner([{ text: globalRow.notice, type: globalRow.notice_type || 'info', scope: 'global' }]);
    });
  }

  // ============================================================
  // 5. PROGRESS
  // ============================================================
  function getProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function setProgress(p) { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }
  function markComplete(slug) {
    const p = getProgress();
    p[slug] = { completed: true, at: new Date().toISOString() };
    setProgress(p);
  }
  function markIncomplete(slug) {
    const p = getProgress();
    delete p[slug];
    setProgress(p);
  }
  function isComplete(slug) {
    const p = getProgress();
    return !!(p[slug] && p[slug].completed);
  }
  function progressPercent() {
    const total = COURSE.lessons.length;
    const done = COURSE.lessons.filter(l => isComplete(l.slug)).length;
    return Math.round((done / total) * 100);
  }

  // ============================================================
  // 6. RENDERING
  // ============================================================
  function renderTopbar(currentSlug) {
    const pct = progressPercent();
    return `
      <header class="hl-topbar">
        <button class="hl-menu-toggle" aria-label="Toggle outline" onclick="document.querySelector('.hl-sidebar').classList.toggle('is-open')">
          ☰ <span>Outline</span>
        </button>
        <a class="hl-topbar__brand" href="../../index.html">
          <img src="../../images/logo.png" alt="Harmony">
          <span>Harmony Learn</span>
        </a>
        <div class="hl-topbar__divider"></div>
        <span class="hl-topbar__course">${COURSE.code} · ${COURSE.title}</span>
        <div class="hl-topbar__spacer"></div>
        <div class="hl-topbar__progress" title="${pct}% complete">
          <span>${pct}%</span>
          <div class="hl-progress-bar"><div class="hl-progress-bar__fill" style="width:${pct}%"></div></div>
        </div>
        <button class="hl-topbar__action" onclick="if(confirm('Sign out of the course on this device?')){HarmonyLearn.revokeAccess();location.reload();}">Sign out</button>
      </header>`;
  }

  function renderSidebar(currentSlug) {
    const items = COURSE.lessons.map(l => {
      const completed = isComplete(l.slug);
      const active = l.slug === currentSlug;
      const cls = [
        'hl-toc__link',
        completed ? 'is-completed' : '',
        active ? 'is-active' : ''
      ].filter(Boolean).join(' ');
      return `
        <li class="hl-toc__item">
          <a class="${cls}" href="${l.isAssessment ? '../final-assessment.html' : '../lessons/' + l.slug + '.html'}">
            <span class="hl-toc__check" aria-hidden="true"></span>
            <span class="hl-toc__num">${l.isAssessment ? 'Exam' : 'Unit ' + l.num}</span>
            <span class="hl-toc__title">${l.title}<span class="hl-toc__time">${l.duration}</span></span>
          </a>
        </li>`;
    }).join('');
    return `
      <aside class="hl-sidebar" id="hlSidebar">
        <div class="hl-sidebar__section">
          <p class="hl-sidebar__title">Course</p>
          <h3 class="hl-sidebar__course-title">${COURSE.title}</h3>
          <p class="hl-sidebar__course-meta">${COURSE.duration}</p>
        </div>
        <ul class="hl-toc">${items}</ul>
      </aside>`;
  }

  function renderRightbar(anchors) {
    const items = (anchors || []).map(a => `<li><a href="#${a.id}">${a.title}</a></li>`).join('');
    return `
      <aside class="hl-rightbar">
        <p class="hl-rightbar__title">In this unit</p>
        <ul class="hl-anchors" id="hlAnchors">${items}</ul>
      </aside>`;
  }

  function renderPager(currentSlug, opts) {
    opts = opts || {};
    const idx = COURSE.lessons.findIndex(l => l.slug === currentSlug);
    const prev = idx > 0 ? COURSE.lessons[idx - 1] : null;
    const next = idx >= 0 && idx < COURSE.lessons.length - 1 ? COURSE.lessons[idx + 1] : null;
    const baseRel = opts.fromLessons ? '../lessons/' : './lessons/';

    let html = '<nav class="hl-pager">';
    if (prev) {
      const href = prev.isAssessment ? (opts.fromLessons ? '../final-assessment.html' : './final-assessment.html') : baseRel + prev.slug + '.html';
      html += `<a class="hl-pager__btn" href="${href}">
        <span class="hl-pager__arrow">←</span>
        <span><span class="hl-pager__label">Previous</span><span class="hl-pager__text">${prev.title}</span></span>
      </a>`;
    }
    if (next) {
      const href = next.isAssessment ? (opts.fromLessons ? '../final-assessment.html' : './final-assessment.html') : baseRel + next.slug + '.html';
      html += `<a class="hl-pager__btn hl-pager__btn--next" href="${href}" id="hlNextBtn">
        <span><span class="hl-pager__label">Next</span><span class="hl-pager__text">${next.title}</span></span>
        <span class="hl-pager__arrow">→</span>
      </a>`;
    } else if (idx === COURSE.lessons.length - 1) {
      // Final assessment — no next
    }
    html += '</nav>';
    return html;
  }

  function renderHero() {
    const pct = progressPercent();
    return `
      <section class="hl-hero">
        <span class="hl-hero__eyebrow">${COURSE.code} · Certificate Course</span>
        <h1 class="hl-hero__title">${COURSE.title}</h1>
        <p class="hl-hero__desc">${COURSE.description}</p>
        <div class="hl-hero__stats">
          <span class="hl-hero__stat">📚 ${COURSE.duration}</span>
          <span class="hl-hero__stat">🎯 ${COURSE.level}</span>
          <span class="hl-hero__stat">🇳🇬 Nigerian classroom context</span>
        </div>
        <div class="hl-hero__progress">
          <span>${pct}% complete</span>
          <div class="hl-progress-bar"><div class="hl-progress-bar__fill" style="width:${pct}%"></div></div>
        </div>
      </section>`;
  }

  function renderUnits() {
    return '<div class="hl-units">' + COURSE.lessons.map(l => {
      const completed = isComplete(l.slug);
      const href = l.isAssessment ? './final-assessment.html' : './lessons/' + l.slug + '.html';
      return `
        <a class="hl-unit ${completed ? 'is-completed' : ''}" href="${href}">
          <div class="hl-unit__num"><span class="hl-unit__num-text">${l.isAssessment ? '★' : l.num}</span></div>
          <div class="hl-unit__body">
            <h3 class="hl-unit__title">${l.title}</h3>
            <p class="hl-unit__desc">${l.desc}</p>
            <div class="hl-unit__meta">
              <span>⏱ ${l.duration}</span>
              ${completed ? '<span style="color:var(--hl-success);font-weight:600">✓ Completed</span>' : '<span>Not started</span>'}
            </div>
          </div>
          <div class="hl-unit__arrow">→</div>
        </a>`;
    }).join('') + '</div>';
  }

  // ============================================================
  // 7. QUIZ ENGINE
  // ============================================================
  // Each quiz question DOM structure:
  // <div class="hl-q" data-correct="B"> ... <label class="hl-q__opt"><input type="radio" name="qN" value="A">Option text</label>
  // For multi-select: data-correct="A,C" and use type="checkbox"
  // <div class="hl-q__feedback" data-correct-msg="..." data-wrong-msg="..."></div>
  function gradeQuiz(quizEl) {
    const questions = quizEl.querySelectorAll('.hl-q');
    let correct = 0;
    let total = questions.length;
    questions.forEach((q) => {
      const correctRaw = (q.dataset.correct || '').toUpperCase().split(',').map(s => s.trim()).filter(Boolean);
      const inputs = q.querySelectorAll('input');
      const selected = [];
      inputs.forEach(i => { if (i.checked) selected.push((i.value || '').toUpperCase()); });
      const isRight = selected.length === correctRaw.length && correctRaw.every(c => selected.includes(c));

      // Style options
      inputs.forEach(i => {
        const opt = i.closest('.hl-q__opt');
        const val = (i.value || '').toUpperCase();
        opt.classList.remove('is-correct', 'is-incorrect');
        if (correctRaw.includes(val)) opt.classList.add('is-correct');
        if (i.checked && !correctRaw.includes(val)) opt.classList.add('is-incorrect');
      });

      const fb = q.querySelector('.hl-q__feedback');
      if (fb) {
        fb.classList.add('show');
        if (isRight) {
          fb.classList.add('success'); fb.classList.remove('error');
          fb.textContent = fb.dataset.correctMsg || '✓ Correct.';
        } else {
          fb.classList.add('error'); fb.classList.remove('success');
          fb.textContent = fb.dataset.wrongMsg || ('✗ The correct answer is ' + correctRaw.join(', ') + '.');
        }
      }
      if (isRight) correct++;
    });
    return { correct, total, percent: Math.round((correct / total) * 100) };
  }

  // ============================================================
  // 8. PAGE INITIALISERS
  // ============================================================
  function initGate(returnTo) {
    if (hasAccess()) {
      window.location.replace(returnTo || './index.html');
      return;
    }
    const form = document.getElementById('hlGateForm');
    const input = document.getElementById('hlGateCode');
    const err = document.getElementById('hlGateError');
    const submitBtn = form.querySelector('button[type="submit"], .hl-btn');
    const originalBtnText = submitBtn ? submitBtn.textContent : '';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.classList.remove('show');
      const raw = input.value;
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Checking\u2026'; }
      grantAccessAsync(raw).then(function (result) {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalBtnText; }
        if (result && result.ok) {
          window.location.replace(returnTo || './index.html');
          return;
        }
        err.classList.add('show');
        const messages = {
          format: 'That code format is not valid. Codes start with HDC-CM-, HDC-BUNDLE- or HDC-AI-.',
          not_found: 'That access code is not on our register. Please double-check, or contact us if you have just paid.',
          revoked: 'That access code has been revoked. Please contact us if you believe this is in error.',
          expired: 'That access code has expired. Please contact us to renew.',
          wrong_course: 'That code is for a different course. Please use a code issued for this course or a bundle code.',
          sheet_unreachable: 'We could not reach our access register just now. Please check your connection and try again.'
        };
        err.textContent = messages[result && result.reason] || messages.not_found;
      });
    });
  }

  function guard() {
    if (!hasAccess()) {
      const ret = encodeURIComponent(window.location.pathname);
      window.location.replace('../access.html?return=' + ret);
      return false;
    }
    return true;
  }

  function initIndex() {
    if (!guard()) return;
    document.getElementById('hlTopbar').innerHTML = renderTopbar();
    document.getElementById('hlHero').innerHTML = renderHero();
    document.getElementById('hlUnits').innerHTML = renderUnits();
    try { applyIndexOverlay(); } catch (e) {}
  }

  function initLesson(slug, anchorList) {
    if (!guard()) return;
    document.getElementById('hlTopbar').innerHTML = renderTopbar(slug);
    document.getElementById('hlSidebarMount').innerHTML = renderSidebar(slug);
    document.getElementById('hlRightbarMount').innerHTML = renderRightbar(anchorList || []);
    document.getElementById('hlPagerMount').innerHTML = renderPager(slug, { fromLessons: true });

    // Mark complete button + auto-track
    const cBtn = document.getElementById('hlMarkComplete');
    if (cBtn) {
      const refresh = () => {
        const done = isComplete(slug);
        cBtn.textContent = done ? '✓ Completed — mark incomplete' : 'Mark this unit complete';
        cBtn.classList.toggle('hl-btn--outline', done);
      };
      refresh();
      cBtn.addEventListener('click', function () {
        if (isComplete(slug)) markIncomplete(slug); else markComplete(slug);
        refresh();
        // Update topbar progress
        document.getElementById('hlTopbar').innerHTML = renderTopbar(slug);
        document.getElementById('hlSidebarMount').innerHTML = renderSidebar(slug);
      });
    }

    // Quiz wiring
    document.querySelectorAll('.hl-quiz').forEach(quizEl => {
      const submit = quizEl.querySelector('.hl-quiz__submit-btn');
      const reset = quizEl.querySelector('.hl-quiz__reset-btn');
      const result = quizEl.querySelector('.hl-quiz__result');
      const passMark = parseInt(quizEl.dataset.passMark || '70', 10);
      const onComplete = quizEl.dataset.onPass;
      if (submit) submit.addEventListener('click', function () {
        const { correct, total, percent } = gradeQuiz(quizEl);
        if (result) {
          result.textContent = `Score: ${correct}/${total} (${percent}%) — ${percent >= passMark ? 'Pass' : 'Try again to improve'}`;
          result.classList.toggle('pass', percent >= passMark);
          result.classList.toggle('fail', percent < passMark);
        }
        if (percent >= passMark && onComplete === 'mark-lesson') {
          markComplete(slug);
          document.getElementById('hlTopbar').innerHTML = renderTopbar(slug);
          document.getElementById('hlSidebarMount').innerHTML = renderSidebar(slug);
          if (cBtn) cBtn.textContent = '✓ Completed — mark incomplete';
        }
      });
      if (reset) reset.addEventListener('click', function () {
        quizEl.querySelectorAll('input').forEach(i => { i.checked = false; });
        quizEl.querySelectorAll('.hl-q__opt').forEach(o => o.classList.remove('is-correct', 'is-incorrect'));
        quizEl.querySelectorAll('.hl-q__feedback').forEach(f => f.classList.remove('show', 'success', 'error'));
        if (result) { result.textContent = ''; result.classList.remove('pass', 'fail'); }
      });
    });

    // Sheet overlay (silent fallback if sheet unreachable)
    try { applyLessonOverlay(slug); } catch (e) {}

    // Active anchor highlighting on scroll
    if (anchorList && anchorList.length) {
      const links = document.querySelectorAll('#hlAnchors a');
      const sections = anchorList.map(a => document.getElementById(a.id)).filter(Boolean);
      const onScroll = () => {
        const scrollY = window.scrollY + 100;
        let activeIdx = 0;
        sections.forEach((s, i) => { if (s && s.offsetTop <= scrollY) activeIdx = i; });
        links.forEach((l, i) => l.classList.toggle('is-active', i === activeIdx));
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }

  // ============================================================
  // 11. FINAL ASSESSMENT — score persistence + certificate
  // ============================================================
  const FINAL_KEY = 'hdc-cm-final';
  const NAME_KEY = 'hdc-cm-learner-name';

  function getFinalScore() {
    try { return JSON.parse(localStorage.getItem(FINAL_KEY)) || null; }
    catch (e) { return null; }
  }
  function saveFinalScore(score) {
    localStorage.setItem(FINAL_KEY, JSON.stringify({
      score: score,
      passed: score >= 70,
      date: new Date().toISOString()
    }));
  }
  function getLearnerName() {
    return localStorage.getItem(NAME_KEY) || '';
  }
  function setLearnerName(name) {
    localStorage.setItem(NAME_KEY, (name || '').trim());
  }

  function initAssessment() {
    if (!guard()) return;
    document.getElementById('hlTopbar').innerHTML = renderTopbar('final-assessment');
    document.getElementById('hlSidebarMount').innerHTML = renderSidebar('final-assessment');
    document.getElementById('hlPagerMount').innerHTML = renderPager('final-assessment', { fromLessons: true });
    const rb = document.getElementById('hlRightbarMount');
    if (rb) rb.innerHTML = renderRightbar([
      { id: 'instructions', title: 'Before you start' },
      { id: 'exam', title: 'Exam questions' },
      { id: 'certificate', title: 'Certificate' },
      { id: 'next-steps', title: "What's next" }
    ]);

    // Restore prior result if any
    const existing = getFinalScore();
    const banner = document.getElementById('hlPriorResult');
    if (banner && existing) {
      const dateStr = new Date(existing.date).toLocaleDateString();
      banner.innerHTML = existing.passed
        ? `<div class="hl-callout" style="border-color:#16a34a;background:#f0fdf4;"><p class="hl-callout__title" style="color:#15803d;">✓ You passed on ${dateStr} with ${existing.score}%</p><p>Your certificate is ready below. You may retake the quiz to improve your score.</p></div>`
        : `<div class="hl-callout"><p class="hl-callout__title">Previous attempt: ${existing.score}% (${dateStr})</p><p>Pass mark is 70%. Try again below.</p></div>`;
    }

    // Wire submit
    const quiz = document.querySelector('.hl-quiz[data-final="true"]');
    if (quiz) {
      const submit = quiz.querySelector('.hl-quiz__submit-btn');
      const result = quiz.querySelector('.hl-quiz__result');
      submit && submit.addEventListener('click', function () {
        const { correct, total, percent } = gradeQuiz(quiz);
        if (result) {
          result.textContent = `Score: ${correct}/${total} (${percent}%) — ${percent >= 70 ? 'PASS' : 'Below pass mark'}`;
          result.classList.toggle('pass', percent >= 70);
          result.classList.toggle('fail', percent < 70);
        }
        saveFinalScore(percent);
        renderCertSection(percent);
      });
      const reset = quiz.querySelector('.hl-quiz__reset-btn');
      reset && reset.addEventListener('click', function () {
        quiz.querySelectorAll('input').forEach(i => { i.checked = false; });
        quiz.querySelectorAll('.hl-q__opt').forEach(o => o.classList.remove('is-correct', 'is-incorrect'));
        quiz.querySelectorAll('.hl-q__feedback').forEach(f => f.classList.remove('show', 'success', 'error'));
        if (result) { result.textContent = ''; result.classList.remove('pass', 'fail'); }
      });
    }

    // If previously passed, show the cert UI immediately
    if (existing && existing.passed) renderCertSection(existing.score);

    // Sheet overlay (silent fallback if sheet unreachable)
    try { applyLessonOverlay('final-assessment'); } catch (e) {}
  }

  function renderCertSection(percent) {
    const mount = document.getElementById('hlCertMount');
    if (!mount) return;
    if (percent < 70) {
      mount.innerHTML = '';
      return;
    }
    const existingName = getLearnerName();
    const existingEmail = (function () { try { return localStorage.getItem('hdc-learner-email') || ''; } catch (e) { return ''; } })();
    mount.innerHTML = `
      <div class="hl-callout" style="border-color:#16a34a;background:#f0fdf4;margin-top:24px;">
        <p class="hl-callout__title" style="color:#15803d;">\u{1F393} Congratulations \u2014 you passed</p>
        <p>Fill in your details and we will email your certificate as a PDF. The same certificate is verifiable any time at our verify page.</p>
        <div style="display:grid;gap:10px;margin-top:10px;">
          <input id="hlCertName" type="text" placeholder="Full name as it should appear on the certificate" value="${escapeHtml(existingName)}" style="padding:11px 13px;border:1px solid #d1d5db;border-radius:8px;font:inherit;">
          <input id="hlCertEmail" type="email" placeholder="Email address (we email the PDF here)" value="${escapeHtml(existingEmail)}" style="padding:11px 13px;border:1px solid #d1d5db;border-radius:8px;font:inherit;">
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="hl-btn" id="hlCertBtn" type="button">Generate &amp; email my certificate</button>
            <button class="hl-btn hl-btn--outline" id="hlCertViewBtn" type="button">View only (no email)</button>
          </div>
          <p id="hlCertStatus" style="margin:0;font-size:0.9rem;color:#475569;"></p>
        </div>
        <p style="margin-top:14px;font-size:0.85rem;color:#64748b;">Score recorded: ${percent}% &middot; HDT-208 &middot; ${new Date().toLocaleDateString('en-GB',{year:'numeric',month:'long',day:'numeric'})}</p>
      </div>
    `;
    const nameInput = document.getElementById('hlCertName');
    const emailInput = document.getElementById('hlCertEmail');
    const btn = document.getElementById('hlCertBtn');
    const viewBtn = document.getElementById('hlCertViewBtn');
    const status = document.getElementById('hlCertStatus');

    function readInputs() {
      return {
        name: (nameInput.value || '').trim(),
        email: (emailInput.value || '').trim()
      };
    }

    btn && btn.addEventListener('click', function () {
      const v = readInputs();
      if (!v.name) { nameInput.focus(); status.textContent = 'Please enter your full name first.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) { emailInput.focus(); status.textContent = 'Please enter a valid email address so we can send the PDF.'; return; }
      setLearnerName(v.name);
      try { localStorage.setItem('hdc-learner-email', v.email); } catch (e) {}
      const certId = 'HDC-CM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      btn.disabled = true; status.textContent = 'Issuing your certificate\u2026';
      issueCertificate({ cert_id: certId, learner_name: v.name, email: v.email, score: percent })
        .then(function (r) {
          btn.disabled = false;
          if (r && r.ok) {
            status.innerHTML = '\u2713 Issued. Check your inbox \u2014 we have emailed the PDF to <strong>' + escapeHtml(v.email) + '</strong>. The certificate is also opening in a new tab now.';
          } else if (r && r.error === 'not_configured') {
            status.innerHTML = '\u26A0 Email sender is not yet configured. Your certificate is opening in a new tab \u2014 please save the PDF from there.';
          } else {
            status.innerHTML = '\u26A0 We could not email the certificate just now (' + escapeHtml((r && r.error) || 'unknown') + '). It is opening in a new tab \u2014 please save the PDF from there.';
          }
          generateCertificate(v.name, percent, certId, v.email);
        });
    });
    viewBtn && viewBtn.addEventListener('click', function () {
      const v = readInputs();
      if (!v.name) { nameInput.focus(); status.textContent = 'Please enter your full name first.'; return; }
      setLearnerName(v.name);
      const certId = 'HDC-CM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      status.textContent = 'Opening preview\u2026 (not registered \u2014 click "Generate & email" above to officially issue.)';
      generateCertificate(v.name, percent, certId, v.email, true);
    });
  }

  // Calls the Apps Script web app to register + email a certificate.
  // Returns Promise<{ok:true, cert_id, verify_url} | {ok:false, error}>
  function issueCertificate(payload) {
    if (!CERT_API_URL) return Promise.resolve({ ok: false, error: 'not_configured' });
    const body = {
      cert_id: payload.cert_id,
      learner_name: payload.learner_name,
      email: payload.email,
      course: THIS_COURSE,
      course_title: COURSE && COURSE.title || THIS_COURSE,
      score: payload.score
    };
    return fetch(CERT_API_URL, {
      method: 'POST',
      // Use text/plain to avoid CORS preflight against Apps Script (it parses JSON either way).
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    })
      .then(function (r) { return r.json(); })
      .catch(function (err) { return { ok: false, error: String(err && err.message || err) }; });
  }

  // Public verifier used by /verify.html. Resolves to:
  //   { ok:true, valid:true, learner_name, course, score, issued_at, cert_id }
  //   { ok:true, valid:false }
  //   { ok:false, error }
  function verifyCertificate(certId) {
    if (!CERT_API_URL) return Promise.resolve({ ok: false, error: 'not_configured' });
    const url = CERT_API_URL + (CERT_API_URL.indexOf('?') === -1 ? '?' : '&') + 'action=verify&id=' + encodeURIComponent(certId);
    return fetch(url)
      .then(function (r) { return r.json(); })
      .catch(function (err) { return { ok: false, error: String(err && err.message || err) }; });
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  }

  function generateCertificate(name, score, certId, email, isPreview) {
    const dateStr = new Date().toLocaleDateString('en-GB', { year:'numeric', month:'long', day:'numeric' });
    certId = certId || ('HDC-CM-' + Math.random().toString(36).substring(2, 8).toUpperCase());
    const verifyUrl = SITE_BASE + '/learn/classroom-management/verify.html?id=' + encodeURIComponent(certId);
    const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=2&data=' + encodeURIComponent(verifyUrl);
    const logoUrl = SITE_BASE + '/images/logo.png';
    const linkedinTitle = encodeURIComponent(COURSE.title + ' (' + THIS_COURSE + ')');
    const linkedinOrg = encodeURIComponent(BRAND_NAME);
    const issueYear = new Date().getFullYear();
    const issueMonth = new Date().getMonth() + 1;
    const linkedinUrl = 'https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME'
      + '&name=' + linkedinTitle
      + '&organizationName=' + linkedinOrg
      + '&issueYear=' + issueYear
      + '&issueMonth=' + issueMonth
      + '&certUrl=' + encodeURIComponent(verifyUrl)
      + '&certId=' + encodeURIComponent(certId);
    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>HDT-208 Certificate — ${escapeHtml(name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Great+Vibes&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:40px 20px; background:#f1f5f9; font-family:'Plus Jakarta Sans',system-ui,sans-serif; }
  .cert { max-width: 1040px; margin: 0 auto; background: #fff; padding: 56px 60px 44px; border: 2px solid #0f172a; position:relative; box-shadow: 0 20px 50px rgba(0,0,0,0.12); overflow:hidden; }
  .cert::before { content:''; position:absolute; inset:14px; border:1px solid #b45309; pointer-events:none; z-index:1; }
  /* Watermark — large faint logo behind the content */
  .cert__watermark { position:absolute; left:50%; top:54%; transform:translate(-50%,-50%); width:520px; height:520px; opacity:0.05; background-image:url('${logoUrl}'); background-size:contain; background-position:center; background-repeat:no-repeat; pointer-events:none; z-index:0; }
  .cert > *:not(.cert__watermark) { position:relative; z-index:2; }
  .cert__head { text-align:center; }
  .cert__brand { letter-spacing: 4px; font-size: 14px; color:#b45309; font-weight:700; text-transform:uppercase; }
  .cert__title { font-family:'Playfair Display', serif; font-size:46px; margin:8px 0 4px; color:#0f172a; font-weight:900; }
  .cert__sub { color:#475569; font-size:15px; margin-bottom:24px; }
  .cert__awarded { text-align:center; color:#475569; margin-top:18px; font-size:15px; }
  .cert__name { font-family:'Playfair Display', serif; font-size:52px; font-weight:700; color:#0f172a; text-align:center; margin:10px 0 4px; border-bottom: 2px solid #b45309; display:inline-block; padding: 0 30px 4px; }
  .cert__name-wrap { text-align:center; }
  .cert__for { text-align:center; color:#0f172a; margin: 22px auto 0; max-width: 780px; font-size:16px; line-height: 1.55; }
  .cert__course { font-weight:700; }
  .cert__row { display:flex; justify-content: space-between; margin-top: 44px; gap: 32px; align-items: flex-end; }
  .cert__block { flex:1; text-align:center; }
  .cert__block-line { border-top: 1.5px solid #0f172a; padding-top: 6px; font-size:12px; color:#0f172a; font-weight:600; letter-spacing: 0.5px; text-transform: uppercase; }
  .cert__block-name { font-family:'Playfair Display',serif; font-size:18px; color:#0f172a; margin-bottom: 2px; }
  .cert__sig { font-family:'Great Vibes', cursive; font-size:34px; color:#0f172a; line-height:1; margin-bottom:2px; }
  .cert__meta { text-align:center; margin-top:24px; font-size:11px; color:#64748b; letter-spacing: 1px; }
  /* Top-right logo seal */
  .cert__seal { position:absolute; right: 46px; top: 46px; width:96px; height:96px; border-radius:50%; background:#fff; border:3px solid #b45309; display:flex; align-items:center; justify-content:center; box-shadow: 0 8px 20px rgba(180,83,9,0.25); padding: 6px; z-index:3; }
  .cert__seal img { max-width: 100%; max-height: 100%; display:block; }
  /* QR code bottom-right */
  .cert__qr { position:absolute; right: 30px; bottom: 30px; text-align:center; z-index:3; }
  .cert__qr img { width: 96px; height: 96px; display:block; border: 4px solid #fff; background:#fff; }
  .cert__qr small { display:block; margin-top:4px; font-size:10px; color:#64748b; letter-spacing: 0.5px; }
  .actions { max-width:1040px; margin: 24px auto 0; text-align:center; }
  .btn { background:#0f172a; color:#fff; border:none; padding: 12px 22px; border-radius:8px; font: 600 14px/1 'Plus Jakarta Sans',sans-serif; cursor:pointer; margin: 0 6px 6px; text-decoration:none; display:inline-block; }
  .btn--linkedin { background:#0a66c2; }
  .preview-banner { max-width:1040px; margin: 0 auto 16px; background:#fefce8; border:1px solid #ca8a04; color:#713f12; padding:12px 16px; border-radius:8px; font-size:14px; text-align:center; }
  @media print { body{background:#fff;padding:0;} .actions, .preview-banner{display:none;} .cert{box-shadow:none; border-color:#0f172a;} }
</style></head>
<body>
  ${isPreview ? '<div class="preview-banner">Preview only \u2014 this certificate has not been registered. Close this tab and use "Generate &amp; email my certificate" to officially issue.</div>' : ''}
  <div class="cert">
    <div class="cert__watermark"></div>
    <div class="cert__seal"><img src="${logoUrl}" alt=""></div>
    <div class="cert__head">
      <div class="cert__brand">${BRAND_NAME}</div>
      <h1 class="cert__title">Certificate of Completion</h1>
      <div class="cert__sub">Teachers Training Programme &middot; Course Code HDT-208</div>
    </div>
    <div class="cert__awarded">This certificate is proudly awarded to</div>
    <div class="cert__name-wrap"><div class="cert__name">${escapeHtml(name)}</div></div>
    <p class="cert__for">for the successful completion of <span class="cert__course">Classroom Management with Digital Tools</span>, including all seven learning units and the final assessment, with a score of <strong>${score}%</strong>.</p>
    <div class="cert__row">
      <div class="cert__block"><div class="cert__block-name">${dateStr}</div><div class="cert__block-line">Date of Award</div></div>
      <div class="cert__block"><div class="cert__block-name">${certId}</div><div class="cert__block-line">Certificate ID</div></div>
      <div class="cert__block"><div class="cert__sig">${escapeHtml(SIGNATORY)}</div><div class="cert__block-line">${escapeHtml(SIGNATORY + ' \u00b7 ' + SIGNATORY_TITLE)}</div></div>
    </div>
    <div class="cert__qr"><img src="${qrUrl}" alt="Verify"><small>SCAN TO VERIFY</small></div>
    <div class="cert__meta">${BRAND_NAME} &nbsp;·&nbsp; harmonydigitalconsults.com.ng &nbsp;·&nbsp; ${BRAND_EMAIL} &nbsp;·&nbsp; Verify: ${verifyUrl}</div>
  </div>
  <div class="actions">
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
    <a class="btn btn--linkedin" href="${linkedinUrl}" target="_blank" rel="noopener">Add to LinkedIn</a>
    <button class="btn" onclick="window.close()">Close</button>
  </div>
</body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
    else { alert('Pop-up was blocked. Please allow pop-ups and try again.'); }
  }
})();
