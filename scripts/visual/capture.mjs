// Screenshot + markup capture for the 0-pixel rule. See NEXTJS-MIGRATION.md, "Visual test harness".
//   node scripts/visual/capture.mjs --base http://localhost:8000 --out .migration/reference
//   node scripts/visual/capture.mjs --base http://localhost:3000 --out .migration/candidate --pages bulkCoolers.html
import { chromium } from "playwright-core";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

const { values: arg } = parseArgs({
  options: {
    base: { type: "string", default: "http://localhost:8000" },
    out: { type: "string" },
    pages: { type: "string" }, // comma list; default = every page of the legacy site
    workers: { type: "string", default: "4" },
  },
});
if (!arg.out) throw new Error("--out is required");

const PAGES = arg.pages
  ? arg.pages.split(",")
  : readdirSync(".migration/legacy").filter((f) => f.endsWith(".html")).sort();
const HEIGHT = { 1440: 900, 390: 844 };
const MENU_PAGES = new Set(["index.html", "bulkCoolers.html"]); // dropdown + hover states

// ---------------------------------------------------------------- in-page helpers

// Header/footer are injected by AJAX on the legacy site, so "loaded" means they are in.
async function settle(page) {
  await page
    .waitForFunction(
      () => document.querySelector("#footer .footer-top") && document.querySelector(".mobile-nav"),
      null,
      { timeout: 20000 },
    )
    .catch(() => {
      throw new Error("header/footer never appeared");
    });
  await waitImages(page);
}

// Every image loaded and decoded. Lazy images are switched to eager first: whether an image is
// lazy changes when it loads, not how the loaded page looks, and lazy images that sit off-screen
// (the logo marquee) would otherwise never load.
async function waitImages(page) {
  await page.evaluate(() =>
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = "eager")),
  );
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  const t0 = Date.now();
  for (;;) {
    const pending = await page.evaluate(() =>
      [...document.images].filter((i) => !i.complete).map((i) => i.currentSrc || i.src),
    );
    if (!pending.length) break;
    if (Date.now() - t0 > 20000) throw new Error(`images still loading: ${pending.slice(0, 3).join(", ")}`);
    await page.waitForTimeout(100);
  }
  await page.evaluate(async () => {
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
    await document.fonts.ready;
  });
}

// Normalised page structure: head tags that matter + the whole body. Whitespace-only text nodes
// are skipped (the pixel diff covers them); text keeps its collapsed leading/trailing space.
function snapshot() {
  const DROP_ATTR = /^(data-precedence|data-nimg|nonce)$/;
  const SKIP = new Set(["SCRIPT", "NOSCRIPT", "TEMPLATE", "STYLE", "NEXT-ROUTE-ANNOUNCER"]);
  const attrs = (el) =>
    [...el.attributes]
      .filter((a) => !DROP_ATTR.test(a.name))
      .map((a) =>
        a.name === "class"
          ? `class=${JSON.stringify(a.value.split(/\s+/).filter(Boolean).sort().join(" "))}`
          : a.name === "style"
            ? `style=${JSON.stringify(el.style.cssText)}`
            : `${a.name}=${JSON.stringify(a.value)}`,
      )
      .sort()
      .join(" ");
  const out = [`html ${attrs(document.documentElement)}`, `title ${JSON.stringify(document.title)}`];
  for (const m of document.head.querySelectorAll("meta")) out.push(`meta ${attrs(m)}`);
  for (const l of document.head.querySelectorAll("link"))
    if (!/preload|modulepreload/.test(l.rel)) out.push(`link ${attrs(l)}`);
  for (const s of document.querySelectorAll('script[type="application/ld+json"]'))
    out.push(`ld+json ${JSON.stringify(JSON.parse(s.textContent))}`);
  out.push(`body ${attrs(document.body)}`);
  // The legacy site appends .tv-lightbox (DOMContentLoaded) and .mobile-nav (after an AJAX load)
  // in whichever order the race goes, so the lightbox is listed last, wherever it really is.
  const ordered = (node) => {
    const kids = [...node.childNodes];
    if (node !== document.body) return kids;
    return [...kids.filter((c) => !c.classList?.contains("tv-lightbox")), ...kids.filter((c) => c.classList?.contains("tv-lightbox"))];
  };
  const walk = (node, depth) => {
    for (const c of ordered(node)) {
      if (c.nodeType === 3) {
        if (c.data.trim()) out.push("  ".repeat(depth) + JSON.stringify(c.data.replace(/\s+/g, " ")));
      } else if (c.nodeType === 1 && !SKIP.has(c.tagName)) {
        out.push("  ".repeat(depth) + `<${c.tagName.toLowerCase()}${c.attributes.length ? " " + attrs(c) : ""}>`);
        walk(c, depth + 1);
      }
    }
  };
  walk(document.body, 1);
  return out.join("\n") + "\n";
}

// ---------------------------------------------------------------- capture

// --disable-lcd-text: Chrome uses ClearType on some layers and greyscale on composited ones, and
// which layers are composited depends on animation timing, so the same text came out differently
// run to run. Greyscale everywhere makes reference vs reference = 0. The rest remove raster timing.
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: [
    "--force-color-profile=srgb",
    "--disable-gpu",
    "--font-render-hinting=none",
    "--disable-lcd-text",
    "--disable-partial-raster",
    "--disable-checker-imaging",
    "--disable-threaded-animation",
    "--disable-threaded-scrolling",
  ],
});
const report = {};

async function open(name, width, { reducedMotion = "no-preference" } = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height: HEIGHT[width] },
    deviceScaleFactor: 1,
    reducedMotion,
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "Asia/Kolkata",
  });
  // Never let a test run send the contact form.
  await ctx.route(/cloudfunctions\.net/, (r) => r.abort());
  const page = await ctx.newPage();
  const rep = (report[name] ??= { consoleErrors: [], failedRequests: [], overflow: {} });
  const add = (list, v) => list.includes(v) || list.push(v);
  page.on("console", (m) => m.type() === "error" && add(rep.consoleErrors, m.text()));
  page.on("pageerror", (e) => add(rep.consoleErrors, String(e)));
  page.on("requestfailed", (r) => add(rep.failedRequests, `${r.failure()?.errorText} ${r.url()}`));
  page.on("response", (r) => r.status() >= 400 && add(rep.failedRequests, `${r.status()} ${r.url()}`));
  await page.goto(`${arg.base}/${name}`, { waitUntil: "load" });
  await settle(page);
  return { ctx, page, rep };
}

async function shot(page, path, opts = {}) {
  // index.html crossfades its hero every 6 s; a shot after the first tick is not comparable.
  const heroOk = await page.evaluate(() => {
    const s = document.querySelectorAll(".tv-hero__slide");
    return !s.length || s[0].classList.contains("is-active");
  });
  if (!heroOk) throw new Error("hero advanced before the shot");
  const target = opts.element ? page.locator(opts.element).first() : page;
  await target.screenshot({
    path,
    animations: "disabled",
    caret: "hide",
    mask: [page.locator("iframe")], // Google Maps on contact.html is third-party and changes
    maskColor: "#ff00ff",
    fullPage: opts.fullPage,
  });
}

const pause = (page, ms) => page.waitForTimeout(ms);

async function capturePage(name) {
  const dir = join(arg.out, name.replace(/\.html$/, ""));
  mkdirSync(dir, { recursive: true });
  const p = (state) => join(dir, `${state}.png`);
  const hasLightbox = async (page) => (await page.locator("[data-lightbox]").count()) > 0;

  for (const w of [1440, 390]) {
    // 1. Full page, reduced motion: every reveal shown, nothing moving. Markup once, at 1440.
    let { ctx, page, rep } = await open(name, w, { reducedMotion: "reduce" });
    if (w === 1440) writeFileSync(join(dir, "markup.txt"), await page.evaluate(snapshot));
    rep.overflow[w] = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    await shot(page, p(`full-${w}`), { fullPage: true });
    await ctx.close();

    // 2. Normal motion: first viewport, then scrolled 400px (solid header).
    ({ ctx, page } = await open(name, w));
    await pause(page, 400);
    await shot(page, p(`top-${w}`));
    await page.evaluate(() => window.scrollTo(0, 400));
    await pause(page, 600);
    await waitImages(page);
    await shot(page, p(`scrolled-${w}`));
    const lightbox = await hasLightbox(page);
    await ctx.close();

    // 3. Lightbox open on the first trigger.
    if (lightbox) {
      ({ ctx, page } = await open(name, w));
      await page.locator("[data-lightbox]").first().click();
      await page.waitForFunction(() => {
        const i = document.querySelector(".tv-lightbox.is-open img");
        return i && i.complete && i.naturalWidth > 0;
      });
      await pause(page, 400);
      await shot(page, p(`lightbox-${w}`));
      await ctx.close();
    }

    // 4. Product viewer: second thumbnail selected.
    if (name === "bulkCoolers.html") {
      ({ ctx, page } = await open(name, w));
      await page.locator("[data-viewer-thumb]").nth(1).click();
      await pause(page, 700);
      await page.waitForFunction(() => {
        const i = document.querySelector("[data-viewer-stage]");
        return i.complete && i.naturalWidth > 0;
      });
      await shot(page, p(`viewer-${w}`), { element: "[data-viewer]" });
      await ctx.close();
    }

    // 5. Contact form submitted empty: validation messages.
    if (name === "contact.html") {
      ({ ctx, page } = await open(name, w));
      await page.locator("form.php-email-form [type=submit]").click();
      await pause(page, 1200);
      await shot(page, p(`form-${w}`), { element: "form.php-email-form" });
      await ctx.close();
    }
  }

  // 6. Mobile menu open; nested dropdown expanded on the menu pages.
  {
    const { ctx, page } = await open(name, 390);
    await page.locator(".mobile-nav-toggle").click();
    await pause(page, 700);
    await shot(page, p("menu-390"));
    if (MENU_PAGES.has(name)) {
      await page.locator(".mobile-nav .drop-down > a", { hasText: "Products" }).first().click();
      await pause(page, 700);
      await page.locator(".mobile-nav .drop-down > a", { hasText: "Heat Transfer" }).first().click();
      await pause(page, 700);
      await shot(page, p("dropdown-390"));
    }
    await ctx.close();
  }

  // 7. Desktop dropdown on hover (nested flyout).
  if (MENU_PAGES.has(name)) {
    const { ctx, page } = await open(name, 1440);
    await page.locator(".nav-menu > ul > li.drop-down > a", { hasText: "Products" }).first().hover();
    await pause(page, 500);
    await page.locator(".nav-menu li.drop-down > a", { hasText: "Heat Transfer" }).first().hover();
    await pause(page, 500);
    await shot(page, p("hover-1440"));
    await ctx.close();
  }
}

// ---------------------------------------------------------------- run

const queue = [...PAGES];
const failed = [];
const t0 = Date.now();
await Promise.all(
  Array.from({ length: Number(arg.workers) }, async () => {
    for (let name; (name = queue.shift()); ) {
      for (let attempt = 1; ; attempt++) {
        try {
          delete report[name];
          await capturePage(name);
          console.log(`ok   ${name}`);
          break;
        } catch (e) {
          if (attempt === 3) {
            failed.push(name);
            console.log(`FAIL ${name}: ${e.message.split("\n")[0]}`);
            break;
          }
          console.log(`retry ${name} (${e.message.split("\n")[0]})`);
        }
      }
    }
  }),
);
await browser.close();
mkdirSync(arg.out, { recursive: true });
writeFileSync(join(arg.out, "report.json"), JSON.stringify(report, null, 2));
console.log(`\n${PAGES.length - failed.length}/${PAGES.length} pages captured in ${Math.round((Date.now() - t0) / 1000)}s -> ${arg.out}`);
if (failed.length) process.exit(1);
