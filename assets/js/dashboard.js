/**
 * TabletopForge — dashboard.js
 * Handles: dashboard-user.html + dashboard-admin.html
 *
 * Modules:
 *   DashSidebar      — mobile open/close + overlay
 *   DashPanels       — sidebar link → panel switching (user + admin)
 *   DashBars         — mini bar chart animation on scroll entry
 *   DashModeration   — approve/delete in forum moderation queue
 *   DashToggles      — settings page toggle switch animation
 *   DashNotifications — mark-all-read on user dashboard
 *
 * Each module exits silently when its elements aren't present —
 * safe to load on both dashboard pages.
 */

'use strict';

const _$ = (sel, ctx = document) => ctx.querySelector(sel);
const _$$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ─────────────────────────────────────────────────────────────
   1. SIDEBAR  — mobile open / close + overlay
───────────────────────────────────────────────────────────── */
const DashSidebar = (() => {
  function init() {
    const sidebar = _$('#dash-sidebar') || _$('#dash-sidebar-admin');
    const toggle  = _$('#sidebar-toggle') || _$('#admin-sidebar-toggle');

    if (!sidebar || !toggle) return;

    // Backdrop overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'display:none',
      'position:fixed',
      'inset:0',
      'background:rgba(0,0,0,0.5)',
      'z-index:499',
      'backdrop-filter:blur(2px)',
    ].join(';');
    document.body.appendChild(overlay);

    function open() {
      sidebar.classList.add('open');
      overlay.style.display = 'block';
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      sidebar.classList.remove('open');
      overlay.style.display = 'none';
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', () => sidebar.classList.contains('open') ? close() : open());
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 900) close(); });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   2. PANEL SWITCHING  (user + admin, unified handler)
───────────────────────────────────────────────────────────── */
const DashPanels = (() => {

  function switchTo(panelId, navItems, panels, titleEl, labelText) {
    // Deactivate all
    navItems.forEach(i => i.classList.remove('active'));
    panels.forEach(p => { p.classList.remove('active'); p.style.animation = ''; });

    // Activate matching nav items
    navItems.forEach(i => {
      const key = i.dataset.panel || i.dataset.adminPanel;
      if (key === panelId) i.classList.add('active');
    });

    // Activate panel
    const target = _$(`#dash-panel-${panelId}`) || _$(`#admin-panel-${panelId}`);
    if (target) {
      target.classList.add('active');
      // Trigger reflow then animate
      void target.offsetWidth;
      target.style.animation = 'fade-up 0.3s cubic-bezier(0.16,1,0.3,1) both';
    }

    // Update topbar title
    if (titleEl && labelText) titleEl.textContent = labelText;
  }

  function init() {

    // ── USER DASHBOARD ──────────────────────────────────────────
    const userItems  = _$$('[data-panel]');
    const userPanels = _$$('#dash-main .dash-page');

    if (userItems.length && userPanels.length) {
      userItems.forEach(item => {
        item.addEventListener('click', e => {
          const id = item.dataset.panel;
          if (!id) return;
          e.preventDefault();
          switchTo(id, userItems, userPanels, null, null);
          // Close mobile sidebar
          _$('#dash-sidebar')?.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    }

    // ── ADMIN DASHBOARD ─────────────────────────────────────────
    const adminItems  = _$$('[data-admin-panel]');
    const adminPanels = _$$('#admin-main .dash-page');
    const titleEl     = _$('#admin-page-title');

    if (adminItems.length && adminPanels.length) {
      adminItems.forEach(item => {
        item.addEventListener('click', e => {
          const id = item.dataset.adminPanel;
          if (!id) return;
          e.preventDefault();
          // Build a readable label from inner text
          const label = item.textContent.replace(/\d+/g, '').trim();
          switchTo(id, adminItems, adminPanels, titleEl, label);
          _$('#dash-sidebar-admin')?.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    }
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   3. MINI BAR CHART  — staggered entrance animation
───────────────────────────────────────────────────────────── */
const DashBars = (() => {
  function init() {
    const chart = _$('.mini-chart');
    if (!chart) return;

    const bars = _$$('.mini-bar', chart);
    if (!bars.length) return;

    // Store target heights and reset to 0
    const targets = bars.map(b => b.style.height);
    bars.forEach(b => { b.style.height = '0%'; });

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        bars.forEach((bar, i) => {
          bar.style.transition = `height 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 35}ms`;
          // Double rAF ensures transition fires after height:0 is painted
          requestAnimationFrame(() => requestAnimationFrame(() => {
            bar.style.height = targets[i];
          }));
        });

        observer.unobserve(chart);
      });
    }, { threshold: 0.2 });

    observer.observe(chart);
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   4. FORUM MODERATION  — approve / delete with slide-out
───────────────────────────────────────────────────────────── */
const DashModeration = (() => {
  function animateOut(row, direction) {
    row.style.transition = 'opacity 0.28s ease, transform 0.28s ease, max-height 0.3s ease 0.1s, padding 0.3s ease 0.1s';
    row.style.opacity    = '0';
    row.style.transform  = direction === 'right' ? 'translateX(14px)' : 'translateX(-14px)';
    setTimeout(() => {
      row.style.maxHeight = '0';
      row.style.padding   = '0';
      row.style.overflow  = 'hidden';
      setTimeout(() => row.remove(), 320);
    }, 200);
  }

  function init() {
    _$$('.forum-row').forEach(row => {
      row.querySelectorAll('[aria-label="Approve post"]').forEach(btn => {
        btn.addEventListener('click', () => animateOut(row, 'left'));
      });
      row.querySelectorAll('[aria-label="Delete post"]').forEach(btn => {
        btn.addEventListener('click', () => animateOut(row, 'right'));
      });
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   5. SETTINGS TOGGLES  — checkbox ↔ visual switch sync
───────────────────────────────────────────────────────────── */
const DashToggles = (() => {
  function init() {
    _$$('input[type="checkbox"]').forEach(cb => {
      const label = cb.closest('label');
      if (!label) return;

      const spans = label.querySelectorAll('span');
      const track = spans[0];
      const thumb = spans[1];
      if (!track || !thumb) return;

      track.style.transition = 'background 0.2s';
      thumb.style.transition = 'transform 0.2s';

      function sync() {
        track.style.background = cb.checked ? 'var(--text-primary)' : 'var(--border-hover)';
        thumb.style.transform  = cb.checked ? 'translateX(20px)'    : 'translateX(0)';
      }

      sync();
      cb.addEventListener('change', sync);
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   6. NOTIFICATIONS  — mark-all-read on user dashboard
───────────────────────────────────────────────────────────── */
const DashNotifications = (() => {
  function init() {
    // Find the mark-all-read button by its text
    const btn = Array.from(_$$('button')).find(
      el => el.textContent.trim().startsWith('Mark all read')
    );
    if (!btn) return;

    btn.addEventListener('click', () => {
      _$$('.notif-item.unread').forEach(item => {
        item.classList.remove('unread');
        const dot = item.querySelector('.notif-item__dot');
        if (dot) dot.style.background = 'var(--border-hover)';
      });
      btn.innerHTML = 'All read <i class="fa-solid fa-check" aria-hidden="true"></i>';
      btn.style.color = '#5EE89A';
      btn.disabled = true;
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────────── */
function initDashModules() {
  DashSidebar.init();
  DashPanels.init();
  DashBars.init();
  DashModeration.init();
  DashToggles.init();
  DashNotifications.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashModules);
} else {
  initDashModules();
}