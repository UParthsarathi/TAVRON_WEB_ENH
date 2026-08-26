# Tavron Engineers — website

Static HTML site for Tavron Engineers (Chennai, India), a manufacturer of process
equipment and turnkey plants for the dairy, food, beverage and chemical industry.
Deployed on Vercel. No build step — the files in the repo root are what ship.

## Running it locally

The header and footer are injected at runtime by jQuery `$.load()` from
`templates/`, which is an AJAX request. **`file://` will not work** — the nav and
footer will be blank. Always serve over HTTP:

```bash
python3 -m http.server 8000
```

## Layout

- `*.html` in the repo root — one file per page, no router, no includes at build time
- `templates/_header.html`, `templates/_footer.html` — shared chrome, injected by
  `assets/js/main.js` via the `data-load` attribute on `<header>` / `<footer>`.
  The `data-active-menu` attribute names the `<li>` id to highlight.
- `assets/css/style.css` — the original BootstrapMade "Company v2.0.1" template.
  Green (`#1bbd36`) accent. Still governs every page that is not on the modern layer.
- `assets/css/tavron-modern.css` + `assets/js/tavron-modern.js` — the 2026 redesign.
- `assets/vendor/` — bundled jQuery, Bootstrap 4, AOS, icofont, boxicons, remixicon
- `downloads/` — ~50 MB of product-brochure PDFs
- `old-site/` — the previous site, kept for reference, `noindex` via `vercel.json`

## The modern layer — read this before editing any page

The redesign is **opt-in per page** and scoped to `<body class="tv">`. Every rule in
`tavron-modern.css` is prefixed with `.tv`, so pages without that class are
completely unaffected and keep the old green template look.

Pages currently on the modern layer:

- `index.html`
- `bulkCoolers.html`

To migrate another page, add three things:

1. `class="tv"` on `<body>`
2. `<link href="assets/css/tavron-modern.css" rel="stylesheet">` — **after** `style.css`
3. `<script src="assets/js/tavron-modern.js"></script>` — **after** `main.js`

Do not un-scope those rules, and do not edit `assets/css/style.css` to achieve a
modern-layer effect. That file is shared with ~40 unmigrated pages and changing it
breaks them silently.

### Specificity trap

`.tv a { color: var(--accent-700) }` has specificity (0,1,1) and will beat a bare
`.tv-btn--primary { color: #fff }` at (0,1,0). Every button and link-style class in
`tavron-modern.css` is therefore written as `.tv .tv-btn--primary`. Keep that prefix
when adding new ones, or your button text silently turns teal.

### Vendor scripts are load-bearing

`assets/js/main.js` calls `.isotope()`, `.venobox()` and `.waypoint()` at top level.
Removing those vendor `<script>` tags from a page throws a TypeError that kills the
rest of `main.js`, including the header injection. Keep the full vendor block on
every page even when the page does not use those plugins.

### JS conventions in `tavron-modern.js`

Vanilla JS, no dependencies, IIFE, no framework. Behaviour is wired by data
attributes so markup stays declarative:

- `.tv-reveal` — fades in on scroll via IntersectionObserver. `data-d="1..4"` staggers.
- `[data-count]` — animated counter. `data-suffix`, `data-prefix`, `data-group="true"`.
- `[data-viewer]` — product image viewer; `[data-viewer-stage]` is the big image,
  `[data-viewer-thumb]` with `data-src` are the thumbnails.
- `[data-lightbox]` — click to enlarge; the attribute value is the full-size URL.
- `.tv-hero__slide` — crossfading hero backgrounds, `.is-active` marks the current one.

Everything respects `prefers-reduced-motion`.

## Content rules

Product copy comes from the client and describes real equipment. **Do not invent
specifications, capacities, standards, certifications or client names.** If a number
is not in the repo or in a document the client supplied, ask rather than guess.

Facts that are established and safe to reuse: ISO 9001:2015 certified, founded 2004,
Chennai, 20,000 sq.ft factory, 5,500 sq.ft shop floor, ~74 client logos in
`assets/img/clients/`.

## Known repo quirks

- The remixicon font files were originally committed as `remixicon.woff2@t=1587359857360`
  (the `?` in the URL became `@`), so every `ri-*` icon on the site 404'd and rendered
  blank. Correctly named copies now sit alongside them. Do not delete either set —
  `remixicon.css` still requests the `?t=` query form.
- This is an old remixicon build. Several modern class names do not exist in it
  (`ri-shield-check-line`, `ri-draft-line`, `ri-verified-badge-line`,
  `ri-dashboard-3-line`, `ri-snowflake-line`). Grep `remixicon.css` for
  `^\.ri-NAME:before` before using an icon class.
- `assets/img/logo.png` has a white background, not transparency. For dark headers use
  `assets/img/logo-white.png` as a CSS background behind the hidden `<img>` — do not
  try `filter: brightness(0) invert(1)`, which renders a solid white rectangle.
- Dimension data on product pages should be real HTML tables. The original site baked
  those tables into JPEGs, which is unreadable on mobile and invisible to search.

## Before committing

Serve the site and check the pages you touched at 1440px and 390px for:
console errors, failed requests, and horizontal overflow
(`document.documentElement.scrollWidth - clientWidth` should be `0`).
