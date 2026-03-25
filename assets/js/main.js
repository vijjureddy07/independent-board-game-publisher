/**
 * TabletopForge — main.js
 * Handles: theme toggle, RTL, nav scroll, mobile menu,
 *          scroll reveal, testimonial carousel, progress animation,
 *          custom cursor, counter animation, marquee, form validation,
 *          timeline (about page)
 *
 * Pattern: each feature is an IIFE module returning { init }.
 * All modules are initialised in ONE DOMContentLoaded at the bottom.
 * Page-specific modules exit early when their elements aren't present.
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

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
    // React to OS preference change only when user has no saved choice
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

    // Scroll — add .scrolled class
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

    // Close on outside click or Escape
    document.addEventListener('click', e => {
      if (menuOpen && !nav.contains(e.target) && !mobileMenu.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize',   () => { if (window.innerWidth > 768) closeMenu(); });

    // Highlight active page link
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

      // Build dot buttons
      cards.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'testi-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsWrap?.appendChild(dot);
      });

      function goTo(index) {
        current = Math.max(0, Math.min(index, cards.length - 1));
        const gap   = 16; // matches --sp-4
        const cardW = cards[0].offsetWidth + gap;
        track.style.transform = `translateX(-${current * cardW}px)`;
        $$('.testi-dot', carousel).forEach((d, i) => d.classList.toggle('active', i === current));
      }

      prevBtn?.addEventListener('click', () => goTo(current - 1));
      nextBtn?.addEventListener('click', () => goTo(current + 1));

      // Auto-advance; pause on hover
      let timer = setInterval(() => goTo((current + 1) % cards.length), 5000);
      carousel.addEventListener('mouseenter', () => clearInterval(timer));
      carousel.addEventListener('mouseleave', () => {
        timer = setInterval(() => goTo((current + 1) % cards.length), 5000);
      });

      // Touch swipe
      let touchStartX = 0;
      carousel.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
      carousel.addEventListener('touchend',   e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
      });

      // Recalculate offset after window resize
      window.addEventListener('resize', () => goTo(current));
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   7. FEATURE ACCORDION  (how it works section)
───────────────────────────────────────────────────────────── */
const FeatureAccordion = (() => {
  function init() {
    const items = $$('.feature-item');
    if (!items.length) return;

    items[0].classList.add('active');

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

    // Ring follows with eased lag
    (function animateRing() {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      requestAnimationFrame(animateRing);
    })();

    // Hover / click states
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
   9. COUNTER ANIMATION  (data-count elements)
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
      const eased    = 1 - Math.pow(1 - progress, 5); // ease-out quint
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

    $$('[data-count]').forEach(el => observer.observe(el));
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
   Safe on all pages — exits early if no .timeline-item found
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

/**
 * TabletopForge — games.js
 * Handles: games.html filter system, game-single.html tab switcher + thumbnail gallery
 * Loaded after main.js on both pages.
 */


/* ─────────────────────────────────────────────────────────────
   HELPERS (scoped — main.js already defines global $/$$ but
   we redeclare locally so this file is self-contained if ever
   loaded independently)
───────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────
   1. GAMES LISTING — filter pills
───────────────────────────────────────────────────────────── */
const GamesFilter = (() => {
  function init() {
    const pills      = _$$('.filter-pill');
    const cards      = _$$('#games-grid .game-card');
    const countEl    = _$('#results-count');
    const emptyState = _$('#empty-state');
    const grid       = _$('#games-grid');

    if (!pills.length || !cards.length) return;

    function applyFilter(filter) {
      let visible = 0;

      cards.forEach(card => {
        const tags   = card.dataset.tags || '';
        const show   = filter === 'all' || tags.includes(filter);

        // Animate out/in
        card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';

        if (show) {
          card.style.opacity   = '1';
          card.style.transform = 'translateY(0)';
          card.style.display   = '';
          visible++;
        } else {
          card.style.opacity   = '0';
          card.style.transform = 'translateY(12px)';
          // hide after animation
          setTimeout(() => {
            if (card.style.opacity === '0') card.style.display = 'none';
          }, 260);
        }
      });

      // Update count label
      if (countEl) {
        countEl.textContent = visible === 1 ? '1 game' : `${visible} games`;
      }

      // Show/hide empty state
      if (emptyState) {
        emptyState.style.display = visible === 0 ? 'block' : 'none';
      }
    }

    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        // Update active state
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        applyFilter(pill.dataset.filter || 'all');
      });
    });

    // Expose reset for empty-state button
    window.resetFilter = () => {
      pills.forEach(p => p.classList.remove('active'));
      const allPill = _$('[data-filter="all"]');
      if (allPill) allPill.classList.add('active');
      applyFilter('all');
    };
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   2. GAME SINGLE — tab switcher
───────────────────────────────────────────────────────────── */
const GameTabs = (() => {
  function init() {
    const tabs   = _$$('.gs-tab');
    const panels = _$$('.gs-panel');

    if (!tabs.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;

        // Update tab states
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        // Swap panels with fade
        panels.forEach(panel => {
          if (panel.id === `panel-${target}`) {
            panel.classList.add('active');
            panel.style.animation = 'fade-up 0.35s cubic-bezier(0.16,1,0.3,1) both';
          } else {
            panel.classList.remove('active');
          }
        });
      });

      // Keyboard left/right navigation between tabs
      tab.addEventListener('keydown', e => {
        const idx    = tabs.indexOf(tab);
        let   next   = -1;
        if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
        if (e.key === 'ArrowLeft')  next = (idx - 1 + tabs.length) % tabs.length;
        if (next >= 0) { e.preventDefault(); tabs[next].focus(); tabs[next].click(); }
      });
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   3. GAME SINGLE — thumbnail strip interaction
───────────────────────────────────────────────────────────── */
const GalleryThumbs = (() => {
  function init() {
    const thumbs = _$$('.gs-thumb');
    if (!thumbs.length) return;

    thumbs.forEach(thumb => {
      const activate = () => {
        thumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        // In a real implementation this would swap the main cover image
      };

      thumb.addEventListener('click', activate);
      thumb.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      });
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   4. GAME SINGLE — pledge tier selection
───────────────────────────────────────────────────────────── */
const PledgeTiers = (() => {
  function init() {
    const tiers = _$$('.gs-tier');
    if (!tiers.length) return;

    tiers.forEach(tier => {
      tier.addEventListener('click', () => {
        tiers.forEach(t => t.classList.remove('selected'));
        tier.classList.add('selected');
        tier.style.borderColor = 'var(--border-hover)';
      });
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   INIT — runs after DOMContentLoaded (main.js fires first)
   We listen for DOMContentLoaded too — if already fired (script
   loaded async) we run immediately.
───────────────────────────────────────────────────────────── */
function initGamesModules() {
  GamesFilter.init();
  GameTabs.init();
  GalleryThumbs.init();
  PledgeTiers.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGamesModules);
} else {
  initGamesModules();
}

/**
 * TabletopForge — blog.js
 * Handles: blog.html  → category filter, search, pagination
 *          blog-single → reading progress bar, TOC active highlight, share button
 * Loaded after main.js on both pages.
 * Each module exits silently when its elements aren't present.
 */

/* ─────────────────────────────────────────────────────────────
   1. BLOG LISTING — category filter pills
───────────────────────────────────────────────────────────── */
const BlogFilter = (() => {
  function init() {
    const pills      = _$$('[data-blog-filter]');
    const cards      = _$$('#blog-grid .post-card');
    const emptyState = _$('#blog-empty');

    if (!pills.length || !cards.length) return;

    function applyFilter(filter) {
      let visible = 0;

      cards.forEach(card => {
        const tags = card.dataset.blogTags || '';
        const show = filter === 'all' || tags.includes(filter);

        card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';

        if (show) {
          card.style.opacity   = '1';
          card.style.transform = 'translateY(0)';
          card.removeAttribute('hidden');
          visible++;
        } else {
          card.style.opacity   = '0';
          card.style.transform = 'translateY(10px)';
          setTimeout(() => {
            if (card.style.opacity === '0') card.setAttribute('hidden', '');
          }, 260);
        }
      });

      if (emptyState) emptyState.style.display = visible === 0 ? 'block' : 'none';
    }

    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        applyFilter(pill.dataset.blogFilter);
      });
    });

    // Expose for the empty-state reset button
    window.resetBlogFilter = () => {
      pills.forEach(p => p.classList.remove('active'));
      const allPill = _$('[data-blog-filter="all"]');
      if (allPill) allPill.classList.add('active');
      applyFilter('all');
    };
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   2. BLOG LISTING — live search
───────────────────────────────────────────────────────────── */
const BlogSearch = (() => {
  function init() {
    const input      = _$('input[type="search"]');
    const cards      = _$$('#blog-grid .post-card');
    const emptyState = _$('#blog-empty');

    if (!input || !cards.length) return;

    input.addEventListener('input', () => {
      const query   = input.value.trim().toLowerCase();
      let   visible = 0;

      cards.forEach(card => {
        const title   = card.querySelector('.post-card__title')?.textContent.toLowerCase() || '';
        const excerpt = card.querySelector('.post-card__excerpt')?.textContent.toLowerCase() || '';
        const show    = !query || title.includes(query) || excerpt.includes(query);

        card.style.transition = 'opacity 0.2s ease';
        card.style.opacity    = show ? '1' : '0';
        card.style.display    = show ? '' : 'none';
        if (show) visible++;
      });

      if (emptyState) emptyState.style.display = visible === 0 ? 'block' : 'none';
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   3. BLOG LISTING — pagination buttons (visual only, no routing)
───────────────────────────────────────────────────────────── */
const BlogPagination = (() => {
  function init() {
    const btns = _$$('.page-btn');
    if (!btns.length) return;

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Skip prev/next icon buttons from getting active state
        if (btn.querySelector('i')) return;
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Scroll to top of post grid smoothly
        _$('#blog-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   4. BLOG SINGLE — reading progress bar
───────────────────────────────────────────────────────────── */
const ReadingProgress = (() => {
  function init() {
    const fill    = _$('#read-progress');
    const article = _$('#article-content');

    if (!fill || !article) return;

    function update() {
      const rect     = article.getBoundingClientRect();
      const total    = article.offsetHeight - window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      const pct      = Math.min(100, total > 0 ? (scrolled / total) * 100 : 0);
      fill.style.width = pct.toFixed(1) + '%';
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   5. BLOG SINGLE — table of contents active highlight
───────────────────────────────────────────────────────────── */
const TocHighlight = (() => {
  function init() {
    const tocLinks = _$$('.bs-toc__item');
    if (!tocLinks.length) return;

    // Collect section headings from hrefs
    const sections = tocLinks
      .map(link => {
        const href = link.getAttribute('href');
        const el   = href ? _$(href) : null;
        return el ? { link, el } : null;
      })
      .filter(Boolean);

    if (!sections.length) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const match = sections.find(s => s.el === entry.target);
        if (!match) return;
        if (entry.isIntersecting) {
          tocLinks.forEach(l => l.classList.remove('active'));
          match.link.classList.add('active');
        }
      });
    }, { rootMargin: '0px 0px -60% 0px', threshold: 0 });

    sections.forEach(({ el }) => observer.observe(el));
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   6. BLOG SINGLE — share buttons
───────────────────────────────────────────────────────────── */
const ShareButtons = (() => {
  function init() {
    const btns = _$$('.bs-share__btn');
    if (!btns.length) return;

    const url   = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const icon = btn.querySelector('i');
        if (!icon) return;

        if (icon.classList.contains('fa-x-twitter')) {
          window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank', 'noopener');
        } else if (icon.classList.contains('fa-linkedin-in')) {
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener');
        } else if (icon.classList.contains('fa-link')) {
          // Copy link to clipboard
          navigator.clipboard?.writeText(window.location.href).then(() => {
            const origClass = icon.className;
            icon.className  = 'fa-solid fa-check';
            btn.style.borderColor = 'var(--accent-border)';
            setTimeout(() => {
              icon.className    = origClass;
              btn.style.borderColor = '';
            }, 2000);
          });
        }
      });
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   7. SIDEBAR TAG PILLS — click copies tag to filter (listing page)
───────────────────────────────────────────────────────────── */
const SidebarTags = (() => {
  function init() {
    const tags = _$$('.sidebar-tag');
    if (!tags.length) return;

    tags.forEach(tag => {
      tag.addEventListener('click', () => {
        // Map tag text to filter key
        const map = {
          'Designer Diary'   : 'designer-diary',
          'Campaign Update'  : 'campaign',
          'Playtesting'      : 'playtest',
          'Studio Life'      : 'studio',
          'Community'        : 'community',
        };
        const key  = map[tag.textContent.trim()];
        const pill = key ? _$(`[data-blog-filter="${key}"]`) : null;
        if (pill) {
          pill.click();
          pill.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────────── */
function initBlogModules() {
  BlogFilter.init();
  BlogSearch.init();
  BlogPagination.init();
  ReadingProgress.init();
  TocHighlight.init();
  ShareButtons.init();
  SidebarTags.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBlogModules);
} else {
  initBlogModules();
}
/**
 * TabletopForge — contact.js
 * Handles: contact form validation + submission feedback,
 *          message character counter, FAQ accordion,
 *          copy-to-clipboard on contact details
 */

'use strict';

const _$ = (sel, ctx = document) => ctx.querySelector(sel);
const _$$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ─────────────────────────────────────────────────────────────
   1. CONTACT FORM — validation + submission state
───────────────────────────────────────────────────────────── */
const ContactForm = (() => {

  const RULES = {
    'contact-name'   : { min: 2,   msg: 'Please enter your name (at least 2 characters).' },
    'contact-email'  : { email: true, msg: 'Please enter a valid email address.' },
    'contact-subject': { required: true, msg: 'Please select a subject.' },
    'contact-message': { min: 20,  msg: 'Message must be at least 20 characters.' },
  };

  function validate(field) {
    const rule  = RULES[field.id];
    const val   = field.value.trim();
    const group = field.closest('.form-group');
    const err   = group?.querySelector('.form-error-msg');

    if (!rule) return true;

    let valid = true;
    let msg   = '';

    if (rule.required && !val) {
      valid = false; msg = rule.msg;
    } else if (rule.min && val.length < rule.min) {
      valid = false; msg = rule.msg;
    } else if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      valid = false; msg = rule.msg;
    }

    field.classList.toggle('error',   !valid);
    field.classList.toggle('success',  valid && val.length > 0);
    if (err) { err.textContent = msg; err.style.display = valid ? 'none' : 'block'; }

    return valid;
  }

  function init() {
    const form = _$('#contact-form');
    if (!form) return;

    // Live validation on blur
    Object.keys(RULES).forEach(id => {
      const field = _$(`#${id}`);
      if (!field) return;
      field.addEventListener('blur',  () => validate(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('error')) validate(field);
      });
    });

    // Submit
    form.addEventListener('submit', e => {
      e.preventDefault();

      // Validate all fields
      const allValid = Object.keys(RULES).every(id => {
        const f = _$(`#${id}`);
        return f ? validate(f) : true;
      });

      if (!allValid) return;

      const btn     = form.querySelector('button[type="submit"]');
      const success = _$('#form-success');
      const origTxt = btn.innerHTML;

      // Loading state
      btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending…';
      btn.disabled  = true;

      // Simulate async send (replace with real endpoint)
      setTimeout(() => {
        btn.innerHTML = origTxt;
        btn.disabled  = false;
        form.reset();
        // Reset validation states
        _$$('.form-input, .form-textarea, .form-select', form).forEach(f => {
          f.classList.remove('success', 'error');
        });
        if (success) {
          success.style.display = 'flex';
          setTimeout(() => { success.style.display = 'none'; }, 5000);
        }
      }, 1400);
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   2. MESSAGE CHARACTER COUNTER
───────────────────────────────────────────────────────────── */
const CharCounter = (() => {
  function init() {
    const textarea = _$('#contact-message');
    const counter  = _$('#char-counter');
    const MAX      = 1000;

    if (!textarea || !counter) return;

    textarea.setAttribute('maxlength', MAX);

    function update() {
      const remaining = MAX - textarea.value.length;
      counter.textContent = `${textarea.value.length} / ${MAX}`;
      counter.style.color = remaining < 50
        ? 'var(--accent)'
        : 'var(--text-muted)';
    }

    textarea.addEventListener('input', update);
    update();
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   3. FAQ ACCORDION
───────────────────────────────────────────────────────────── */
const FaqAccordion = (() => {
  function init() {
    const items = _$$('.faq-item');
    if (!items.length) return;

    items.forEach(item => {
      const trigger = item.querySelector('.faq-question');
      const body    = item.querySelector('.faq-answer');
      if (!trigger || !body) return;

      trigger.setAttribute('aria-expanded', 'false');

      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all
        items.forEach(i => {
          i.classList.remove('open');
          i.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
        });

        // Open clicked (if it was closed)
        if (!isOpen) {
          item.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });

      // Keyboard
      trigger.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger.click(); }
      });
    });

    // Open first by default
    items[0]?.querySelector('.faq-question')?.click();
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   4. COPY-TO-CLIPBOARD on contact detail items
───────────────────────────────────────────────────────────── */
const CopyDetails = (() => {
  function init() {
    _$$('[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.copy;
        if (!text || !navigator.clipboard) return;

        navigator.clipboard.writeText(text).then(() => {
          const icon  = btn.querySelector('i');
          const orig  = icon?.className || '';
          if (icon) icon.className = 'fa-solid fa-check';
          btn.style.color = 'var(--accent)';

          setTimeout(() => {
            if (icon) icon.className = orig;
            btn.style.color = '';
          }, 2000);
        });
      });
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────────── */
function initContactModules() {
  ContactForm.init();
  CharCounter.init();
  FaqAccordion.init();
  CopyDetails.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContactModules);
} else {
  initContactModules();
}
