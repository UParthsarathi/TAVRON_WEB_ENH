# Next.js migration plan

Convert the static HTML site to Next.js + React + TypeScript + Tailwind, over several
sessions, **without changing the design at all**.

## The one rule

The design must not change at all ("not even 0.001 percent", the user's words). The
method is a straight translation: each page's HTML becomes React, the CSS files and
images ship unchanged.

**How it is proven (changed 2026-11-08):** same final page markup + same CSS + same
assets = same rendering. So the gate is **markup**: for every page, the DOM the browser
ends up with on the new site must equal the old one (whitespace-normalised, scripts
stripped), at 1440px and 390px and in the interaction states listed below. Screenshots
are still taken and compared, but with a small anti-aliasing tolerance, as a visual
check. The old 0-pixel screenshot gate was dropped because Chrome is not pixel-stable
on its own: two captures of the *same* old site differed on 12 pages. A step is not done
until its markup matches. If a change alters the markup or visibly moves anything, it is
reverted, not argued.

## Status

Update this table at the end of every session.

Sessions were re-planned on 2026-11-08: about **4 sessions** for Steps 2–8. Session 1
also finished Step 5, so about **2 more**.

| Step | What | Session | State | Commit |
|---|---|---|---|---|
| 0 | Branch `nextjs`, tag `legacy-html` | – | done | `51c0dcc` |
| 1 | Visual test harness (screenshots + page markup) | – | done; markup gate + pixel tolerance since session 1 | `51c0dcc`, `f9e084f` |
| 2 | `next/` folder: Next.js scaffold, static files copied into `next/public/`, `.html` URLs kept | 1 | done | `f9e084f` |
| 3 | Root layout, Header, Footer, mobile nav as components | 1 | done | `f9e084f` |
| 4 | HTML-to-JSX converter, pilot on `bulkCoolers.html` | 1 | done | `f9e084f` |
| 5 | Convert the other 34 pages | 1 | done, all 35 pages × all states match | `f9e084f` |
| 6 | Replace jQuery + `main.js` + `tavron-modern.js` + `validate.js` with React | 2 | not started | |
| 7 | Performance: drop vendor JS/CSS, self-host fonts, bundle CSS | 3 | not started | |
| 8 | Production build, Lighthouse before/after, preview deploy | 3 | not started | |


Could stretch if the menu and contact form need extra care (Step 6). Going live waits on
the user.

**Next action:** Session 2 = Step 6. Read "Interim behaviour" under Decisions and the
Session 1 log entry first. Ends with `components/LegacyScripts.tsx` deleted, no jQuery
loaded, and the full diff still 348/348.

## How to resume in a new session

1. Read this file. Check the status table and the session log at the bottom.
2. `git checkout nextjs` and `git log --oneline -5`. The last commit should match the table.
3. **Re-capture the reference at the start of every session that compares anything.**
   Chrome auto-updates, and a new Chrome can move pixels on its own. Reference and
   candidate must come from the same Chrome, so never compare against an old reference.
   The commands are under "Visual test harness" (about 4 minutes).
4. Do the next step. At the end: run the full diff, update the table and the log,
   commit, and push to `origin`.

Everything a later session needs is in the repo (scripts, this file) or can be
rebuilt from the `legacy-html` tag. Nothing load-bearing lives in a session scratchpad.

## Decisions (made, do not re-open)

| Area | Decision | Why |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript, Node 22+ | Every page is prerendered to static HTML at build time; it is already on Vercel |
| Styling | Tailwind v4 installed **without Preflight**; existing CSS ships unchanged | Preflight resets margins, borders, images and would change the design. Unlayered existing CSS beats Tailwind's layered utilities, so installing it changes nothing |
| CSS files | Steps 2–6: served as the same files from `public/` via `<link>`, in the same order. Step 7 may bundle them, only if the diff stays 0 | Bundling and minifying can reorder or merge rules |
| URLs | **Unchanged.** `/bulkCoolers.html` keeps working via `next.config.ts` rewrites; canonicals unchanged | Zero SEO risk. Clean URLs are a later, separate decision |
| Route names | One folder per page with the same name: `app/bulkCoolers/page.tsx`, `app/ButterProcessing/page.tsx` | Rewrite is a single rule `/:page.html` → `/:page`, plus `/index.html` → `/` |
| Images | Byte-identical, plain `<img>` | WebP/AVIF re-encoding changes pixels. Deferred |
| Folder (2026-11-08) | The Next.js app lives in **`next/`** inside this repo. The old static site stays at the repo root, untouched, and keeps deploying until switch-over | Both versions side by side in one repo on GitHub; switching is one Vercel setting (Root Directory → `next`) |
| Static files | `assets/`, `downloads/`, `news/`, `old-site/` **copied** into `next/public/` unchanged; `vercel.json` noindex header kept | Same URLs, same bytes; the old site keeps its own copy until switch-over |
| `templates/` | Not used by `next/`; Header/Footer become components (Step 3) | The old site at the root still needs them |
| Branch | `nextjs` off `bmc-five-sections`. Commit **and push to `origin`** (`UParthsarathi/TAVRON_WEB_ENH`) at the end of each session. Ask before deploying | Work must never again live on one disk only. Ajay's repo (`AjayCs2311/TAVRON_WEB_ENH`) and the live site untouched |
| Translation (2026-11-08) | By script, never by hand. Hand-fixing the output is not allowed: fix the converter and re-run | 35 pages, ~8,400 lines; one fix in the script fixes every page |
| Proof (2026-11-08) | Markup gate, screenshots as visual check with tolerance (see "The one rule") | Chrome is not pixel-stable between two runs of the same page |
| `tavron-web` folder | `C:\Users\pavan\Tavron\tavron-web` (Oct 22, Supabase + admin, no design, new URLs) is **not** used. Parked; its CMS/admin ideas could be a phase after the port | It is a different product, not a translation |
| Converter | Node script using `parse5` (spec-compliant HTML parser) | Produces the exact tree a browser builds (implied `<tbody>`, closed `<p>`), so the JSX matches the real DOM |
| Test tooling | `playwright-core` driving the installed Chrome (no browser download), `pixelmatch` + `pngjs` | Small dev dependencies only |
| Tailwind import (session 1) | Installed (`tailwindcss`, `@tailwindcss/postcss`, `postcss.config.mjs`, `app/tailwind.css` without Preflight) but **not imported** | Importing adds a `/_next/static/css` `<link>` to `<head>`, which changes the markup. Import it with the first utility class |
| Head order (session 1) | Each page renders its own `<title>`, meta and canonical; the layout renders the favicon and preconnect links *after* `{children}` in `<body>`; stylesheets stay in the layout's `<head>`. No `metadata` export | React 19 hoists title/meta/link into `<head>` in render order, ahead of the stylesheets. Next's metadata API reorders tags and drops `og:type=product` |
| Viewport (session 1) | `viewport` export with `initialScale: "1.0"` (string cast) | The old pages say `initial-scale=1.0`; a number serialises as `1` |
| `data-aos-*` on `<body>` (session 1) | Rendered statically by the layout (`ease`, `1000`, `0`) | `AOS.init()` in `main.js` left them on every old page, so they are in the reference markup. Nothing uses them; removing them is a separate decision |
| Interim behaviour (session 1, until Step 6) | `components/LegacyScripts.tsx` loads, **after hydration**, `jquery`, `jquery.easing`, `validate.js`, then attaches the 3 mobile-nav handlers copied unchanged from `main.js`, then loads `tavron-modern.js`. `main.js` itself is not loaded | `main.js` would inject the header a second time and clone a second mobile nav. Before hydration, `tavron-modern.js` would edit the DOM React is about to adopt (the marquee duplication would force a client re-render). The rest of the vendor block only served `main.js` (finding 9); leaving it out changed no markup and no pixel |

## What the port must reproduce (found by reading the code)

These are non-obvious. Getting any of them wrong breaks the one rule.

1. **Nested header and footer.** `main.js` runs `$(header).load(...)` into the existing
   `<header id="header" data-load=… data-active-menu=… class="fixed-top">`. The template is
   itself a `<header id="header" class="fixed-top">`, so the live DOM is a header *inside*
   a header. Same for `<footer id="footer">` inside `<footer id="footer">`. CSS for
   `#header` and `#footer` applies to both levels. Reproduce the nesting exactly.
2. **Active menu.** The `<li>` whose id matches `data-active-menu` gets `class="active"`.
   28 pages set it. 7 do not (no item is active there).
3. **Mobile nav is built at runtime.** After the header loads, `main.js` clones
   `.nav-menu` as `<nav class="mobile-nav d-lg-none">` (duplicate ids included), puts
   `<button class="mobile-nav-toggle d-lg-none"><i class="icofont-navigation-menu">` as
   the **first** child of `<body>`, and appends `<div class="mobile-nav-overly">`.
   Body order at the end: content…, `.tv-lightbox` (if any), `.mobile-nav`, `.mobile-nav-overly`.
   Behaviour: the toggle flips `body.mobile-nav-active` and swaps the icon to
   `icofont-close`. The overlay is toggled with jQuery `toggle()` and closed with
   `fadeOut()`. A dropdown `<a>` does `slideToggle(300)` on its submenu and toggles
   `.active` on its `<li>`. A click outside closes the menu.
4. **Body class** is the same on all 35 pages: `tv tv--light-top tv-numbered`. The root
   layout can own it.
5. **`tavron-modern.js` behaviours:**
   - `#header` (the outer one) gets `tv-header--solid` when `scrollY > 60`.
   - `.tv-reveal` gets `is-in` on intersection.
   - `[data-count]` counters (none on any page today).
   - `.tv-hero__slide` crossfade every 6 s (index only).
   - `[data-viewer]` thumbnails (1 page).
   - `[data-lightbox]` (30 pages, 157 triggers): appends `<div class="tv-lightbox">` to body
     and sets `cursor: zoom-in` inline on each trigger.
   - `.tv-marquee__track` innerHTML is duplicated once (index).
   - All of it respects `prefers-reduced-motion`.
6. **Whitespace.** HTML keeps a space between inline elements across a line break, but
   JSX drops it. Example: the `&middot;` separators between the phone links in the footer.
   The converter must keep every whitespace text node that renders. It must drop them only
   where the browser ignores them and React errors on them: `table`/`tbody`/`thead`/`tr`
   and SVG containers outside `<text>`. No CSS on the site uses `white-space: pre*`, so
   collapsing whitespace runs to one space is safe.
7. **Per-page bits to keep:** the WhatsApp link (its `?text=` differs per page), inline
   `style` attributes (21 on 4 pages: drawing-sheet rulers, hero slides, SVG text), and
   JSON-LD (`bulkCoolers.html`, must stay word-for-word with its FAQ). Also head tags:
   title, description, canonical, Open Graph, theme-color, favicons.
8. **Fonts.** Only Inter and Sora are loaded (Google Fonts, `display=swap`). `style.css`
   names Open Sans, Roboto and Poppins, which are **not** loaded and render as the
   fallback. Do not "fix" that, because it would change the design.
9. **Unused vendor code.** No element on any page uses AOS (`data-aos`), isotope, owl
   carousel, venobox, waypoints, jquery-sticky, ekko-lightbox, Bootstrap JS
   (`data-toggle`), the hero carousels or `.back-to-top`. Their scripts load only
   because `main.js` calls them at top level. `animate.css`, `venobox.css` and `aos.css`
   style only classes that never appear. All can go in Step 7, behind the diff.
10. **Contact form** (`contact.html`): `validate.js` checks `data-rule`/`data-msg` and
    POSTs urlencoded `name, email, subject, message` to
    `https://us-central1-tavron-3fa96.cloudfunctions.net/sendMailOverHTTP`. A response that
    starts with `Sent!` shows `.sent-message`. **Existing bug:** the error branch uses an
    undefined `msg`, so a failed send throws and shows nothing. Ported as-is unless the
    user says fix it (open question below).
11. **Google Maps iframe** on `contact.html` is third-party and varies run to run. Mask it in
    the diff.
12. **Remixicon quirk** (see CLAUDE.md): both font file sets stay in `public/`.

## Visual test harness (Step 1, reused by every later step)

Lives in `scripts/visual/`. Output goes to `.migration/` (git-ignored).

```bash
npm run legacy:export                    # .migration/legacy = files of the legacy-html tag
npm run legacy:serve                     # http://localhost:8000 (leave running)
npm run visual:capture -- --out .migration/reference
# candidate: regenerate the pages, build, serve on 3000
npm run convert                          # root *.html + templates/ -> next/app, next/components/generated
cd next && npm ci && npx next build && npx next start -p 3000   # (leave running)
npm run visual:capture -- --base http://localhost:3000 --out .migration/candidate
npm run visual:compare -- --a .migration/reference --b .migration/candidate
# one page while iterating:  add  --pages bulkCoolers.html  to the candidate capture
```

- **Server:** `scripts/visual/serve.mjs`, not `python -m http.server`. Python's listen
  backlog is 5, so parallel captures got `ERR_CONNECTION_REFUSED` on random files.
- **Compare:** markup must be equal line for line (the gate). Screenshots: `pixelmatch`
  with colour threshold 0.1 and anti-aliasing ignored, at most 150 differing pixels per
  shot (`--threshold`, `--max-px`). Reference vs reference left up to 86 stray glyph
  pixels in nav text on 2026-11-08; `--max-px 0` shows the raw counts. Every failure
  writes a diff PNG to `.migration/diff/`.
  It also flags console errors and failed requests that the candidate has and the
  reference does not, and any horizontal overflow.
- **Captured per page, at 1440×900 and 390×844, DPR 1:**
  - full page, top of document, `prefers-reduced-motion: reduce` (all reveals shown,
    nothing animating)
  - first viewport with normal motion
  - viewport after scrolling 400px (solid header)
- **Interaction states** (pages that have them): mobile menu open (390), a mobile
  dropdown expanded, desktop dropdown hovered (1440), lightbox open, viewer thumbnail 2
  selected, contact form submitted empty (validation messages).
- **Stability:** Chrome runs with `--force-color-profile=srgb --disable-gpu
  --font-render-hinting=none`. The harness waits for the injected header/footer,
  `document.fonts.ready` and every image. It switches `loading="lazy"` images to eager
  first, because lazy images that sit off-screen (the logo marquee) never load otherwise.
  CSS animations are frozen (`animations: "disabled"`). A shot of index.html is refused,
  and the page retried, if the 6 s hero crossfade has already ticked. The contact form
  endpoint is blocked inside the harness, so no test run can send an email.
- **Determinism check:** capture the reference twice. The two runs' *markup* must match.
  (Their pixels did not on 2026-11-06, which is why the pixel gate was dropped.)
- **Also recorded per page:** the final page markup (whitespace-normalised, scripts
  stripped), console errors, failed requests, and horizontal overflow
  (`scrollWidth - clientWidth`, must be 0). The markup is compared too: text or
  attribute drift that happens not to show in a screenshot still counts as a failure.

## Steps in detail

**Step 0 – Branch and tag.** Tag the current commit `legacy-html`. Create branch
`nextjs`. Add `.migration/` to `.gitignore`.
*Done when:* the tag and branch exist and the export of the tag serves the old site.

**Step 1 – Harness and reference.** Create `package.json` with the dev dependencies above
and write `scripts/visual/capture.mjs` and `compare.mjs`. Capture the reference twice and
compare them.
*Done when:* reference vs reference markup matches on every page and state.

**Step 2 – Scaffold.** Create `next/` with its own `package.json`: Next.js 16, React 19,
TypeScript and Tailwind v4 (no Preflight). Copy the static files into `next/public/`. Add
the `next.config.ts` rewrites. Use a placeholder layout. The root `package.json` keeps
only the test harness.
*Done when:* `next build` passes, `/assets/...`, `/downloads/...` and `/old-site/...` are
served byte-identical, and `/bulkCoolers.html` resolves.

**Step 3 – Shell.** Add `app/layout.tsx` with the same head (fonts `<link>`, the 7 vendor
CSS files, `style.css`, `tavron-modern.css`, favicons). Add `components/Header.tsx` with
an `activeMenu` prop, `Footer.tsx`, and the mobile toggle, nav and overlay in the body
order described above. Static markup only; behaviour comes in Step 6. Old scripts are
still loaded as files where needed, so pages keep working in between.
*Done when:* the header and footer markup diff to 0 against the reference markup.

**Step 4 – Converter and pilot.** Write `scripts/convert/html-to-jsx.mjs`, built on
parse5. It maps attributes (`class`→`className`, `for`→`htmlFor`, SVG kebab→camel,
`style` string→object), handles whitespace (finding 6) and entities, and drops comments.
It extracts head tags into `export const metadata` and JSON-LD into a `<script>`. Run it
on `bulkCoolers.html` only.
*Done when:* `/bulkCoolers.html` markup matches in every state and the screenshots
pass the tolerance check.

**Step 5 – All pages.** Run the converter on the other 34 pages. Diff, fix the
converter (not the output by hand), and re-run until everything matches.
*Done when:* all 35 pages × all states match.

**Step 6 – Behaviour in React.** Small client components replace jQuery: header solid on
scroll, reveal, hero crossfade, viewer, lightbox, marquee, mobile nav (slideToggle
re-done with the Web Animations API, same 300 ms; note that `jquery.easing` is loaded, which
turns jQuery's `swing` into `easeOutQuad`, so that is the curve to match), contact form
(same validation, same endpoint, same messages). Delete `components/LegacyScripts.tsx`; the
old files in `public/` stay until Step 7.
First extend `capture.mjs` to write markup in every interaction state too (today it writes
it once, initial state at 1440). Until now the behaviour was the old jQuery code itself;
from Step 6 on, inline styles and classes left by the menu, overlay, viewer and lightbox
have to be proven equal.
*Done when:* every interaction state matches, no console errors, and the form test-posts
successfully (ask before sending a real email).

**Step 7 – Performance.** Remove one item at a time, re-diffing after each: unused
vendor JS (finding 9), the 3 unused vendor stylesheets, Google Fonts → `next/font`
(subsets `latin` + `latin-ext`), CSS bundled through Next. Anything that moves a pixel
goes back.
*Done when:* full diff passes and the removed list is recorded in the log.

**Step 8 – Ship check.** Run a production build and Lighthouse (mobile and desktop) on
5 representative pages, old vs new. Run the CLAUDE.md checks (console, failed requests,
overflow). Update CLAUDE.md for the new structure (how to run it, where things live).
*Done when:* the numbers are recorded below and the user approves a preview deploy.

## Deferred (separate decisions, after Step 8)

- Rewrite CSS into Tailwind utilities, page by page, guarded by the same diff harness
- Images to WebP/AVIF via `next/image` (changes pixels slightly; needs sign-off)
- Clean URLs (`/bulk-milk-coolers`) with 301s from the `.html` URLs
- Split repeated page markup into components (cards, spec tables)
- Fix the contact-form error bug (finding 10)
- The drawing-sheet redesign of the remaining pages continues in the new stack

## Open questions for the user

- Contact form error bug: keep identical (default) or fix?
- `tavron-web` folder: parked by default (see Decisions). Delete it, or keep for a later CMS phase?
- Ajay's `home-equipment-photos` branch (30,000 sq.ft, 400+ customers; local branch here,
  not pushed): fold into the site before or after the port?

## Session log

<!-- One entry per session: date, steps done, commit, anything the next session must know. -->

- 2026-11-06: plan written. No code changed.
- 2026-11-06 (in `C:\Users\pavan\TAVRON_WEB_ENH_AjayCs2311`, not committed there):
  Step 0 done: tag `legacy-html` (annotated, on `97d2cbc`), branch `nextjs`,
  `.migration/` ignored. Step 1: `package.json` and `scripts/visual/*` written, reference
  captured twice. **The two runs did not match** on 12 pages: about, cipsystem, clients,
  contact, evaporators, KhovaProcessing, LiquidEggProcessing, news, PaneerProcessing,
  plateheat, pumps, spray (mix of full, top and scrolled shots at both widths). The
  differences looked like grey text antialiasing. A later re-run hung on its second pass
  and the session ended before the cause was found.
- 2026-11-08: moved into this folder (`C:\Users\pavan\Downloads\Tavron\TAVRON_WEB_ENH-latest`,
  `origin` = `UParthsarathi/TAVRON_WEB_ENH`) and committed, so the work is no longer on one
  disk only. Old screenshots were not copied: re-capture per "How to resume". Ajay's
  `home-equipment-photos` branch (30,000 sq.ft, 400+ customers) copied in as a local branch.
  `nextjs` and the `legacy-html` tag pushed to `origin`.
- 2026-11-08, re-plan with the user (no code): app goes in `next/` inside this repo;
  pages translated by script; proof is matching markup, screenshots with tolerance (the
  0-pixel gate was the blocker); `tavron-web` not used; ~4 sessions. The user said
  "leave it" to chasing the screenshot determinism. Next: Session 1 (Steps 2–4).
- 2026-11-08, Session 1 (`f9e084f`): **Steps 2–5 done.**
  - Harness: reference captured twice; markup identical on all 35 pages. `compare.mjs`
    switched to the markup gate plus pixel tolerance (see "Compare"). `capture.mjs` skips
    Next's empty `<div hidden>` metadata outlet, which Next always renders first in
    `<body>` and no config removes. No old page has a `<div hidden>` at body level.
  - Step 2: `next/` with its own `package.json` (Next 16.4.5, React 19.3.1, TypeScript
    5.9, Tailwind 4.3.5 not imported, see Decisions). Static files and `.well-known/`
    copied into `public/`, byte-identical (checked over HTTP, including both remixicon
    name forms). `next/vercel.json` copied; `next/.vercelignore` keeps `old-site/` out of
    the deploy as the root one does today. 404 for unknown `.html` works.
  - Steps 3–4: `npm run convert` (`scripts/convert/html-to-jsx.mjs`, parse5) writes
    `next/app/*/page.tsx` and `next/components/generated/{Header,Footer}.tsx`. It refuses
    a page whose `<html>`/`<body>` attributes, charset/viewport, shared head tail or
    script block differ from the others, so nothing is dropped silently. Hand-written:
    `app/layout.tsx`, `components/MobileNav.tsx`, `components/LegacyScripts.tsx`.
    Fixes the pilot needed: head order, viewport `1.0`, `data-aos-*` on body (all in
    Decisions).
  - Step 5: the other 34 pages passed on the first run, without converter changes.
  - Result: candidate vs reference **348/348 checks**, all 35 pages × all states, no new
    console errors or failed requests, no overflow. With `--max-px 0` only one shot has
    any differing pixels: `tubularheat/full-1440`, 86 px, the same count as reference vs
    reference (Chrome glyph jitter).
  - Gotcha: on this machine `netstat` did not show the `next start` listener, so a
    "restarted" server kept serving the old build and the new one died with EADDRINUSE.
    Find it with `Get-CimInstance Win32_Process -Filter "Name='node.exe'"`, stop it by
    PID, and curl for something only the new build has before capturing.
  - Next: Session 2 = Step 6.
