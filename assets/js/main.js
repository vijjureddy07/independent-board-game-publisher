/**
 * TabletopForge — main.js  v3
 *
 * Modules (all self-contained IIFEs, one DOMContentLoaded):
 *  1. ThemeManager    — dark/light + system detection + localStorage
 *  2. RTLManager      — RTL/LTR toggle + localStorage
 *  3. NavManager      — scroll state, hamburger, mobile drawer, active link
 *  4. RevealManager   — IntersectionObserver scroll reveals
 *  5. ProgressManager — campaign progress bar animation
 *  6. CarouselManager — testimonials auto-advance, swipe, dots
 *  7. FeatureAccordion — homepage feature items keyboard+click
 *  8. CursorManager   — custom cursor (desktop only)
 *  9. CounterManager  — data-count animated numbers
 * 10. MarqueeManager  — clones track for seamless loop
 * 11. NewsletterForm  — email validation across all forms
 * 12. TimelineManager — about page dot highlight on scroll
 * 13. ParticleManager — atmospheric floating particles (motion effect)
 * 14. GsTabManager    — game single page tab switching
 * 15. FilterManager   — filter pills (games, blog)
 * 16. ContactForm     — contact page form validation + submit
 * 17. ReadingProgress — blog single reading progress bar
 * 18. PaginationManager — shared pagination buttons
 *
 * Exports on window.TTF:
 *   window.TTF.readingProgress(fillSel, contentSel)
 *   window.TTF.paginationButtons(btnSel, scrollTargetSel)
 *
 * Global helpers on window:
 *   window.$   = (sel, ctx) => ctx.querySelector(sel)
 *   window.$$  = (sel, ctx) => [...ctx.querySelectorAll(sel)]
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   GLOBAL HELPERS
───────────────────────────────────────────────────────────── */
window.$ = (sel, ctx = document) => ctx.querySelector(sel);
window.$$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ─────────────────────────────────────────────────────────────
   SHARED UTILITIES (used by dashboard.js, forum.js, blog.js)
───────────────────────────────────────────────────────────── */
window.TTF = window.TTF || {};

window.TTF.readingProgress = function(fillSel = '#read-progress', contentSel = '#article-content') {
  const fill    = $(fillSel);
  const content = $(contentSel);
  if (!fill || !content) return;

  function update() {
    const rect  = content.getBoundingClientRect();
    const total = content.offsetHeight - window.innerHeight;
    const scrolled = Math.max(0, -rect.top);
    const pct = Math.min(100, total > 0 ? (scrolled / total) * 100 : 0);
    fill.style.width = pct.toFixed(1) + '%';
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
};

window.TTF.paginationButtons = function(btnSel = '.page-btn', scrollTargetSel = null) {
  const btns = $$(btnSel);
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.querySelector('i')) return;
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (scrollTargetSel) $(scrollTargetSel)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
};


/* ─────────────────────────────────────────────────────────────
   1. THEME MANAGER
───────────────────────────────────────────────────────────── */
const ThemeManager = (() => {
  const root = document.documentElement;
  const KEY  = 'ttf-theme';

  const MOON_ICON = `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  const SUN_ICON  = `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

  function getCurrent() {
    return localStorage.getItem(KEY)
      || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);

    $$('[data-theme-toggle]').forEach(btn => {
      btn.innerHTML = theme === 'dark' ? SUN_ICON : MOON_ICON;
      btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    });
  }

  function init() {
    apply(getCurrent());

    $$('[data-theme-toggle]').forEach(btn => {
      btn.addEventListener('click', () => apply(getCurrent() === 'dark' ? 'light' : 'dark'));
    });

    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
      if (!localStorage.getItem(KEY)) apply(e.matches ? 'light' : 'dark');
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   2. RTL MANAGER
───────────────────────────────────────────────────────────── */
const RTLManager = (() => {
  const root = document.documentElement;
  const KEY  = 'ttf-dir';

  function updateBtns(dir) {
    $$('[data-rtl-toggle]').forEach(btn => {
      btn.textContent = dir === 'ltr' ? 'RTL' : 'LTR';
      btn.setAttribute('aria-label', `Switch to ${dir === 'ltr' ? 'RTL' : 'LTR'} layout`);
    });
  }

  function init() {
    const saved = localStorage.getItem(KEY) || 'ltr';
    root.setAttribute('dir', saved);
    updateBtns(saved);

    $$('[data-rtl-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = root.getAttribute('dir') === 'ltr' ? 'rtl' : 'ltr';
        root.setAttribute('dir', next);
        localStorage.setItem(KEY, next);
        updateBtns(next);
      });
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   3. NAV MANAGER
───────────────────────────────────────────────────────────── */
const NavManager = (() => {
  let menuOpen = false;

  function init() {
    const nav       = $('.nav');
    const burger    = $('.nav__hamburger');
    const mobileNav = $('.nav__mobile');
    if (!nav) return;

    // Scroll state
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function openMenu() {
      menuOpen = true;
      burger?.classList.add('open');
      mobileNav?.classList.add('open');
      mobileNav?.setAttribute('aria-hidden', 'false');
      burger?.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      if (!menuOpen) return;
      menuOpen = false;
      burger?.classList.remove('open');
      mobileNav?.classList.remove('open');
      mobileNav?.setAttribute('aria-hidden', 'true');
      burger?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    burger?.addEventListener('click', () => menuOpen ? closeMenu() : openMenu());
    document.addEventListener('click', e => {
      if (menuOpen && !nav.contains(e.target) && !mobileNav?.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 1024) closeMenu(); });

    // Active link highlight (by filename match)
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
   4. REVEAL MANAGER — scroll-triggered fade-ups
───────────────────────────────────────────────────────────── */
const RevealManager = (() => {
  function init() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

    $$('.reveal').forEach(el => io.observe(el));
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   5. PROGRESS MANAGER — campaign progress bars
───────────────────────────────────────────────────────────── */
const ProgressManager = (() => {
  function init() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const fill  = entry.target.querySelector('.progress__fill');
        const width = parseInt(fill?.dataset.width || '0', 10);
        if (fill) setTimeout(() => { fill.style.width = Math.min(width, 100) + '%'; }, 160);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.28 });

    $$('.progress').forEach(el => io.observe(el));

    // Also animate gs-funding and h2-meter fills
    $$('.gs-funding__fill, .h2-meter-fill').forEach(fill => {
      const io2 = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            fill.style.width = fill.dataset.width ? fill.dataset.width + '%' : '100%';
            io2.unobserve(fill);
          }
        });
      }, { threshold: 0.3 });
      io2.observe(fill);
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   6. CAROUSEL MANAGER — testimonials
───────────────────────────────────────────────────────────── */
const CarouselManager = (() => {
  function init() {
    $$('[data-carousel]').forEach(carousel => {
      const track   = carousel.querySelector('.testimonials__track');
      const cards   = $$('.testi-card', carousel);
      const prev    = carousel.querySelector('[data-prev]');
      const next    = carousel.querySelector('[data-next]');
      const dotsWrap = carousel.querySelector('.testi-dots');
      if (!track || !cards.length) return;

      let current = 0;
      let timer;

      // Build dots
      cards.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'testi-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Testimonial ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsWrap?.appendChild(dot);
      });

      function goTo(index) {
        current = Math.max(0, Math.min(index, cards.length - 1));
        const cardW = cards[0].offsetWidth + 16;
        track.style.transform = `translateX(-${current * cardW}px)`;
        $$('.testi-dot', carousel).forEach((d, i) => d.classList.toggle('active', i === current));
      }

      function startAuto() {
        timer = setInterval(() => goTo((current + 1) % cards.length), 5000);
      }
      function stopAuto() { clearInterval(timer); }

      prev?.addEventListener('click', () => { stopAuto(); goTo(current - 1); startAuto(); });
      next?.addEventListener('click', () => { stopAuto(); goTo(current + 1); startAuto(); });

      carousel.addEventListener('mouseenter', stopAuto);
      carousel.addEventListener('mouseleave', startAuto);

      // Touch swipe
      let startX = 0;
      track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
      track.addEventListener('touchend', e => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) { stopAuto(); goTo(diff > 0 ? current + 1 : current - 1); startAuto(); }
      });

      startAuto();
      window.addEventListener('resize', () => goTo(current));
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   7. FEATURE ACCORDION — homepage how-it-works items
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

    // Activate first by default
    if (items[0] && !$$('.feature-item.active').length) items[0].classList.add('active');
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   8. CURSOR MANAGER — custom cursor, desktop only
───────────────────────────────────────────────────────────── */
const CursorManager = (() => {
  function injectStyles() {
    const s = document.createElement('style');
    s.textContent = `
      * { cursor: none !important; }
      .ttf-cursor { position:fixed; top:0; left:0; pointer-events:none; z-index:99999; }
      .ttf-cursor__dot {
        position:absolute; width:5px; height:5px; border-radius:50%;
        background:var(--text-primary); top:-2.5px; left:-2.5px;
        transition:width .2s,height .2s,background .2s;
      }
      .ttf-cursor__ring {
        position:absolute; width:32px; height:32px; border-radius:50%;
        border:1px solid rgba(244,244,244,.22); top:-16px; left:-16px;
        transition:width .35s cubic-bezier(.16,1,.3,1),
                   height .35s cubic-bezier(.16,1,.3,1),
                   border-color .2s;
      }
      .ttf-cursor.hover .ttf-cursor__dot  { width:10px;height:10px;top:-5px;left:-5px;background:var(--accent); }
      .ttf-cursor.hover .ttf-cursor__ring { width:52px;height:52px;top:-26px;left:-26px;border-color:rgba(212,245,60,.3); }
      .ttf-cursor.click .ttf-cursor__ring { width:20px;height:20px;top:-10px;left:-10px; }
      .ttf-cursor.hidden { opacity:0; }
    `;
    document.head.appendChild(s);
  }

  function init() {
    if ('ontouchstart' in window || window.matchMedia('(pointer:coarse)').matches) return;

    injectStyles();

    const cursor = document.createElement('div');
    cursor.className = 'ttf-cursor';
    cursor.innerHTML = '<div class="ttf-cursor__dot"></div><div class="ttf-cursor__ring"></div>';
    document.body.appendChild(cursor);

    const dot  = cursor.querySelector('.ttf-cursor__dot');
    const ring = cursor.querySelector('.ttf-cursor__ring');
    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

    document.addEventListener('mousemove', e => {
      mouseX = e.clientX; mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px,${mouseY}px)`;
    });

    (function animRing() {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.transform = `translate(${ringX}px,${ringY}px)`;
      requestAnimationFrame(animRing);
    })();

    const hoverEls = 'a,button,[role="button"],.campaign-card,.feature-item,.game-card,.testi-card,.post-card';
    $$(hoverEls).forEach(el => {
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
   9. COUNTER MANAGER — data-count animated numbers
───────────────────────────────────────────────────────────── */
const CounterManager = (() => {
  function animate(el) {
    if (el.dataset.animated) return;
    el.dataset.animated = '1';

    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const isFloat = String(el.dataset.count).includes('.');
    const dur = 1800;
    const start = performance.now();

    (function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 5);
      const val = target * eased;
      el.textContent = prefix + (isFloat ? val.toFixed(1) : Math.round(val).toLocaleString()) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  function init() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.5 });

    $$('[data-count]:not([data-animated])').forEach(el => io.observe(el));
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   10. MARQUEE MANAGER — clone track for seamless loop
───────────────────────────────────────────────────────────── */
const MarqueeManager = (() => {
  function init() {
    $$('.marquee-track').forEach(track => {
      if (track.dataset.cloned) return;
      track.dataset.cloned = '1';
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
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function init() {
    $$('[data-newsletter-form]').forEach(form => {
      const input = form.querySelector('input[type="email"]');
      const btn   = form.querySelector('button[type="submit"]');
      if (!input || !btn) return;

      form.addEventListener('submit', e => {
        e.preventDefault();
        const valid = EMAIL_RE.test(input.value.trim());

        input.classList.toggle('error',   !valid);
        input.classList.toggle('success',  valid);

        if (!valid) {
          input.focus();
          return;
        }

        const orig = btn.textContent;
        btn.textContent = 'Subscribed ✓';
        btn.disabled = true;

        setTimeout(() => {
          btn.textContent = orig;
          btn.disabled = false;
          input.value = '';
          input.classList.remove('success');
        }, 3000);
      });
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   12. TIMELINE MANAGER — about page timeline dots
───────────────────────────────────────────────────────────── */
const TimelineManager = (() => {
  function init() {
    const items = $$('.timeline-item');
    if (!items.length) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => e.target.classList.toggle('active', e.isIntersecting));
    }, { threshold: 0.55 });

    items.forEach(item => io.observe(item));
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   13. PARTICLE MANAGER — atmospheric floating particles
   Adds 12–18 tiny glowing dots that slowly float upward
   on specific sections (hero, coming-soon). CSS-only fallback
   does nothing — particles are purely decorative enhancement.
───────────────────────────────────────────────────────────── */
const ParticleManager = (() => {
  const TARGETS = ['.hero', '.cs-page', '.page-hero'];

  // Inject keyframe if not already present
  function ensureKeyframe() {
    if (document.getElementById('ttf-particle-kf')) return;
    const s = document.createElement('style');
    s.id = 'ttf-particle-kf';
    s.textContent = `
      @keyframes ttf-particle-rise {
        0%   { transform: translateY(0)     scale(1)   ; opacity: 0; }
        8%   { opacity: 0.8; }
        85%  { opacity: 0.4; }
        100% { transform: translateY(-130px) scale(0.6); opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  }

  function spawnIn(section) {
    if (section.dataset.particlesAdded) return;
    section.dataset.particlesAdded = '1';

    const count = window.innerWidth < 768 ? 6 : 14;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.setAttribute('aria-hidden', 'true');

      const size  = 2 + Math.random() * 3;        // 2–5px
      const left  = 5 + Math.random() * 90;       // 5%–95%
      const delay = Math.random() * 12;            // 0–12s stagger
      const dur   = 8 + Math.random() * 10;       // 8–18s duration
      const bot   = 5 + Math.random() * 30;       // spawn 5%–35% from bottom
      const glow  = `rgba(212, 245, 60, ${0.25 + Math.random() * 0.35})`;

      Object.assign(p.style, {
        position       : 'absolute',
        width          : `${size}px`,
        height         : `${size}px`,
        borderRadius   : '50%',
        background     : glow,
        boxShadow      : `0 0 ${size * 2}px ${glow}`,
        left           : `${left}%`,
        bottom         : `${bot}%`,
        pointerEvents  : 'none',
        zIndex         : '1',
        animation      : `ttf-particle-rise ${dur}s ${delay}s ease-in-out infinite`,
        willChange     : 'transform, opacity',
      });

      section.appendChild(p);
    }
  }

  function init() {
    // Don't add particles if reduced-motion is requested
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Don't add on mobile for perf
    if (window.innerWidth < 480) return;

    ensureKeyframe();

    TARGETS.forEach(sel => {
      const section = $(sel);
      if (section) spawnIn(section);
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   14. GS TAB MANAGER — game single page tabs
───────────────────────────────────────────────────────────── */
const GsTabManager = (() => {
  function init() {
    const tabs   = $$('.gs-tab');
    const panels = $$('.gs-panel');
    if (!tabs.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t   => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        panels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        const panelId = 'panel-' + tab.dataset.tab;
        const panel = document.getElementById(panelId);
        if (panel) {
          panel.classList.add('active');
          panel.style.animation = 'fade-up .3s cubic-bezier(.16,1,.3,1) both';
        }
      });
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   15. FILTER MANAGER — game/blog filter pills
───────────────────────────────────────────────────────────── */
const FilterManager = (() => {
  function init() {
    // Games filter
    const gamePills = $$('[data-filter]');
    const gameCards = $$('.game-card');
    if (gamePills.length && gameCards.length) {
      gamePills.forEach(pill => {
        pill.addEventListener('click', () => {
          gamePills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');

          const filter = pill.dataset.filter;
          let shown = 0;

          gameCards.forEach(card => {
            const tags  = card.dataset.tags || '';
            const match = filter === 'all' || tags.includes(filter);
            card.style.transition    = 'opacity .2s ease, transform .2s ease';
            card.style.opacity       = match ? '1' : '0.25';
            card.style.pointerEvents = match ? '' : 'none';
            if (match) shown++;
          });

          const count = document.getElementById('results-count');
          if (count) count.textContent = `${shown} game${shown !== 1 ? 's' : ''}`;

          const empty = document.getElementById('empty-state');
          if (empty) empty.style.display = shown === 0 ? 'block' : 'none';
        });
      });
    }

    // Blog filter
    const blogPills = $$('[data-blog-filter]');
    const blogCards = $$('[data-blog-tags]');
    if (blogPills.length && blogCards.length) {
      blogPills.forEach(pill => {
        pill.addEventListener('click', () => {
          blogPills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');

          const filter = pill.dataset.blogFilter;
          let shown = 0;

          blogCards.forEach(card => {
            const tags  = card.dataset.blogTags || '';
            const match = filter === 'all' || tags.includes(filter);
            card.style.transition    = 'opacity .2s ease';
            card.style.opacity       = match ? '1' : '0.2';
            card.style.pointerEvents = match ? '' : 'none';
            if (match) shown++;
          });

          const empty = document.getElementById('blog-empty');
          if (empty) empty.style.display = shown === 0 ? 'block' : 'none';
        });
      });
    }
  }

  // Global reset helpers (called by onclick in HTML)
  window.resetFilter = function() {
    const all = $('[data-filter="all"]');
    if (all) all.click();
  };

  window.resetBlogFilter = function() {
    const all = $('[data-blog-filter="all"]');
    if (all) all.click();
  };

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   16. CONTACT FORM — contact.html validation + submit
───────────────────────────────────────────────────────────── */
const ContactForm = (() => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setValid(groupId, valid, msg = '') {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.classList.toggle('invalid', !valid);
    const err = group.querySelector('.form-error-msg');
    if (err) err.textContent = msg;
  }

  function init() {
    const form    = document.getElementById('contact-form');
    const success = document.getElementById('form-success');
    const resetBtn = document.getElementById('form-reset-btn');
    const submitBtn = document.getElementById('contact-submit');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;

      const first = form.querySelector('#first-name');
      const last  = form.querySelector('#last-name');
      const email = form.querySelector('#email');
      const msg   = form.querySelector('#message');
      const subj  = form.querySelector('#subject');
      const honeypot = form.querySelector('input[name="_honeypot"]');

      if (honeypot?.value.trim()) return;

      if (!first?.value.trim()) { setValid('fg-first', false, 'Please enter your first name.'); ok = false; } else setValid('fg-first', true);
      if (!last?.value.trim())  { setValid('fg-last',  false, 'Please enter your last name.');  ok = false; } else setValid('fg-last',  true);
      if (!EMAIL_RE.test(email?.value.trim() || '')) { setValid('fg-email', false, 'Please enter a valid email.'); ok = false; } else setValid('fg-email', true);
      if (!subj?.value)         { setValid('fg-subject', false, 'Please choose a subject.'); ok = false; } else setValid('fg-subject', true);
      if (!msg?.value.trim())   { setValid('fg-msg',   false, 'Please enter a message.');        ok = false; } else setValid('fg-msg',   true);

      if (!ok) return;

      // Simulate submit
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      setTimeout(() => {
        form.style.display  = 'none';
        if (success) { success.style.display = 'flex'; success.classList.add('visible'); }
      }, 900);
    });

    resetBtn?.addEventListener('click', () => {
      form.reset();
      ['fg-first', 'fg-last', 'fg-email', 'fg-subject', 'fg-msg'].forEach(id => setValid(id, true));
      form.style.display = '';
      if (success) { success.style.display = 'none'; success.classList.remove('visible'); }
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Send message <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg>'; }
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   17. READING PROGRESS — blog single reading bar
───────────────────────────────────────────────────────────── */
const ReadingProgress = (() => {
  function init() {
    window.TTF.readingProgress('#read-progress', '#article-content');
  }
  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   18. FAQ MANAGER — faq.html search filter
───────────────────────────────────────────────────────────── */
const FAQManager = (() => {
  function init() {
    const input = $('input[aria-label="Search FAQ"]');
    const groups = $$('.faq-group');
    if (!input || !groups.length) return;

    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();

      groups.forEach(group => {
        let visibleCount = 0;

        $$('.faq-item', group).forEach(item => {
          const matches = !query || item.textContent.toLowerCase().includes(query);
          item.style.display = matches ? '' : 'none';
          if (query && matches) item.open = true;
          if (!query) item.open = false;
          if (matches) visibleCount++;
        });

        group.style.display = visibleCount ? '' : 'none';
      });
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   19. PAGINATION MANAGER — shared pagination buttons
───────────────────────────────────────────────────────────── */
const PaginationManager = (() => {
  function init() {
    window.TTF.paginationButtons('.blog-pagination .page-btn');
  }
  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   INIT ALL — single DOMContentLoaded
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
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
  ParticleManager.init();
  GsTabManager.init();
  FilterManager.init();
  ContactForm.init();
  ReadingProgress.init();
  FAQManager.init();
  PaginationManager.init();
});
