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
    id: 'ai-in-education',
    code: 'HDT-207',
    title: 'AI-Assisted Content Creation for Educators',
    subtitle: 'Harmony Digital Consults — Professional Certificate',
    description: 'Master ethical, practical use of AI tools (ChatGPT, Gemini, Canva, Gamma, MagicSchool) for lesson planning, assessments, visuals, and classroom workflow.',
    duration: '6 lessons · ~6 hours',
    level: 'Beginner to Intermediate',
    path: '/learn/ai-in-education/',
    lessons: [
      { slug: 'lesson-1-foundations', num: 1, title: 'Foundations of AI for Educators', duration: '45 min', desc: 'What AI is, what it can and cannot do, and the ethics of using it in schools.' },
      { slug: 'lesson-2-prompt-engineering', num: 2, title: 'Prompt Engineering for Teachers', duration: '55 min', desc: 'Learn the R.O.C.C. framework and write prompts that produce classroom-ready output.' },
      { slug: 'lesson-3-lesson-plans', num: 3, title: 'Lesson Plans, Schemes & Notes', duration: '60 min', desc: 'Generate full lesson plans, weekly schemes of work, and student-friendly notes.' },
      { slug: 'lesson-4-assessments', num: 4, title: 'Worksheets, Quizzes & Assessments', duration: '55 min', desc: 'Build differentiated worksheets, quizzes with answer keys, and Bloom-tagged questions.' },
      { slug: 'lesson-5-visuals', num: 5, title: 'Slides, Images, Posters & Infographics', duration: '50 min', desc: 'Create classroom visuals with Canva AI, Gamma, and image generators.' },
      { slug: 'lesson-6-ethics-workflow', num: 6, title: 'Ethics, Safety & Your Weekly Workflow', duration: '45 min', desc: 'Apply ethical guidelines and design a personal AI-assisted teaching system.' },
      { slug: 'final-assessment', num: 7, title: 'Final Assessment', duration: '20 min', desc: 'End-of-course quiz — 20 marks, 70% to pass.', isAssessment: true }
    ]
  };

  // ============================================================
  // 2. ACCESS TOKENS (replace with real codes after enrolment)
  // ============================================================
  // Each enrolled teacher gets a unique code. To revoke, remove from this list.
  // Format suggestion: HDC-AI-XXXXXX (6 alphanumeric chars)
  const ACCESS_CODES = new Set([
    // Demo / preview codes:
    'HDC-AI-DEMO01',
    'HDC-AI-PREVUE',
    // Add enrolled teacher codes here after they pay:
    // 'HDC-AI-9X7K2P',
    // 'HDC-AI-A4B8M1',
  ]);

  const STORAGE_KEY = 'hdc-ai-edu-access';
  const PROGRESS_KEY = 'hdc-ai-edu-progress';

  // ============================================================
  // 3. PUBLIC API exposed for inline script use
  // ============================================================
  window.HarmonyLearn = {
    course: COURSE,
    hasAccess,
    grantAccess,
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
    generateCertificate
  };

  // ============================================================
  // 4. ACCESS GATE
  // ============================================================
  function hasAccess() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      return data && data.code && ACCESS_CODES.has(data.code);
    } catch (e) { return false; }
  }
  function grantAccess(code) {
    const normalised = (code || '').trim().toUpperCase();
    if (!ACCESS_CODES.has(normalised)) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: normalised, since: new Date().toISOString() }));
    return true;
  }
  function revokeAccess() { localStorage.removeItem(STORAGE_KEY); }

  // ============================================================
  // 4b. CONTENT OVERLAY — Google Sheets CMS (graceful fallback to HTML)
  // ============================================================
  const SHEET_ID = '1cKH__Mts1ATjXI1ESjEqmiB0Nn8qp0-d6E8hwBwvoSk';
  const SHEET_GID = '0';
  // Use the gviz JSON endpoint — works on any sheet shared "anyone with link can view".
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;
  const SHEET_CACHE_KEY = 'hdc-ai-edu-sheet-cache';
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
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.classList.remove('show');
      if (grantAccess(input.value)) {
        window.location.replace(returnTo || './index.html');
      } else {
        err.classList.add('show');
        err.textContent = 'That access code is not recognised. Please check the code and try again, or contact us.';
      }
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
  const FINAL_KEY = 'hdc-ai-edu-final';
  const NAME_KEY = 'hdc-ai-edu-learner-name';

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
    mount.innerHTML = `
      <div class="hl-callout" style="border-color:#16a34a;background:#f0fdf4;margin-top:24px;">
        <p class="hl-callout__title" style="color:#15803d;">🎓 Congratulations — you passed</p>
        <p>Enter the name you would like to appear on your certificate:</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
          <input id="hlCertName" type="text" placeholder="Full name as it should appear" value="${escapeHtml(existingName)}" style="flex:1;min-width:240px;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font:inherit;">
          <button class="hl-btn" id="hlCertBtn" type="button">Generate certificate</button>
        </div>
        <p style="margin-top:8px;font-size:0.9rem;color:#475569;">Score recorded: ${percent}% &middot; HDT-207 &middot; ${new Date().toLocaleDateString()}</p>
      </div>
    `;
    const nameInput = document.getElementById('hlCertName');
    const btn = document.getElementById('hlCertBtn');
    btn && btn.addEventListener('click', function () {
      const name = (nameInput.value || '').trim();
      if (!name) { nameInput.focus(); return; }
      setLearnerName(name);
      generateCertificate(name, percent);
    });
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  }

  function generateCertificate(name, score) {
    const dateStr = new Date().toLocaleDateString('en-GB', { year:'numeric', month:'long', day:'numeric' });
    const certId = 'HDC-AI-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>HDT-207 Certificate — ${escapeHtml(name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:40px 20px; background:#f1f5f9; font-family:'Plus Jakarta Sans',system-ui,sans-serif; }
  .cert { max-width: 1000px; margin: 0 auto; background: #fff; padding: 60px 60px; border: 2px solid #0f172a; position:relative; box-shadow: 0 20px 50px rgba(0,0,0,0.12); }
  .cert::before { content:''; position:absolute; inset:14px; border:1px solid #b45309; pointer-events:none; }
  .cert__head { text-align:center; }
  .cert__brand { letter-spacing: 4px; font-size: 14px; color:#b45309; font-weight:700; text-transform:uppercase; }
  .cert__title { font-family:'Playfair Display', serif; font-size:48px; margin:8px 0 4px; color:#0f172a; font-weight:900; }
  .cert__sub { color:#475569; font-size:15px; margin-bottom:32px; }
  .cert__awarded { text-align:center; color:#475569; margin-top:24px; font-size:15px; }
  .cert__name { font-family:'Playfair Display', serif; font-size:56px; font-weight:700; color:#0f172a; text-align:center; margin:14px 0 4px; border-bottom: 2px solid #b45309; display:inline-block; padding: 0 30px 6px; }
  .cert__name-wrap { text-align:center; }
  .cert__for { text-align:center; color:#0f172a; margin: 28px auto 0; max-width: 760px; font-size:17px; line-height: 1.55; }
  .cert__course { font-weight:700; }
  .cert__row { display:flex; justify-content: space-between; margin-top: 60px; gap: 40px; }
  .cert__block { flex:1; text-align:center; }
  .cert__block-line { border-top: 1.5px solid #0f172a; padding-top: 8px; font-size:13px; color:#0f172a; font-weight:600; letter-spacing: 0.5px; text-transform: uppercase; }
  .cert__block-name { font-family:'Playfair Display',serif; font-size:20px; color:#0f172a; margin-bottom: 4px; }
  .cert__meta { text-align:center; margin-top:36px; font-size:12px; color:#64748b; letter-spacing: 1px; }
  .cert__seal { position:absolute; right: 50px; top: 50px; width:96px; height:96px; border-radius:50%; background: linear-gradient(135deg, #b45309, #f59e0b); color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px; text-align:center; line-height:1.2; font-weight:700; box-shadow: 0 8px 20px rgba(180,83,9,0.35); padding: 8px; }
  .actions { max-width:1000px; margin: 24px auto 0; text-align:center; }
  .btn { background:#0f172a; color:#fff; border:none; padding: 12px 22px; border-radius:8px; font: 600 14px/1 'Plus Jakarta Sans',sans-serif; cursor:pointer; margin: 0 6px; }
  @media print { body{background:#fff;padding:0;} .actions{display:none;} .cert{box-shadow:none; border-color:#0f172a;} }
</style></head>
<body>
  <div class="cert">
    <div class="cert__seal">HARMONY<br>VERIFIED<br>HDT-207</div>
    <div class="cert__head">
      <div class="cert__brand">Harmony Digital Consults</div>
      <h1 class="cert__title">Certificate of Completion</h1>
      <div class="cert__sub">Teachers Training Programme &middot; Course Code HDT-207</div>
    </div>
    <div class="cert__awarded">This certificate is proudly awarded to</div>
    <div class="cert__name-wrap"><div class="cert__name">${escapeHtml(name)}</div></div>
    <p class="cert__for">for the successful completion of <span class="cert__course">AI-Assisted Content Creation for Educators</span>, including all six learning units and the final assessment, with a score of <strong>${score}%</strong>.</p>
    <div class="cert__row">
      <div class="cert__block"><div class="cert__block-name">${dateStr}</div><div class="cert__block-line">Date of Award</div></div>
      <div class="cert__block"><div class="cert__block-name">${certId}</div><div class="cert__block-line">Certificate ID</div></div>
      <div class="cert__block"><div class="cert__block-name">Harmony Digital Consults</div><div class="cert__block-line">Issuing Organisation</div></div>
    </div>
    <div class="cert__meta">harmonydigitalconsults.com.ng &nbsp;·&nbsp; info@harmonydigitalconsults.com.ng</div>
  </div>
  <div class="actions">
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
    <button class="btn" onclick="window.close()">Close</button>
  </div>
</body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
    else { alert('Pop-up was blocked. Please allow pop-ups and try again.'); }
  }
})();
