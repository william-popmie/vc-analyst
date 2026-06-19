import fs from "fs";
import path from "path";

let cached: string | null = null;

/** Read docs/playbook.md once and memoize it. Shared by the engine + page. */
export function loadPlaybook(): string {
  if (cached === null) {
    cached = fs.readFileSync(path.join(process.cwd(), "docs/playbook.md"), "utf8");
  }
  return cached;
}
