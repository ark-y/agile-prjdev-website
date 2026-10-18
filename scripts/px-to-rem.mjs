#!/usr/bin/env node
/*
 * One-off codemod: converts `font-size: Npx` to rem (N / 16) in every .css file under src/.
 * Only font-size declarations are touched. At the default 100% text size the result
 * looks identical, but the text can now scale with the text size control.
 *
 * Usage:  node scripts/px-to-rem.mjs --dry-run   (preview)
 *         node scripts/px-to-rem.mjs             (apply)
 * The component's own stylesheet (TextSizeControl.css) is skipped on purpose.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";
const SKIP = "TextSizeControl.css";
const dryRun = process.argv.includes("--dry-run");

function walk(dir) {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? walk(path) : [path];
    });
}

const toRem = (px) => `${Number((px / 16).toFixed(4))}rem`;

let files = 0;
let changes = 0;

for (const file of walk(ROOT).filter((f) => f.endsWith(".css") && !f.endsWith(SKIP))) {
    const before = readFileSync(file, "utf8");
    let count = 0;
    const after = before.replace(/(font-size\s*:\s*)(\d*\.?\d+)px/g, (_, prefix, px) => {
        count += 1;
        return `${prefix}${toRem(parseFloat(px))}`;
    });
    if (count > 0) {
        files += 1;
        changes += count;
        console.log(`${file}: ${count} font-size value(s)`);
        if (!dryRun) writeFileSync(file, after);
    }
}

console.log(`\n${dryRun ? "Would convert" : "Converted"} ${changes} value(s) in ${files} file(s).`);