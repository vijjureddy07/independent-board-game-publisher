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
│   │   ├── style.css            Main stylesheet + bundled page sections
│   │   ├── dark-mode.css        Dark-mode component refinements
│   │   ├── rtl.css              Right-to-left layout overrides
│   │   └── atmosphere.css       Atmosphere layers + theme-specific accents
│   └── js/
│       ├── main.js              Core UI, filters, forms, FAQ search, reading progress
│       ├── dashboard.js         Dashboard panels, sidebar, charts
│       ├── forum.js             Forum filter, thread reply composer
│       └── plugins/             Third-party JS plugins
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
│   ├── dashboard-admin.html     Admin overview
│   ├── dashboard-admin-*.html   Dedicated admin section pages
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
--text-secondary: #A3A3A3
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

### Page-Specific Styles

Page-specific sections are bundled directly into `assets/css/style.css`.
There are no separate `games.css`, `blog.css`, `dashboard.css`, or
`visual-overhaul.css` files in the current repo layout.

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
| `FAQManager` | FAQ search filter |
| `ContactForm` | Contact page validation + success state |

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
4. Add `atmosphere.css` after the shared CSS imports if the page uses atmosphere layers
5. Add the page to `sitemap.xml`
6. Add a footer link if it's a public-facing page
