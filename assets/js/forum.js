/**
 * TabletopForge — forum.js
 * Handles:
 *   forum.html        → category toggle, thread filter pills, search, pagination
 *   forum-thread.html → reply composer char count + auto-resize, post actions
 *                       (like / quote), reading progress bar
 *
 * Depends on: main.js  (window.TTF.readingProgress, window.TTF.paginationButtons)
 * Loaded after main.js on both forum pages.
 * All modules exit silently when their elements aren't present.
 *
 * DUPLICATE REMOVALS vs previous version:
 *   - ThreadReadProgress  → replaced by window.TTF.readingProgress() from main.js
 *   - ForumPagination     → replaced by window.TTF.paginationButtons() from main.js
 *   - Local _$/_$$ helpers → delegate to window.$/$$ set by main.js
 */

'use strict';

/* ─── Helpers — delegate to main.js globals, fall back if standalone ───── */
const _$ = (sel, ctx = document) => (window.$ || ((s, c) => c.querySelector(s)))(sel, ctx);
const _$$ = (sel, ctx = document) => (window.$$ || ((s, c) => [...c.querySelectorAll(s)]))(sel, ctx);

/* ─────────────────────────────────────────────────────────────
   1. FORUM LISTING — thread filter pills (All / Hot / Unanswered)
───────────────────────────────────────────────────────────── */
const ForumFilter = (() => {
  function init() {
    const pills   = _$$('.blog-section .filter-pill, .section-head .filter-pill');
    const threads = _$$('.thread-item');

    if (!pills.length) return;

    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const filter = pill.textContent.trim().toLowerCase();

        threads.forEach(thread => {
          const statText = thread.querySelector('.thread-item__stats')?.textContent || '';
          const replies  = parseInt(statText.match(/\d+/)?.[0] || '0', 10);

          let show = true;
          if (filter === 'hot')        show = replies >= 20;
          if (filter === 'unanswered') show = replies === 0;

          thread.style.transition    = 'opacity 0.2s ease';
          thread.style.opacity       = show ? '1' : '0.3';
          thread.style.pointerEvents = show ? '' : 'none';
        });
      });
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   2. FORUM LISTING — live search through thread titles
───────────────────────────────────────────────────────────── */
const ForumSearch = (() => {
  function init() {
    const input   = _$('input[type="search"]');
    const threads = _$$('.thread-item');

    if (!input || !threads.length) return;

    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();

      threads.forEach(thread => {
        const title = thread.querySelector('.thread-item__title')?.textContent.toLowerCase() || '';
        const show  = !query || title.includes(query);

        thread.style.transition    = 'opacity 0.2s ease';
        thread.style.opacity       = show ? '1' : '0.3';
        thread.style.pointerEvents = show ? '' : 'none';
      });
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   3. FORUM LISTING — category card hover effect (mobile UX)
───────────────────────────────────────────────────────────── */
const ForumCategories = (() => {
  function init() {
    const cats = _$$('.forum-cat');
    if (!cats.length) return;

    cats.forEach(cat => {
      const icon = cat.querySelector('.forum-cat__icon');
      if (!icon) return;
      cat.addEventListener('mouseenter', () => { icon.style.borderColor = 'var(--border-hover)'; });
      cat.addEventListener('mouseleave', () => { icon.style.borderColor = ''; });
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   4. THREAD PAGE — reply textarea auto-resize + char counter + submit
───────────────────────────────────────────────────────────── */
const ReplyComposer = (() => {
  function init() {
    const textarea = _$('.reply-textarea');
    if (!textarea) return;

    // Auto-resize
    function resize() {
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(120, textarea.scrollHeight) + 'px';
    }
    textarea.addEventListener('input', resize);

    // Character counter
    const MAX_CHARS = 2000;
    const counter   = document.createElement('p');
    counter.style.cssText = 'font-size:0.72rem;color:var(--text-muted);text-align:right;margin-bottom:var(--sp-2);';
    counter.textContent   = `0 / ${MAX_CHARS}`;
    textarea.insertAdjacentElement('afterend', counter);

    textarea.addEventListener('input', () => {
      const len = textarea.value.length;
      counter.textContent = `${len} / ${MAX_CHARS}`;
      counter.style.color = len > MAX_CHARS * 0.9
        ? (len > MAX_CHARS ? '#E85454' : '#F5C84A')
        : 'var(--text-muted)';

      const submitBtn = _$('.reply-box .btn--primary');
      if (submitBtn) submitBtn.disabled = len > MAX_CHARS;
    });

    // Submit handler
    const form      = textarea.closest('.reply-box');
    const submitBtn = form?.querySelector('.btn--primary');

    submitBtn?.addEventListener('click', e => {
      e.preventDefault();
      const val = textarea.value.trim();
      if (!val) {
        textarea.style.borderColor = '#E85454';
        textarea.focus();
        return;
      }
      if (val.length > MAX_CHARS) return;

      addReplyToThread(val);
      textarea.value             = '';
      textarea.style.height      = '120px';
      counter.textContent        = `0 / ${MAX_CHARS}`;
      textarea.style.borderColor = '';
    });
  }

  function addReplyToThread(content) {
    const container = _$('#article-content');
    const replyBox  = _$('.reply-box');
    if (!container || !replyBox) return;

    const entry = document.createElement('article');
    entry.className = 'post-entry';
    entry.style.animation = 'fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both';
    entry.innerHTML = `
      <div class="post-entry__head">
        <div class="post-entry__avatar" aria-label="You">JD</div>
        <div>
          <p class="post-entry__author">
            James D.
            <span style="font-size:0.65rem;font-family:var(--font-head);font-weight:700;color:var(--text-muted);margin-left:6px;">You</span>
          </p>
          <p class="post-entry__time">
            <i class="fa-regular fa-clock" style="font-size:10px;" aria-hidden="true"></i>
            Just now
          </p>
        </div>
        <div class="post-entry__actions">
          <button class="post-action-btn" type="button" aria-label="Like post">
            <i class="fa-regular fa-heart"></i>
          </button>
          <button class="post-action-btn" type="button" aria-label="Edit post">
            <i class="fa-solid fa-pen"></i>
          </button>
        </div>
      </div>
      <div class="post-entry__body">
        ${content.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')}
      </div>
    `;

    container.insertBefore(entry, replyBox);

    // Bind cursor hover on new post's action buttons
    _$$('.post-action-btn', entry).forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        document.querySelector('.custom-cursor')?.classList.add('hover');
      });
      btn.addEventListener('mouseleave', () => {
        document.querySelector('.custom-cursor')?.classList.remove('hover');
      });
    });

    // Re-run PostActions on the new entry so like/quote work
    PostActions.bindEntry(entry);

    entry.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   5. THREAD PAGE — post action buttons (like, quote)
───────────────────────────────────────────────────────────── */
const PostActions = (() => {
  function bindEntry(post) {
    // Like button toggle
    const likeBtn = post.querySelector('[aria-label="Like post"]');
    if (likeBtn) {
      likeBtn.addEventListener('click', () => {
        const icon  = likeBtn.querySelector('i');
        if (!icon) return;
        const liked = icon.classList.contains('fa-solid');
        icon.classList.toggle('fa-regular', liked);
        icon.classList.toggle('fa-solid',   !liked);
        likeBtn.style.color = liked ? '' : 'var(--accent)';
      });
    }

    // Quote button — copies author + text into reply textarea
    const quoteBtn = post.querySelector('[aria-label="Quote post"]');
    if (quoteBtn) {
      quoteBtn.addEventListener('click', () => {
        const author   = post.querySelector('.post-entry__author')?.textContent.trim().split('\n')[0].trim() || 'User';
        const bodyEls  = _$$('.post-entry__body p', post);
        const bodyText = bodyEls.map(p => p.textContent.trim()).join('\n');
        const quoted   = `> ${author} wrote:\n> ${bodyText.split('\n').join('\n> ')}\n\n`;

        const textarea = _$('.reply-textarea');
        if (textarea) {
          textarea.value += quoted;
          textarea.focus();
          textarea.dispatchEvent(new Event('input'));
          textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }

  function init() {
    _$$('.post-entry').forEach(post => bindEntry(post));
  }

  return { init, bindEntry };
})();

/* ─────────────────────────────────────────────────────────────
   INIT
   Reading progress and pagination are handled by shared utilities
   in main.js (window.TTF) to avoid code duplication.
───────────────────────────────────────────────────────────── */
function initForumModules() {
  ForumFilter.init();
  ForumSearch.init();
  ForumCategories.init();
  ReplyComposer.init();
  PostActions.init();

  // Shared utilities from main.js — no-op silently if elements absent
  window.TTF?.readingProgress('#read-progress', '#article-content');
  window.TTF?.paginationButtons('.blog-pagination .page-btn', '.thread-list');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initForumModules);
} else {
  initForumModules();
}