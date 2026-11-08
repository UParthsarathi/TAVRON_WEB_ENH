// Compare two capture runs. Exit 1 unless every screenshot is 0 differing pixels and every markup file is equal.
//   node scripts/visual/compare.mjs --a .migration/reference --b .migration/candidate
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const { values: arg } = parseArgs({
  options: {
    a: { type: "string", default: ".migration/reference" },
    b: { type: "string", default: ".migration/candidate" },
    diff: { type: "string", default: ".migration/diff" },
  },
});

const fails = [];
let checks = 0;

for (const page of readdirSync(arg.a, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
  if (!existsSync(join(arg.b, page))) continue; // page not captured in B (e.g. a --pages run)
  for (const file of readdirSync(join(arg.a, page)).sort()) {
    checks++;
    const fa = join(arg.a, page, file);
    const fb = join(arg.b, page, file);
    const id = `${page}/${file}`;
    if (!existsSync(fb)) {
      fails.push(`${id}: missing in B`);
      continue;
    }
    if (file.endsWith(".txt")) {
      const la = readFileSync(fa, "utf8").split("\n");
      const lb = readFileSync(fb, "utf8").split("\n");
      const i = la.findIndex((l, n) => l !== lb[n]);
      if (i !== -1 || la.length !== lb.length) {
        const at = i === -1 ? Math.min(la.length, lb.length) : i;
        fails.push(`${id}: markup differs at line ${at + 1}\n    A: ${la[at]?.trim()}\n    B: ${lb[at]?.trim()}`);
      }
      continue;
    }
    const a = PNG.sync.read(readFileSync(fa));
    const b = PNG.sync.read(readFileSync(fb));
    if (a.width !== b.width || a.height !== b.height) {
      fails.push(`${id}: size ${a.width}x${a.height} vs ${b.width}x${b.height}`);
      continue;
    }
    if (a.data.equals(b.data)) continue;
    const out = new PNG({ width: a.width, height: a.height });
    const n = pixelmatch(a.data, b.data, out.data, a.width, a.height, { threshold: 0, includeAA: true });
    if (n === 0) continue;
    mkdirSync(join(arg.diff, page), { recursive: true });
    writeFileSync(join(arg.diff, page, file), PNG.sync.write(out));
    fails.push(`${id}: ${n} px differ -> ${join(arg.diff, page, file)}`);
  }
}

// Console errors, failed requests and overflow that B has and A does not.
const ra = JSON.parse(readFileSync(join(arg.a, "report.json"), "utf8"));
const rb = existsSync(join(arg.b, "report.json")) ? JSON.parse(readFileSync(join(arg.b, "report.json"), "utf8")) : {};
const strip = (s) => s.replace(/https?:\/\/localhost:\d+/g, "");
for (const [page, b] of Object.entries(rb)) {
  const a = ra[page] ?? { consoleErrors: [], failedRequests: [], overflow: {} };
  for (const key of ["consoleErrors", "failedRequests"]) {
    const known = new Set(a[key].map(strip));
    for (const v of b[key]) if (!known.has(strip(v))) fails.push(`${page}: new ${key}: ${v}`);
  }
  for (const [w, px] of Object.entries(b.overflow)) if (px !== 0) fails.push(`${page}: horizontal overflow ${px}px at ${w}`);
}

console.log(fails.length ? fails.join("\n") : "");
console.log(`\n${checks - fails.filter((f) => !/new |overflow/.test(f)).length}/${checks} checks identical, ${fails.length} problem(s)`);
process.exit(fails.length ? 1 : 0);
