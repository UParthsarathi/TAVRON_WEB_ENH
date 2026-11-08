// Translate the static site into the Next.js app in next/. See NEXTJS-MIGRATION.md, Steps 3-5.
//   node scripts/convert/html-to-jsx.mjs            every page + the header/footer templates
//   node scripts/convert/html-to-jsx.mjs bulkCoolers.html
// The output is generated: never edit it by hand. Fix this script and re-run.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parse, parseFragment } from "parse5";

const OUT = "next";
const BODY_CLASS = "tv tv--light-top tv-numbered"; // owned by app/layout.tsx
const SCRIPTS = [
  // The same block ends every page; LegacyScripts.tsx loads what is still needed.
  "assets/vendor/jquery/jquery.min.js",
  "assets/vendor/bootstrap/js/bootstrap.bundle.min.js",
  "assets/vendor/jquery.easing/jquery.easing.min.js",
  "assets/vendor/php-email-form/validate.js",
  "assets/vendor/jquery-sticky/jquery.sticky.js",
  "assets/vendor/isotope-layout/isotope.pkgd.min.js",
  "assets/vendor/venobox/venobox.min.js",
  "assets/vendor/waypoints/jquery.waypoints.min.js",
  "assets/vendor/owl.carousel/owl.carousel.min.js",
  "assets/vendor/aos/aos.js",
  "assets/js/main.js",
  "assets/js/tavron-modern.js",
].join(" ");
// The tail of every <head>, from the favicons on; app/layout.tsx renders it.
const COMMON_HEAD = [
  "link href=assets/img/favicon.png rel=icon",
  "link href=assets/img/apple-touch-icon.png rel=apple-touch-icon",
  "link href=https://fonts.googleapis.com rel=preconnect",
  "link crossorigin= href=https://fonts.gstatic.com rel=preconnect",
  "link href=https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Sora:wght@400..800&display=swap rel=stylesheet",
  ...["bootstrap/css/bootstrap.min.css", "icofont/icofont.min.css", "boxicons/css/boxicons.min.css",
    "remixicon/remixicon.css", "animate.css/animate.min.css", "venobox/venobox.css", "aos/aos.css"]
    .map((f) => `link href=assets/vendor/${f} rel=stylesheet`),
  "link href=assets/css/style.css rel=stylesheet",
  "link href=assets/css/tavron-modern.css rel=stylesheet",
].join("\n");

const SVG_NS = "http://www.w3.org/2000/svg";
const VOID = new Set("area base br col embed hr img input link meta source track wbr".split(" "));
// The browser ignores whitespace here and React refuses it (hydration error).
const NO_WS = new Set("html head table thead tbody tfoot tr colgroup select".split(" "));
const SVG_TEXT = new Set(["text", "tspan", "textPath", "title", "desc"]);
const RAW = new Set(["pre", "textarea"]);
const BOOL = new Set(
  "allowfullscreen async autofocus autoplay checked controls default defer disabled formnovalidate hidden loop multiple muted novalidate open playsinline readonly required reversed selected".split(" "),
);
const NUM = new Set(["rows", "cols", "size", "span", "start", "tabIndex", "colSpan", "rowSpan", "maxLength", "minLength"]);
const RENAME = {
  class: "className", for: "htmlFor", tabindex: "tabIndex", colspan: "colSpan", rowspan: "rowSpan",
  readonly: "readOnly", maxlength: "maxLength", minlength: "minLength", crossorigin: "crossOrigin",
  srcset: "srcSet", frameborder: "frameBorder", allowfullscreen: "allowFullScreen",
  referrerpolicy: "referrerPolicy", autocomplete: "autoComplete", autoplay: "autoPlay",
  playsinline: "playsInline", contenteditable: "contentEditable", spellcheck: "spellCheck",
  datetime: "dateTime", enctype: "encType", novalidate: "noValidate", formnovalidate: "formNoValidate",
  itemprop: "itemProp", itemscope: "itemScope", itemtype: "itemType", usemap: "useMap",
  autofocus: "autoFocus", charset: "charSet", inputmode: "inputMode", enterkeyhint: "enterKeyHint",
};

const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const collapse = (s) => s.replace(/[ \t\n\r\f]+/g, " "); // not \s: that would eat &nbsp;
const isWs = (n) => n.nodeName === "#text" && !/[^ \t\n\r\f]/.test(n.value);
const attr = (el, name) => el.attrs?.find((a) => a.name === name)?.value;
const fail = (msg) => {
  throw new Error(msg);
};

function styleObject(css) {
  const out = {};
  // split on ; outside parentheses (url(...) may contain one)
  for (const decl of css.match(/(?:[^;(]|\([^)]*\))+/g) ?? []) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const name = decl.slice(0, i).trim();
    const key = name.startsWith("--") ? name : camel(name.replace(/^-ms-/, "ms-").replace(/^-(\w)/, (_, c) => c.toUpperCase()));
    out[key] = decl.slice(i + 1).trim();
  }
  return out;
}

function attrsJsx(el) {
  return el.attrs
    .map(({ name, value, prefix }) => {
      let key = prefix ? prefix + name[0].toUpperCase() + name.slice(1) : RENAME[name] ?? name;
      if (!/^(data|aria)-/.test(key) && key.includes("-")) key = camel(key);
      if ((el.tagName === "input" || el.tagName === "textarea") && key === "value") key = "defaultValue";
      if (el.tagName === "input" && key === "checked") key = "defaultChecked";
      if (key === "style") {
        const obj = JSON.stringify(styleObject(value));
        return obj.includes('"--') ? `style={${obj} as React.CSSProperties}` : `style={${obj}}`;
      }
      if (BOOL.has(name) && (value === "" || value === name)) return key;
      if (NUM.has(key) && /^\d+$/.test(value)) return `${key}={${value}}`; // React's types want numbers
      return /["&{}\\\n<>]/.test(value) ? `${key}={${JSON.stringify(value)}}` : `${key}="${value}"`;
    })
    .map((s) => " " + s)
    .join("");
}

const jsxText = (s) =>
  JSON.stringify(s).replace(/\u00a0/g, "\\u00a0");

// One DOM text node must stay one JSX child: React separates adjacent text children with
// comments, which splits the node in the DOM. Text that starts or ends with a space goes in
// {"..."}, because JSX would trim it on its own line.
function textJsx(s) {
  if (/^[^ ]/.test(s) && /[^ ]$/.test(s) && !/[{}<>\\]/.test(s))
    return s.replace(/&/g, "&amp;").replace(/\u00a0/g, "&nbsp;");
  return `{${jsxText(s)}}`;
}

// ctx.swap(el) may return JSX to use instead of the element, ctx.replace(el) instead of its children.
function children(parent, depth, ctx) {
  const tag = parent.tagName ?? "";
  const svgNonText = parent.namespaceURI === SVG_NS && !SVG_TEXT.has(tag);
  const lines = [];
  let prevWs = false;
  for (const n of parent.content?.childNodes ?? parent.childNodes) {
    if (n.nodeName === "#comment") continue;
    if (n.nodeName === "#text") {
      if (RAW.has(tag)) {
        if (n.value) lines.push(`{${jsxText(n.value)}}`);
        continue;
      }
      if (isWs(n)) {
        if (NO_WS.has(tag) || svgNonText || prevWs) continue;
        prevWs = true;
        lines.push(`{" "}`);
        continue;
      }
      prevWs = false;
      lines.push(textJsx(collapse(n.value)));
      continue;
    }
    prevWs = false;
    lines.push(element(n, depth, ctx));
  }
  const pad = "  ".repeat(depth);
  return lines.map((l) => l.split("\n").map((x) => pad + x).join("\n")).join("\n");
}

function element(el, depth, ctx) {
  if (el.tagName === "script") fail(`unexpected <script> inside the page body`);
  const swapped = ctx.swap?.(el);
  if (swapped) return swapped;
  const open = `<${el.tagName}${attrsJsx(el)}`;
  if (VOID.has(el.tagName)) return `${open} />`;
  const inner = ctx.replace?.(el) ?? children(el, 1, ctx);
  const one = inner.trim();
  if (!one.includes("\n")) return `${open}>${one}</${el.tagName}>`;
  return `${open}>\n${inner}\n</${el.tagName}>`;
}

const header = (file) =>
  `// Generated by scripts/convert/html-to-jsx.mjs from ${file}. Do not edit: fix the converter and re-run.\n`;

function write(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  console.log(`wrote ${path}`);
}

// ---------------------------------------------------------------- templates

function templates() {
  const h = parseFragment(readFileSync("templates/_header.html", "utf8"));
  const find = (n) => (n.tagName === "nav" ? n : (n.childNodes ?? []).map(find).find(Boolean));
  const navEl = find(h);
  const navClass = "nav-menu d-none d-lg-block";
  if (attr(navEl, "class") !== navClass) fail("header nav class changed");
  // main.js marks <li id={data-active-menu}> active, then clones .nav-menu as the mobile nav,
  // so both navs are one component with the class as a prop.
  const nav = children(navEl, 3, {}).replace(
    /<li id="(menu_\w+)">/g,
    (_, id) => `<li id="${id}" className={active === "${id}" ? "active" : undefined}>`,
  );
  const swap = (el) => (el === navEl ? `<Nav className="${navClass}" active={active} />` : null);
  write(
    join(OUT, "components/generated/Header.tsx"),
    header("templates/_header.html") +
      `type Active = { active?: string };

` +
      `export function Nav({ className, active }: Active & { className: string }) {
` +
      `  return (
    <nav className={className}>
${nav}
    </nav>
  );
}

` +
      `// Rendered inside the page's own <header id="header" data-load=...>, as $.load() did.
` +
      `export function Header({ active }: Active) {
  return (
    <>
${children(h, 3, { swap })}
    </>
  );
}
`,
  );

  const f = parseFragment(readFileSync("templates/_footer.html", "utf8"));
  write(
    join(OUT, "components/generated/Footer.tsx"),
    header("templates/_footer.html") + `export function Footer() {
  return (
    <>
${children(f, 3, {})}
    </>
  );
}
`,
  );
}

// ---------------------------------------------------------------- pages

function page(file) {
  const doc = parse(readFileSync(file, "utf8"));
  const html = doc.childNodes.find((n) => n.tagName === "html");
  const head = html.childNodes.find((n) => n.tagName === "head");
  const body = html.childNodes.find((n) => n.tagName === "body");
  if (attr(html, "lang") !== "en" || html.attrs.length !== 1) fail(`${file}: <html> attributes changed`);
  if (attr(body, "class") !== BODY_CLASS || body.attrs.length !== 1) fail(`${file}: <body> attributes changed`);

  // Head: charset + viewport and the common tail come from the layout; the rest is per page.
  const headEls = head.childNodes.filter((n) => n.tagName);
  const tailAt = headEls.findIndex((n) => n.tagName === "link" && attr(n, "rel") === "icon");
  const sig = (n) => `${n.tagName} ${[...n.attrs].sort((a, b) => (a.name < b.name ? -1 : 1)).map((a) => `${a.name}=${a.value}`).join(" ")}`;
  const tail = headEls.slice(tailAt).filter((n) => !(n.tagName === "script" && attr(n, "type") === "application/ld+json"));
  if (tail.map(sig).join("\n") !== COMMON_HEAD) fail(`${file}: head tail differs from the layout`);
  const [charset, viewport, ...own] = headEls.slice(0, tailAt);
  if (sig(charset) !== "meta charset=utf-8" || sig(viewport) !== "meta content=width=device-width, initial-scale=1.0 name=viewport")
    fail(`${file}: charset/viewport changed`);
  const ldJson = headEls.filter((n) => n.tagName === "script" && attr(n, "type") === "application/ld+json");
  const headJsx = own.map((n) => element(n, 0, {})).join("\n");
  const ldJsx = ldJson
    .map((n) => `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ${JSON.stringify(n.childNodes[0].value)} }} />`)
    .join("\n");

  // Body: scripts are the standard block (loaded by LegacyScripts); header/footer are components.
  const scripts = body.childNodes.filter((n) => n.tagName === "script").map((n) => attr(n, "src"));
  if (scripts.join(" ") !== SCRIPTS) fail(`${file}: script block differs`);
  let active;
  const ctx = {
    replace(el) {
      const load = attr(el, "data-load");
      if (!load) return null;
      if (el.childNodes.some((n) => !isWs(n) && n.nodeName !== "#comment")) fail(`${file}: ${el.tagName} placeholder not empty`);
      if (load === "templates/_header.html") {
        active = attr(el, "data-active-menu");
        return `  <Header${active ? ` active="${active}"` : ""} />`;
      }
      if (load === "templates/_footer.html") return `  <Footer />`;
      fail(`${file}: unknown data-load ${load}`);
    },
  };
  const bodyJsx = children({ ...body, childNodes: body.childNodes.filter((n) => n.tagName !== "script") }, 3, ctx);

  const route = file === "index.html" ? "" : file.replace(/\.html$/, "");
  write(
    join(OUT, "app", route, "page.tsx"),
    header(file) +
      `import { Footer } from "@/components/generated/Footer";\n` +
      `import { Header } from "@/components/generated/Header";\n` +
      `import { MobileNav, MobileNavToggle } from "@/components/MobileNav";\n\n` +
      `export default function Page() {\n  return (\n    <>\n` +
      headJsx.replace(/^/gm, "      ") +
      `\n      <MobileNavToggle />\n${bodyJsx}\n      <MobileNav${active ? ` active="${active}"` : ""} />\n` +
      // JSON-LD last, so the toggle stays the first child of <body> as main.js left it
      (ldJsx ? ldJsx.replace(/^/gm, "      ") + "\n" : "") +
      `    </>\n  );\n}\n`,
  );
}

const only = process.argv.slice(2);
if (!only.length) templates();
for (const f of only.length ? only : readdirSync(".").filter((f) => f.endsWith(".html")).sort()) page(f);
