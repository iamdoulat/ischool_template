/**
 * i18n Key Extraction Tool
 *
 * Scans the frontend codebase for all t("...") and t('...') calls,
 * extracts unique keys, and flags keys that are missing from the
 * i18n fallbacks dictionary.
 *
 * Usage: node scripts/extract-i18n-keys.mjs
 * Output: scripts/i18n-keys-report.json (full report)
 *         console summary of keys NOT in fallbacks
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ─── Read i18n fallbacks source ─────────────────────────────────────
function loadFallbackKeys() {
    const fallbackPath = join(ROOT, "src", "lib", "i18n-fallbacks.ts");
    try {
        const content = readFileSync(fallbackPath, "utf-8");
        const keys = new Set();
        // Match property names in the record:  key_name: "value",
        const regex = /^\s{4}(\w+):\s*"/gm;
        let m;
        while ((m = regex.exec(content)) !== null) {
            keys.add(m[1]);
        }
        return keys;
    } catch {
        console.warn("⚠ Could not read i18n-fallbacks.ts — fallback check skipped.");
        return new Set();
    }
}

// ─── Recursive file walk ──────────────────────────────────────────────
function walkDir(dir) {
    const results = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (entry.startsWith(".") || entry === "node_modules" || entry === ".next") continue;
        const st = statSync(full);
        if (st.isDirectory()) {
            results.push(...walkDir(full));
        } else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) {
            results.push(full);
        }
    }
    return results;
}

// ─── Extract t("...") keys from file ──────────────────────────────────
function extractKeys(filePath) {
    const content = readFileSync(filePath, "utf-8");
    const keys = [];
    // Matches t("key") and t("key", { ... })
    // Also matches t('key') for single-quoted
    const regex = /\bt\(\s*["']([^"']+)["']/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
        keys.push(m[1]);
    }
    return keys;
}

// ─── Main ────────────────────────────────────────────────────────────
console.log("🔍 Scanning for i18n keys...\n");

const srcDir = join(ROOT, "src");
const files = [
    ...walkDir(join(srcDir, "app", "dashboard")),
    ...walkDir(join(srcDir, "components")),
];

console.log(`   Files to scan: ${files.length}`);

const fallbackKeys = loadFallbackKeys();
console.log(`   Fallback keys  : ${fallbackKeys.size}\n`);

// Build key → files map
const keyMap = new Map();
for (const f of files) {
    const rel = f.replace(ROOT + "\\", "").replace(/\\/g, "/");
    const keys = extractKeys(f);
    for (const k of keys) {
        if (!keyMap.has(k)) keyMap.set(k, []);
        const arr = keyMap.get(k);
        if (!arr.includes(rel)) arr.push(rel);
    }
}

// Sort keys
const sorted = [...keyMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

// Find missing keys
const missing = sorted.filter(([key]) => !fallbackKeys.has(key));

// ─── Output ──────────────────────────────────────────────────────────

// Full report as JSON
const report = {
    scannedFiles: files.length,
    totalUniqueKeys: sorted.length,
    fallbackKeys: fallbackKeys.size,
    keysInFallbacks: sorted.filter(([k]) => fallbackKeys.has(k)).length,
    keysNotInFallbacks: missing.length,
    keys: sorted.map(([key, files]) => ({
        key,
        fileCount: files.length,
        files,
        hasFallback: fallbackKeys.has(key),
    })),
};

const outPath = join(ROOT, "scripts", "i18n-keys-report.json");
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`📄 Full report written to: scripts/i18n-keys-report.json`);

// Summary
console.log(`\n📊 Summary:`);
console.log(`   Total unique t() keys : ${sorted.length}`);
console.log(`   With fallback          : ${sorted.length - missing.length}`);
console.log(`   WITHOUT fallback       : ${missing.length}`);

if (missing.length > 0) {
    console.log(`\n⚠️  Keys NOT in i18n-fallbacks.ts (${missing.length}):\n`);
    // Group by first part
    const grouped = {};
    for (const [key] of missing) {
        const prefix = key.split("_")[0];
        if (!grouped[prefix]) grouped[prefix] = [];
        grouped[prefix].push(key);
    }
    for (const [prefix, keys] of Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]))) {
        console.log(`   ${prefix}:`);
        for (const k of keys.sort()) {
            const files = (keyMap.get(k) || []).slice(0, 3).join(", ");
            console.log(`     ${k}  (${keyMap.get(k)?.length || 0} file(s): ${files})`);
        }
    }
    console.log("\n");
}

console.log("✅ Done.");
