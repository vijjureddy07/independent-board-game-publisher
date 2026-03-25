# TabletopForge — Independent Board Game Publisher Template

**Version:** 2.0 · **Last Updated:** March 2026 · **Stack:** HTML5 · CSS3 · Vanilla JS

---

## Quick Start

```bash
# Open the project in a browser (no build step needed)
open pages/index.html

# Or serve locally with any static server:
npx serve .
python3 -m http.server 8000
```

---

## Project Structure

```
Independent Board Game Publisher/
├── assets/
│   ├── css/
│   │   ├── style.css            Main styles + design tokens
│   │   ├── dark-mode.css        Dark-mode component refinements
│   │   ├── rtl.css              Right-to-left layout overrides
│   │   ├── visual-overhaul.css  ← Section gradients, accent expansion, page-specific styles
│   │   ├── games.css            Games listing + game single page
│   │   ├── blog.css             Blog listing + blog single page
│   │   ├── dashboard.css        Dashboard shell (user + admin)
│   │   ├── contact.css          Contact page form styles
│   │   ├── remaining-pages.css  Coming soon, 404, forum, profile, dashboard
│   │   └── index-2.css          Home page 2 specific styles
│   └── js/
│       ├── main.js              Core: theme, nav, carousel, counters, reveals
│       ├── dashboard.js         Dashboard panels, sidebar, charts
│       ├── forum.js             Forum filter, thread reply composer
│       ├── games.js             Game filter pills
│       └── blog.js              Blog filter, reading progress
├── pages/
│   ├── index.html               Home Page 1 (editorial hero)
│   ├── home-page-2.html         Home Page 2 (campaign-focused)
│   ├── about.html               Studio story, team, timeline
│   ├── games.html               Games catalogue listing
│   ├── game-single.html         Individual game / campaign page
│   ├── blog.html                Blog listing
│   ├── blog-single.html         Single article
│   ├── contact.html             Contact form + info
│   ├── forum.html               Community forum listing
│   ├── forum-thread.html        Single forum thread
│   ├── faq.html                 FAQ accordion
│   ├── coming-soon.html         Pre-launch countdown page
│   ├── dashboard-user.html      Backer portal
│   ├── dashboard-admin.html     Admin panel
│   ├── profile.html             User profile + settings
│   ├── login.html               Auth page
│   ├── careers.html             Jobs page
│   ├── press-kit.html           Media assets + press info
│   ├── retailer-info.html       Wholesale information
│   ├── shipping-status.html     Public shipping tracker
│   ├── privacy-policy.html      GDPR privacy policy
│   ├── terms-conditions.html    Terms of service
│   ├── 404.html                 Error page
│   ├── sidebar-user.html        Dashboard sidebar partial
│   ├── sidebar-admin.html       Admin sidebar partial
│   └── _nav.html                Shared nav partial reference
├── documentation/
│   ├── README.md                ← You are here
│   └── customization-guide.md  Colours, fonts, content guide
├── robots.txt
├── sitemap.xml
└── TODO.md
```

---

## CSS Architecture

### Design Tokens (style.css :root)

```css
/* Primary colours */
--bg-primary    : #0A0A0A   /* Page background */
--bg-secondary  : #111111   /* Raised surfaces */
--bg-card       : #161616   /* Cards */
--text-primary  : #F4F4F4
--text-secondary: #777777
--accent        : #D4F53C   /* Lime green — use sparingly */

/* Spacing (8px base) */
--sp-1 through --sp-9 (4px → 96px)

/* Radius */
--r-sm: 6px  --r-md: 10px  --r-lg: 16px  --r-xl: 24px

/* Transitions */
--t-fast: 0.18s ease
--t-mid : 0.32s ease
--t-slow: 0.55s cubic-bezier(0.16, 1, 0.3, 1)
```

### Adding `visual-overhaul.css` to new pages

Every page that needs section backgrounds and accent expansion should load this file:

```html
<link rel="stylesheet" href="../assets/css/visual-overhaul.css" />
```

Add it **after** all other CSS files.

---

## Theme Toggle

Handled by `ThemeManager` in `main.js`. Any element with `data-theme-toggle` 
becomes a toggle button. Reads system preference on first load, persists to `localStorage`.

```html
<button data-theme-toggle type="button">Toggle theme</button>
```

---

## RTL Support

Toggle with any `data-rtl-toggle` element. Full RTL overrides in `rtl.css`.

---

## Form Integrations (Placeholder Ready)

| Form | Integration | How to activate |
|------|------------|-----------------|
| Contact | Formspree | Change `action` on `#contact-form` |
| Newsletter | Mailchimp | Replace form submit handler in `main.js` → `NewsletterForm` |
| Notify (Coming Soon) | Same as newsletter | `data-newsletter-form` selector |
| Login | Any auth API | Replace `setTimeout` in `login.html` script |

---

## JavaScript Modules (main.js)

| Module | Purpose |
|--------|---------|
| `ThemeManager` | Dark/light toggle + system detection |
| `RTLManager` | Direction toggle |
| `NavManager` | Scroll state, mobile drawer, active link |
| `RevealManager` | Intersection observer scroll reveals |
| `ProgressManager` | Campaign funding bar animation |
| `CarouselManager` | Testimonials auto-advance + touch |
| `FeatureAccordion` | Homepage feature items |
| `CursorManager` | Custom cursor (desktop only) |
| `CounterManager` | data-count animated numbers |
| `MarqueeManager` | Infinite scroll ticker |
| `NewsletterForm` | Email validation + submit |
| `TimelineManager` | About page timeline dot highlights |

---

## Responsive Breakpoints

```
Mobile : < 640px
Tablet : 640px – 1024px
Desktop: 1024px – 1280px
Large  : > 1280px
```

---

## SEO Checklist

- [x] Unique `<title>` and `<meta name="description">` on every page
- [x] Proper H1 → H2 → H3 heading hierarchy
- [x] All images/icons have `aria-label` or `aria-hidden`
- [x] JSON-LD structured data on `index.html`
- [x] `robots.txt` configured
- [x] `sitemap.xml` includes all public pages
- [x] Semantic HTML elements (`<article>`, `<section>`, `<nav>`, `<main>`)
- [x] WCAG 2.1 AA — focus-visible, keyboard navigation, screen reader labels

---

## Adding a New Page

1. Copy the closest existing page as a template
2. Update `<title>`, `<meta name="description">`, `<link rel="canonical">`
3. Mark the active nav link: `class="nav__link active"`
4. Add `visual-overhaul.css` to the CSS imports
5. Add the page to `sitemap.xml`
6. Add a footer link if it's a public-facing page