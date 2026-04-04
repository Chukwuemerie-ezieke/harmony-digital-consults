/* ==========================================================================
   Harmony Digital Consults — Shared JavaScript v3.0
   Theme toggle, mobile menu, scroll animations, header behavior, active nav
   ========================================================================== */

(function () {
  'use strict';

  // ========== Theme Toggle ==========
  const THEME_KEY = 'hdc-theme';

  function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateThemeIcon(theme);
  }

  function updateThemeIcon(theme) {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    const sunIcon = btn.querySelector('.icon-sun');
    const moonIcon = btn.querySelector('.icon-moon');
    if (sunIcon && moonIcon) {
      sunIcon.style.display = theme === 'dark' ? 'none' : 'block';
      moonIcon.style.display = theme === 'dark' ? 'block' : 'none';
    }
  }

  function initTheme() {
    const theme = getPreferredTheme();
    applyTheme(theme);

    const btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    }
  }

  // ========== Mobile Menu ==========
  function initMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    if (!toggle || !mobileNav) return;

    toggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      document.body.classList.toggle('nav-open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen);
      // Update icon
      const menuIcon = toggle.querySelector('.icon-menu');
      const closeIcon = toggle.querySelector('.icon-close');
      if (menuIcon && closeIcon) {
        menuIcon.style.display = isOpen ? 'none' : 'block';
        closeIcon.style.display = isOpen ? 'block' : 'none';
      }
    });

    // Close on link click
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('is-open');
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        const menuIcon = toggle.querySelector('.icon-menu');
        const closeIcon = toggle.querySelector('.icon-close');
        if (menuIcon && closeIcon) {
          menuIcon.style.display = 'block';
          closeIcon.style.display = 'none';
        }
      });
    });
  }

  // ========== Header Scroll Behavior ==========
  function initHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScrollY = 0;
    let ticking = false;

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;

          // Add scrolled class when past threshold
          if (scrollY > 20) {
            header.classList.add('header--scrolled');
          } else {
            header.classList.remove('header--scrolled');
          }

          // Hide on scroll down, show on scroll up
          if (scrollY > lastScrollY && scrollY > 100) {
            header.classList.add('header--hidden');
          } else {
            header.classList.remove('header--hidden');
          }

          lastScrollY = scrollY;
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ========== Scroll Reveal Animations ==========
  function initReveal() {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    if ('IntersectionObserver' in window) {
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
    } else {
      // Fallback: show everything
      elements.forEach(el => el.classList.add('is-visible'));
    }
  }

  // ========== Active Nav Link ==========
  function initActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Map filenames to nav text
    const navLinks = document.querySelectorAll('.header__nav a, .mobile-nav a');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      const linkPage = href.split('/').pop();

      if (linkPage === currentPage ||
          (currentPage === '' && linkPage === 'index.html') ||
          (currentPage === 'index.html' && linkPage === 'index.html')) {
        link.classList.add('is-active');
      }
    });
  }

  // ========== Contact Form (basic) ==========
  function initContactForm() {
    const form = document.querySelector('.contact__form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('.btn');
      const originalText = btn.textContent;
      btn.textContent = 'Message Sent!';
      btn.style.background = '#0a8f8f';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        form.reset();
      }, 3000);
    });
  }

  // ========== Lucide Icons ==========
  function initIcons() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // ========== Init ==========
  function init() {
    initTheme();
    initMobileMenu();
    initHeader();
    initReveal();
    initActiveNav();
    initContactForm();
    // Delay icon init slightly to ensure Lucide is loaded
    if (typeof lucide !== 'undefined') {
      initIcons();
    } else {
      window.addEventListener('load', initIcons);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
