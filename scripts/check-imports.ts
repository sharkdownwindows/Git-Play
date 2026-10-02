/**
 * LINT RULE — ràng buộc phụ thuộc của STRUCTURE.md §3, kiểm bằng CI.
 *
 * Vì sao là script chứ không phải ESLint: chỉ cần đúng một luật, và luật đó là
 * luật riêng của dự án. Kéo cả ESLint + parser + plugin + config về để biểu đạt
 * một bảng 10 dòng là đổi 4 dependency lấy 40 dòng code — cùng lý do §8 từ chối
 * ORM và Passport.
 *
 * Chạy: npm run lint:imports
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

interface Rule {
  /** Thư mục bị ràng buộc, tính từ gốc repo. */
  dir: string;
  /** Specifier bị cấm trong `import ... from "<specifier>"`. */
  forbiddenImports: RegExp[];
  /** Global bị cấm dùng trong thân file. */
  forbiddenGlobals: RegExp[];
  why: string;
}

const RULES: Rule[] = [
  {
    dir: "src/core",
    forbiddenImports: [
      /^react$/,
      /^react-dom/,
      /^react\//,
      /\.tsx$/,
      /\.css$/,
      /\/(viz|terminal|levels|verification|commands-ref|app|progress)(\/|$)/,
    ],
    forbiddenGlobals: [
      /\bdocument\./,
      /\bwindow\./,
      /\blocalStorage\b/,
      /\bfetch\s*\(/,
    ],
    why: "core/ phải zero-dependency để harness Node import trực tiếp engine. Vi phạm là làm sập differential testing.",
  },
  {
    dir: "src/progress",
    forbiddenImports: [
      /^react$/,
      /^react-dom/,
      /\.tsx$/,
      /\.css$/,
      /\/(viz|terminal|levels|verification|commands-ref|app)(\/|$)/,
    ],
    forbiddenGlobals: [/\bfetch\s*\(/],
    why: "progress/ lưu tiến độ trong localStorage và không được phụ thuộc vào UI hoặc service bên ngoài.",
  },
];

/** Chỉ test file mới được import test runner. */
const TEST_FILE = /\.test\.tsx?$/;
const ALLOWED_IN_TESTS = [/^vitest$/];

const IMPORT_RE =
  /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s*["']([^"']+)["']|(?:^|\n)\s*import\s*["']([^"']+)["']|\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

interface Violation {
  file: string;
  line: number;
  detail: string;
  why: string;
}

function walk(dir: string): string[] {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(walk(full));
    else if (/\.tsx?$/.test(full)) out.push(full);
  }
  return out;
}

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split("\n").length;
}

function check(): Violation[] {
  const violations: Violation[] = [];

  for (const rule of RULES) {
    for (const file of walk(rule.dir)) {
      const source = readFileSync(file, "utf8");
      const isTest = TEST_FILE.test(file);
      const rel = relative(process.cwd(), file);

      for (const match of source.matchAll(IMPORT_RE)) {
        const spec = match[1] ?? match[2] ?? match[3];
        if (!spec) continue;
        if (isTest && ALLOWED_IN_TESTS.some((re) => re.test(spec))) continue;

        const hit = rule.forbiddenImports.find((re) => re.test(spec));
        if (hit) {
          violations.push({
            file: rel,
            line: lineOf(source, match.index),
            detail: `import bị cấm: "${spec}"`,
            why: rule.why,
          });
        }
      }

      // Bỏ comment trước khi soi global, để ghi chú không làm đỏ CI.
      const code = source
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");

      for (const re of rule.forbiddenGlobals) {
        const found = code.match(re);
        if (!found) continue;
        // globalThis.localStorage là lối vào có chủ đích của progress/store.
        if (rule.dir === "src/progress" && /localStorage/.test(found[0])) continue;
        violations.push({
          file: rel,
          line: lineOf(code, code.indexOf(found[0])),
          detail: `global bị cấm: ${found[0].trim()}`,
          why: rule.why,
        });
      }
    }
  }

  return violations;
}

const violations = check();

if (violations.length === 0) {
  console.log("✓ lint:imports — ràng buộc phụ thuộc OK (src/core, src/progress)");
  process.exit(0);
}

console.error(`✗ lint:imports — ${violations.length} vi phạm\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}`);
  console.error(`    ${v.detail}`);
  console.error(`    ${v.why}\n`);
}
process.exit(1);
