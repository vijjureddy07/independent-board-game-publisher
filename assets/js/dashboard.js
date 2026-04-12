/**
 * TabletopForge — dashboard.js
 * Shared dashboard behavior for designer and admin pages.
 *
 * Responsibilities:
 *   - Sidebar toggle and mobile overlay
 *   - Active panel switching
 *   - Counter and mini-chart animation
 *   - Mobile header normalization for nested dashboard pages
 *   - Admin search and lightweight notification state
 */

'use strict';

const _$ = (sel, ctx = document) => (window.$ || ((s, c) => c.querySelector(s)))(sel, ctx);
const _$$ = (sel, ctx = document) => (window.$$ || ((s, c) => [...c.querySelectorAll(s)]))(sel, ctx);

const DASH_BRAND_NAME = 'TabletopForge';
const DASH_BRAND_MARKUP = `
  <div class="dash-logo__mark" aria-hidden="true">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 16l-1.447.724a1 1 0 0 0-.553.894V20h12v-2.382a1 1 0 0 0-.553-.894L16 16"></path>
      <path d="M8 16V9a4 4 0 0 1 8 0v7"></path>
      <path d="M9 9h6"></path>
      <circle cx="12" cy="6" r="1"></circle>
    </svg>
  </div>
  <span class="dash-logo__text">${DASH_BRAND_NAME}</span>
`;

function createDashBrand(className) {
  const link = document.createElement('a');
  link.href = 'index.html';
  link.className = className;
  link.setAttribute('aria-label', `${DASH_BRAND_NAME} — Back to site`);
  link.innerHTML = DASH_BRAND_MARKUP;
  return link;
}

function ensureSidebarBrand() {
  _$$('#dash-sidebar, #dash-sidebar-admin').forEach(sidebar => {
    if (_$('.dash-logo', sidebar)) return;
    sidebar.insertBefore(createDashBrand('dash-logo'), sidebar.firstChild);
  });
}

function ensureSidebarUtilities() {
  _$$('#dash-sidebar, #dash-sidebar-admin').forEach(sidebar => {
    if (_$('.dash-sidebar__utilities', sidebar)) return;

    const utilities = document.createElement('div');
    utilities.className = 'dash-sidebar__utilities';
    utilities.innerHTML = `
      <button class="dash-sidebar__utility-btn" data-theme-toggle data-theme-label="Theme" type="button">Theme</button>
      <button class="dash-sidebar__utility-btn" data-rtl-toggle type="button">RTL</button>
    `;

    const brand = _$('.dash-logo', sidebar);
    if (brand && brand.nextSibling) {
      sidebar.insertBefore(utilities, brand.nextSibling);
    } else if (brand) {
      sidebar.appendChild(utilities);
    } else {
      sidebar.insertBefore(utilities, sidebar.firstChild);
    }
  });
}

function normalizeUserTopbar() {
  const row = _$('.dash-sidebar-toggle-row');
  if (!row) return;

  _$$('.dash-sidebar-toggle-row__title', row).forEach(title => title.remove());

  let brand = _$('.dash-topbar__brand', row);
  if (!brand) {
    brand = createDashBrand('dash-topbar__brand');
    const toggle = _$('#sidebar-toggle', row) || _$('.dash-sidebar-toggle', row);
    if (toggle) {
      row.insertBefore(brand, toggle);
    } else {
      row.appendChild(brand);
    }
  }
}

function normalizeAdminTopbar() {
  const topbar = _$('#admin-main .dash-topbar');
  if (!topbar) return;

  let identity = _$('.dash-topbar__identity', topbar);
  if (!identity) {
    identity = document.createElement('div');
    identity.className = 'dash-topbar__identity';
    topbar.insertBefore(identity, topbar.firstChild);
  }

  let brand = _$('.dash-topbar__brand', topbar);
  if (!brand) {
    brand = createDashBrand('dash-topbar__brand');
  }
  if (brand.parentElement !== identity) {
    identity.appendChild(brand);
  }

  const title = _$('.dash-topbar__title', topbar);
  if (title && title.parentElement !== identity) {
    identity.appendChild(title);
  }

  const toggle = _$('#admin-sidebar-toggle', topbar);
  if (toggle && toggle.parentElement !== topbar) {
    topbar.appendChild(toggle);
  }

  _$$(':scope > div[style]', topbar).forEach(wrapper => {
    if (wrapper === identity) return;
    if (!wrapper.children.length && !wrapper.textContent.trim()) {
      wrapper.remove();
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   MOBILE HEADER SYNC
───────────────────────────────────────────────────────────── */
function syncMobileDashboardHeader() {
  normalizeUserTopbar();
  normalizeAdminTopbar();
}

/* ─────────────────────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────────────────────── */
const DashSidebar = (() => {
  function init() {
    const sidebar = _$('#dash-sidebar') || _$('#dash-sidebar-admin');
    const toggle  = _$('#sidebar-toggle') || _$('#admin-sidebar-toggle');
    if (!sidebar || !toggle) return;

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:149;display:none;opacity:0;transition:opacity 0.25s ease;';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);

    function open() {
      sidebar.classList.add('open');
      overlay.style.display = 'block';
      requestAnimationFrame(() => { overlay.style.opacity = '1'; });
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      sidebar.classList.remove('open');
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.style.display = 'none'; }, 260);
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', () => {
      sidebar.classList.contains('open') ? close() : open();
    });

    overlay.addEventListener('click', close);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) close();
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   PANELS
───────────────────────────────────────────────────────────── */
const DashPanels = (() => {

  function switchTo(panelId, navItems, panels, titleEl, dataAttr) {
    navItems.forEach(item => {
      const key = item.dataset[dataAttr];
      item.classList.toggle('active', key === panelId);
      item.setAttribute('aria-current', key === panelId ? 'page' : '');
    });

    const idPrefix = dataAttr === 'panel' ? 'dash-panel-' : 'admin-panel-';
    panels.forEach(panel => {
      const isTarget = panel.id === `${idPrefix}${panelId}`;
      panel.classList.toggle('active', isTarget);
      if (isTarget) {
        panel.style.animation = 'fade-up 0.35s cubic-bezier(0.16,1,0.3,1) both';
        animateCounters(panel);
        animateChartBars(panel);
      }
    });

    if (titleEl) {
      const link = _$(`[data-${dataAttr.replace(/([A-Z])/g, '-$1').toLowerCase()}="${panelId}"]`);
      if (link) {
        const text = link.textContent
          .replace(/\d[\d,.KkMm%+\-]*/g, '')
          .trim()
          .split('\n')[0]
          .trim();
        titleEl.textContent = text;
      }
    }

    syncMobileDashboardHeader();

    history.replaceState(null, '', `#${panelId}`);
  }

  function init() {
    const userItems  = _$$('[data-panel]');
    const userPanels = _$$('#dash-main .dash-page');
    const userTitle  = _$('#dash-page-title');

    if (userItems.length) {
      userItems.forEach(item => {
        item.addEventListener('click', e => {
          const href = item.getAttribute('href');
          if (href && !href.startsWith('#')) return;
          e.preventDefault();
          const id = item.dataset.panel;
          if (id) switchTo(id, userItems, userPanels, userTitle, 'panel');
        });
      });

      const hash = location.hash.slice(1);
      if (hash && _$(`[data-panel="${hash}"]`)) {
        switchTo(hash, userItems, userPanels, userTitle, 'panel');
      }
    }

    const adminItems  = _$$('[data-admin-panel]');
    const adminPanels = _$$('#admin-main .dash-page');
    const adminTitle  = _$('#admin-page-title');

    if (adminItems.length) {
      adminItems.forEach(item => {
        item.addEventListener('click', e => {
          const href = item.getAttribute('href');
          if (href && !href.startsWith('#')) return;
          e.preventDefault();
          const id = item.dataset.adminPanel;
          if (id) switchTo(id, adminItems, adminPanels, adminTitle, 'adminPanel');
        });
      });

      const hash = location.hash.slice(1);
      if (hash && _$(`[data-admin-panel="${hash}"]`)) {
        switchTo(hash, adminItems, adminPanels, adminTitle, 'adminPanel');
      }
    }
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   COUNTERS
───────────────────────────────────────────────────────────── */
function animateCounters(scope = document) {
  _$$('[data-count]:not([data-animated])', scope).forEach(el => {
    el.dataset.animated = '1';

    const target  = parseFloat(el.dataset.count);
    const prefix  = el.dataset.prefix  || '';
    const suffix  = el.dataset.suffix  || '';
    const isFloat = String(el.dataset.count).includes('.');
    const dur     = 1200;
    const start   = performance.now();

    function frame(now) {
      const p    = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      const val  = target * ease;
      const disp = isFloat
        ? val.toFixed(1)
        : Math.round(val).toLocaleString();
      el.textContent = prefix + disp + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  });
}

/* ─────────────────────────────────────────────────────────────
   CHART BARS
───────────────────────────────────────────────────────────── */
function animateChartBars(scope = document) {
  _$$('.mini-bar:not([data-animated])', scope).forEach((bar, i) => {
    bar.dataset.animated = '1';
    const targetH = bar.style.height;
    bar.style.height = '0%';
    bar.style.transition = `height 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 35}ms`;
    requestAnimationFrame(() => { bar.style.height = targetH; });
  });
}

/* ─────────────────────────────────────────────────────────────
   NOTIFICATIONS
───────────────────────────────────────────────────────────── */
const DashNotifications = (() => {
  function init() {
    const markBtn = document.querySelector('.dash-card__header button[type="button"]');
    if (!markBtn) return;

    markBtn.addEventListener('click', () => {
      _$$('.notif-item.unread').forEach(item => {
        item.classList.remove('unread');
        const dot = item.querySelector('.notif-item__dot');
        if (dot) {
          dot.style.background = 'var(--border-hover)';
          dot.style.boxShadow  = 'none';
        }
      });

      const badge = _$('[data-panel="messages"] .dash-nav__badge');
      if (badge) badge.textContent = '0';
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   ADMIN SEARCH
───────────────────────────────────────────────────────────── */
const AdminSearch = (() => {
  function init() {
    const input = _$('.dash-search-input');
    if (!input) return;

    const items = _$$('[data-admin-panel]');

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      items.forEach(item => {
        item.style.opacity = (!q || item.textContent.toLowerCase().includes(q)) ? '' : '0.3';
      });
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        input.value = '';
        items.forEach(i => { i.style.opacity = ''; });
      }
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────────── */
function initDashModules() {
  ensureSidebarBrand();
  ensureSidebarUtilities();
  syncMobileDashboardHeader();
  window.TTF?.syncThemeControls?.();
  window.TTF?.syncDirControls?.();
  DashSidebar.init();
  DashPanels.init();
  DashNotifications.init();
  AdminSearch.init();

  const activePanel = _$('.dash-page.active');
  if (activePanel) {
    animateCounters(activePanel);
    animateChartBars(activePanel);
  }

  syncMobileDashboardHeader();
  window.addEventListener('resize', syncMobileDashboardHeader, { passive: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashModules);
} else {
  initDashModules();
}
