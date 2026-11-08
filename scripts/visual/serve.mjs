// Static server for the legacy export. Not python's http.server: its listen backlog is 5, so
// parallel captures get ERR_CONNECTION_REFUSED on random files and the reference breaks.
//   node scripts/visual/serve.mjs [root=.migration/legacy] [port=8000]
import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = process.argv[2] ?? ".migration/legacy";
const port = Number(process.argv[3] ?? 8000);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".eot": "application/vnd.ms-fontobject",
  ".pdf": "application/pdf", ".mp4": "video/mp4", ".txt": "text/plain",
};

createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path.endsWith("/")) path += "index.html";
  const file = join(root, normalize(path));
  try {
    if (!statSync(file).isFile()) throw new Error();
  } catch {
    res.writeHead(404).end("Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
