// Rebuild .migration/legacy from the legacy-html tag: the old static site, served as the visual reference.
import { execSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";

const dir = ".migration/legacy";
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
execSync(`git archive legacy-html | tar -x -C ${dir}`, { stdio: "inherit" });
console.log(`legacy-html exported to ${dir}`);
