// Menarik data ukur (GitHub dan npm) ke data/snapshots/<tanggal>.json.
// Memakai `gh` untuk GitHub, jadi token tidak pernah disentuh skrip ini.
// Pakai: node scripts/fetch.mjs [--only id1,id2] [--out berkas.json]
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const entries = JSON.parse(readFileSync(join(root, "data/entries.json"), "utf8"));
const snapDir = join(root, "data/snapshots");
const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const only = arg("--only")?.split(",");
const today = new Date().toISOString().slice(0, 10);
const out = arg("--out") || join(snapDir, `${today}.json`);

const prevFile = readdirSync(snapDir).filter((f) => f.endsWith(".json") && join(snapDir, f) !== out).sort().pop();
const prev = prevFile ? JSON.parse(readFileSync(join(snapDir, prevFile), "utf8")).entries : {};

const gh = (path) => JSON.parse(execFileSync("gh", ["api", path], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
const get = async (url) => { const r = await fetch(url, { headers: { "user-agent": "sylloge" } }); if (!r.ok) throw new Error(`${r.status} ${url}`); return r.json(); };
const clean = (s) => s?.replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\ufe0f\u2003]/gu, "").replace(/:[a-z0-9_+-]+:/g, "").replace(/\s+/g, " ").trim() || null;
const spdx = (l) => (l === "BSD-3-Clause" ? "BSD-3" : l);
const k = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 950 ? Math.round(n / 1e3) + "k" : String(n));

const result = {}, failed = [];
for (const e of entries.filter((x) => !only || only.includes(x.id))) {
  const old = prev[e.id] || {};
  try {
    const r = gh(`repos/${e.repo}`);
    const m = {
      stars: k(r.stargazers_count), n: r.stargazers_count, push: r.pushed_at.slice(0, 10),
      created: r.created_at.slice(0, 4), issues: r.open_issues_count, lic: r.license?.spdx_id && r.license.spdx_id !== "NOASSERTION" ? spdx(r.license.spdx_id) : old.lic ?? null,
      desc: clean(r.description) ?? old.desc ?? null, topics: (r.topics ?? []).slice(0, 7), archived: r.archived,
      baru: old.baru ?? false, count: old.count ?? null, v: old.v ?? null, dl: old.dl ?? null,
    };
    if (e.pkg) {
      try { m.v = (await get(`https://registry.npmjs.org/${e.pkg}/latest`)).version; } catch (x) { failed.push(`${e.id} npm: ${x.message}`); }
      try { m.dl = (await get(`https://api.npmjs.org/downloads/point/last-week/${e.pkg}`)).downloads; } catch (x) { failed.push(`${e.id} dl: ${x.message}`); }
    }
    result[e.id] = m;
  } catch (x) {
    failed.push(`${e.id} github: ${String(x.message).split("\n")[0]}`);
    if (old.n !== undefined) result[e.id] = old; // pertahankan data lama, jangan hilangkan entri
  }
}
writeFileSync(out, JSON.stringify({ date: today, entries: result }, null, 1));
console.log(`ditulis ${out}: ${Object.keys(result).length} entri, ${failed.length} masalah`);
failed.forEach((f) => console.log(" -", f));
process.exitCode = failed.length ? 2 : 0;
