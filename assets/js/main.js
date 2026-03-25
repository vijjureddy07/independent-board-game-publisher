/**
 * TabletopForge — main.js
 * Handles: theme toggle, RTL, nav scroll, mobile menu,
 *          scroll reveal, testimonial carousel, progress animation,
 *          custom cursor, counter animation, marquee, newsletter form,
 *          timeline (about page)
 *
 * Also exports shared utilities used by page-specific scripts:
 *   window.TTF.readingProgress(fillSel, contentSel)
 *   window.TTF.paginationButtons(btnSel, scrollTargetSel)
 *
 * Pattern: each feature is an IIFE module returning { init }.
 * All modules are initialised in ONE DOMContentLoaded at the bottom.
 * Page-specific modules exit early when their elements aren't present.
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   GLOBAL HELPERS  (available to all page scripts via window.$/$$/TTF)
───────────────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ─────────────────────────────────────────────────────────────
   SHARED UTILITIES  (consumed by blog.js, forum.js, etc.)
   Exposed on window.TTF so page scripts don't need to redefine them.
───────────────────────────────────────────────────────────── */
window.TTF = window.TTF || {};

/**
 * Reading progress bar — updates a fill element's width as the user
 * scrolls through a content container.
 * @param {string} fillSel    CSS selector for the fill bar element
 * @param {string} contentSel CSS selector for the scrollable article/content
 */
window.TTF.readingProgress = function (fillSel = '#read-progress', contentSel = '#article-content') {
  const fill    = $(fillSel);
  const content = $(contentSel);
  if (!fill || !content) return;

  function update() {
    const rect     = content.getBoundingClientRect();
    const total    = content.offsetHeight - window.innerHeight;
    const scrolled = Math.max(0, -rect.top);
    const pct      = Math.min(100, total > 0 ? (scrolled / total) * 100 : 0);
    fill.style.width = pct.toFixed(1) + '%';
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
};

/**
 * Generic pagination — highlights the clicked numbered button and
 * scrolls a target element into view.
 * @param {string} btnSel          CSS selector for all page-btn elements
 * @param {string} scrollTargetSel CSS selector for the element to scroll to
 */
window.TTF.paginationButtons = function (btnSel = '.page-btn', scrollTargetSel = null) {
  const btns = $$(btnSel);
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.querySelector('i')) return; // skip prev/next icon-only buttons
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (scrollTargetSel) $(scrollTargetSel)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
};

/* ─────────────────────────────────────────────────────────────
   1. THEME TOGGLE  (dark / light + system preference detection)
───────────────────────────────────────────────────────────── */
const ThemeManager = (() => {
  const root = document.documentElement;
  const KEY  = 'ttf-theme';

  const ICONS = {
    dark : `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    light: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
  };

  function getCurrent() {
    return localStorage.getItem(KEY)
      || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
    $$('[data-theme-toggle]').forEach(btn => {
      btn.innerHTML = theme === 'dark' ? ICONS.light : ICONS.dark;
      btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    });
  }

  function init() {
    apply(getCurrent());
    $$('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => {
      apply(getCurrent() === 'dark' ? 'light' : 'dark');
    }));
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
      if (!localStorage.getItem(KEY)) apply(e.matches ? 'light' : 'dark');
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   2. RTL TOGGLE
───────────────────────────────────────────────────────────── */
const RTLManager = (() => {
  const root = document.documentElement;
  const KEY  = 'ttf-dir';

  function updateBtnLabel(dir) {
    $$('[data-rtl-toggle]').forEach(btn => {
      btn.textContent = dir === 'ltr' ? 'RTL' : 'LTR';
      btn.setAttribute('aria-label', `Switch to ${dir === 'ltr' ? 'RTL' : 'LTR'} layout`);
    });
  }

  function init() {
    const saved = localStorage.getItem(KEY) || 'ltr';
    root.setAttribute('dir', saved);
    updateBtnLabel(saved);

    $$('[data-rtl-toggle]').forEach(btn => btn.addEventListener('click', () => {
      const next = root.getAttribute('dir') === 'ltr' ? 'rtl' : 'ltr';
      root.setAttribute('dir', next);
      localStorage.setItem(KEY, next);
      updateBtnLabel(next);
    }));
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   3. NAV  (scroll state · mobile drawer · active link)
───────────────────────────────────────────────────────────── */
const NavManager = (() => {
  let menuOpen = false;

  function init() {
    const nav        = $('.nav');
    const hamburger  = $('.nav__hamburger');
    const mobileMenu = $('.nav__mobile');

    if (!nav) return;

    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function openMenu() {
      menuOpen = true;
      hamburger.classList.add('open');
      mobileMenu.classList.add('open');
      mobileMenu.setAttribute('aria-hidden', 'false');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      if (!menuOpen) return;
      menuOpen = false;
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      mobileMenu.setAttribute('aria-hidden', 'true');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    hamburger?.addEventListener('click', () => menuOpen ? closeMenu() : openMenu());

    document.addEventListener('click', e => {
      if (menuOpen && !nav.contains(e.target) && !mobileMenu.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize',   () => { if (window.innerWidth > 768) closeMenu(); });

    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    $$('.nav__link[href]').forEach(link => {
      if (link.getAttribute('href').split('/').pop() === currentFile) {
        link.classList.add('active');
      }
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   4. SCROLL REVEAL
───────────────────────────────────────────────────────────── */
const RevealManager = (() => {
  function init() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    $$('.reveal').forEach(el => observer.observe(el));
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   5. PROGRESS BAR ANIMATION  (campaign cards)
───────────────────────────────────────────────────────────── */
const ProgressManager = (() => {
  function init() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const fill   = entry.target.querySelector('.progress__fill');
        const target = parseInt(fill?.dataset.width || '0', 10);
        if (fill) setTimeout(() => { fill.style.width = Math.min(target, 100) + '%'; }, 200);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    $$('.progress').forEach(el => observer.observe(el));
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   6. TESTIMONIAL CAROUSEL  (auto-advance · swipe · dots)
───────────────────────────────────────────────────────────── */
const CarouselManager = (() => {
  function init() {
    $$('[data-carousel]').forEach(carousel => {
      const track    = carousel.querySelector('.testimonials__track');
      const cards    = $$('.testi-card', carousel);
      const prevBtn  = carousel.querySelector('[data-prev]');
      const nextBtn  = carousel.querySelector('[data-next]');
      const dotsWrap = carousel.querySelector('.testi-dots');

      if (!track || !cards.length) return;

      let current = 0;

      cards.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'testi-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsWrap?.appendChild(dot);
      });

      function goTo(index) {
        current = Math.max(0, Math.min(index, cards.length - 1));
        const gap   = 16;
        const cardW = cards[0].offsetWidth + gap;
        track.style.transform = `translateX(-${current * cardW}px)`;
        $$('.testi-dot', carousel).forEach((d, i) => d.classList.toggle('active', i === current));
      }

      prevBtn?.addEventListener('click', () => goTo(current - 1));
      nextBtn?.addEventListener('click', () => goTo(current + 1));

      // Auto-advance
      let timer = setInterval(() => goTo((current + 1) % cards.length), 5000);
      carousel.addEventListener('mouseenter', () => clearInterval(timer));
      carousel.addEventListener('mouseleave', () => {
        timer = setInterval(() => goTo((current + 1) % cards.length), 5000);
      });

      // Touch swipe
      let startX = 0;
      track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
      track.addEventListener('touchend',   e => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
      });
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   7. FEATURE ACCORDION  (homepage feature items)
───────────────────────────────────────────────────────────── */
const FeatureAccordion = (() => {
  function init() {
    const items = $$('.feature-item');
    if (!items.length) return;

    items.forEach(item => {
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');

      const activate = () => {
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      };

      item.addEventListener('click', activate);
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      });
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   8. CUSTOM CURSOR  (desktop only — skipped on touch devices)
───────────────────────────────────────────────────────────── */
const CursorManager = (() => {
  function init() {
    if ('ontouchstart' in window) return;

    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.innerHTML = '<div class="cursor-dot"></div><div class="cursor-ring"></div>';
    document.body.appendChild(cursor);

    const dot  = cursor.querySelector('.cursor-dot');
    const ring = cursor.querySelector('.cursor-ring');

    let mouseX = 0, mouseY = 0;
    let ringX  = 0, ringY  = 0;

    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    });

    (function animateRing() {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      requestAnimationFrame(animateRing);
    })();

    $$('a, button, [role="button"], .campaign-card, .feature-item').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
    document.addEventListener('mousedown',  () => cursor.classList.add('click'));
    document.addEventListener('mouseup',    () => cursor.classList.remove('click'));
    document.addEventListener('mouseleave', () => cursor.classList.add('hidden'));
    document.addEventListener('mouseenter', () => cursor.classList.remove('hidden'));
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   9. COUNTER ANIMATION  (data-count elements on non-dashboard pages)
   NOTE: dashboard.js has its own panel-scoped animateCounters()
   that runs per-panel. This global version handles homepage/about
   counters via IntersectionObserver — they don't conflict because
   dashboard counters carry data-animated="1" after first run.
───────────────────────────────────────────────────────────── */
const CounterManager = (() => {
  function animateCount(el) {
    const target   = parseFloat(el.dataset.count);
    const suffix   = el.dataset.suffix || '';
    const prefix   = el.dataset.prefix || '';
    const duration = 1800;
    const start    = performance.now();

    (function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 5);
      const value    = target * eased;
      el.textContent = prefix + (Number.isInteger(target) ? Math.round(value) : value.toFixed(1)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  function init() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    // Skip elements already handled by dashboard.js (data-animated flag)
    $$('[data-count]:not([data-animated])').forEach(el => observer.observe(el));
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   10. MARQUEE  (clones track for seamless infinite loop)
───────────────────────────────────────────────────────────── */
const MarqueeManager = (() => {
  function init() {
    $$('.marquee-track').forEach(track => {
      const clone = track.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.parentElement.appendChild(clone);
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   11. NEWSLETTER FORM VALIDATION
───────────────────────────────────────────────────────────── */
const NewsletterForm = (() => {
  function init() {
    $$('[data-newsletter-form]').forEach(form => {
      const input = form.querySelector('input[type="email"]');
      const btn   = form.querySelector('button[type="submit"]');
      if (!input || !btn) return;

      form.addEventListener('submit', e => {
        e.preventDefault();
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());

        input.classList.toggle('error',   !valid);
        input.classList.toggle('success',  valid);

        if (valid) {
          const orig      = btn.textContent;
          btn.textContent = 'Subscribed ✓';
          btn.disabled    = true;
          setTimeout(() => {
            btn.textContent = orig;
            btn.disabled    = false;
            input.value     = '';
            input.classList.remove('success');
          }, 3000);
        }
      });
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   12. CURSOR CSS INJECTION
───────────────────────────────────────────────────────────── */
function injectCursorStyles() {
  if ('ontouchstart' in window) return;

  const style = document.createElement('style');
  style.textContent = `
    * { cursor: none !important; }
    .custom-cursor { position: fixed; top: 0; left: 0; pointer-events: none; z-index: 99999; }
    .cursor-dot {
      position: absolute; width: 5px; height: 5px; border-radius: 50%;
      background: var(--text-primary); top: -2.5px; left: -2.5px;
      transition: width 0.2s, height 0.2s, background 0.2s;
    }
    .cursor-ring {
      position: absolute; width: 32px; height: 32px; border-radius: 50%;
      border: 1px solid rgba(244,244,244,0.25); top: -16px; left: -16px;
      transition: width 0.35s cubic-bezier(0.16,1,0.3,1),
                  height 0.35s cubic-bezier(0.16,1,0.3,1),
                  border-color 0.2s;
    }
    .custom-cursor.hover .cursor-dot  { width: 10px; height: 10px; top: -5px; left: -5px; background: var(--accent); }
    .custom-cursor.hover .cursor-ring { width: 52px; height: 52px; top: -26px; left: -26px; border-color: rgba(212,245,60,0.3); }
    .custom-cursor.click .cursor-ring { width: 20px; height: 20px; top: -10px; left: -10px; }
    .custom-cursor.hidden { opacity: 0; }
  `;
  document.head.appendChild(style);
}

/* ─────────────────────────────────────────────────────────────
   13. TIMELINE  (about page — dot highlight on scroll)
───────────────────────────────────────────────────────────── */
const TimelineManager = (() => {
  function init() {
    const items = $$('.timeline-item');
    if (!items.length) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        entry.target.classList.toggle('active', entry.isIntersecting);
      });
    }, { threshold: 0.6 });

    items.forEach(item => observer.observe(item));
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   INIT ALL  — single DOMContentLoaded, every module in one place
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  injectCursorStyles();
  ThemeManager.init();
  RTLManager.init();
  NavManager.init();
  RevealManager.init();
  ProgressManager.init();
  CarouselManager.init();
  FeatureAccordion.init();
  CursorManager.init();
  CounterManager.init();
  MarqueeManager.init();
  NewsletterForm.init();
  TimelineManager.init();
});