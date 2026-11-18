// Mencari kandidat entri baru. Hanya membuat laporan, tidak mengubah data/entries.json.
// Pakai: node scripts/discover.mjs [--all]   (--all menampilkan juga yang ditolak beserta alasannya)
// Laporan ditulis ke .cache/discovery/<tanggal>.json (lokal, tidak ikut git, tidak pernah menimpa berkas lama).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const showAll = process.argv.includes("--all");
const entries = JSON.parse(readFileSync(join(root, "data/entries.json"), "utf8"));
const known = new Set(entries.flatMap((e) => [e.repo, e.gh2 && e.gh2.replace("https://github.com/", "")]).filter(Boolean).map((s) => s.toLowerCase()));
const knownPkg = new Set(entries.map((e) => e.pkg).filter(Boolean));

// Aturan masuk (sama dengan yang dipakai saat menambah entri secara manual)
const RULE = { stars: 1000, weeklyDl: 50000, maxDays: 180 };
const NAME_NOT_UI = /^awesome|-awesome|-skills?$|^design-extract|^dembrandt|playroom|storybook/i;
const WEB = new Set(["TypeScript", "JavaScript", "Vue", "Svelte", "HTML", "CSS", "MDX", "Astro", "SCSS", "Dart", null]);
const NOT_UI = /curated list|awesome|boilerplate|starter|tutorial|course|cheat ?sheet|interview|roadmap|resources? for|template for|\blinter\b|\bmcp\b|\bskills?\b|extract|docgen|documentation generation|DESIGN\.md|format specification|workshop for|figma/i;
const LOOKS_UI = /\b(ui|design system|components?|icons?|widgets?|elements|toolkit|primitives)\b/i;
const today = new Date();

const gh = (path) => { try { return JSON.parse(execFileSync("gh", ["api", path], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })); } catch { return null; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cand = new Map();
const add = (r, via) => { const k = r.full_name.toLowerCase(); if (!known.has(k) && !cand.has(k)) cand.set(k, { r, via: [via] }); else if (cand.has(k)) cand.get(k).via.push(via); };

// 1. pencarian GitHub tanpa bergantung pada topik repo
const Q = [
  "design system stars:>1200", "ui components library stars:>1200", "component library react stars:>1000", "component library vue stars:>1000",
  "ui library svelte stars:>800", "ui components angular stars:>800", "web components library stars:>800", "icons svg set stars:>1500",
  "design system created:>2025-01-01 stars:>500", "ui components created:>2025-06-01 stars:>300", "shadcn registry components stars:>500",
];
for (const q of Q) { const r = gh(`search/repositories?q=${encodeURIComponent(q)}&sort=stars&per_page=40`); await sleep(2200); (r?.items ?? []).forEach((x) => add(x, "pencarian: " + q.split(" stars")[0])); }

// 2. daftar pantau organisasi besar (rilis baru mereka sering tanpa topik)
const ORGS = ["meta", "facebook", "vercel", "google", "angular", "material-components", "microsoft", "adobe", "IBM", "carbon-design-system", "Shopify", "github", "primer", "atlassian-labs", "salesforce", "cloudflare", "uber", "spotify", "twilio", "mui", "radix-ui", "chakra-ui", "ant-design", "elastic", "palantir", "grafana", "linear", "stripe", "figma", "canva", "mantinedev", "tailwindlabs", "nuxt", "sveltejs"];
for (const o of ORGS) {
  const r = gh(`orgs/${o}/repos?sort=pushed&per_page=60`); await sleep(900);
  (r ?? []).filter((x) => /ui|design|component|icon|elements|kit|astryx/i.test(x.name)).forEach((x) => add(x, "organisasi: " + o));
}

// 3. pemeriksaan aturan
const out = [], rejected = [];
for (const { r, via } of cand.values()) {
  const days = Math.round((today - new Date(r.pushed_at)) / 864e5);
  const why = [];
  if (r.fork) why.push("fork"); if (r.archived) why.push("diarsipkan");
  if (r.stargazers_count < RULE.stars) why.push(`bintang ${r.stargazers_count} < ${RULE.stars}`);
  if (days > RULE.maxDays) why.push(`${days} hari tanpa push`);
  if (!WEB.has(r.language)) why.push("bukan bahasa web (" + r.language + ")");
  if (NOT_UI.test(r.description ?? "") || NAME_NOT_UI.test(r.name)) why.push("daftar, alat bantu, atau templat, bukan library");
  if (!LOOKS_UI.test((r.description ?? "") + " " + r.name)) why.push("tidak tampak sebagai library UI");
  const row = { repo: r.full_name, stars: r.stargazers_count, days, license: r.license?.spdx_id ?? null, language: r.language, home: r.homepage || null, desc: (r.description ?? "").slice(0, 110), via: [...new Set(via)].slice(0, 2) };
  (why.length ? rejected.push({ ...row, why }) : out.push(row));
}
out.sort((a, b) => b.stars - a.stars);

// 4. unduhan npm: paket dianggap milik repo hanya bila field repository-nya menunjuk ke repo itu
const mine = (p, repo) => fetch(`https://registry.npmjs.org/${p.replace("/", "%2f")}/latest`).then((x) => x.ok ? x.json() : null).then((j) => j && String(j.repository?.url ?? j.repository ?? "").toLowerCase().includes(repo.toLowerCase())).catch(() => false);
for (const c of out) {
  const [org, name] = c.repo.toLowerCase().split("/");
  for (const p of [name, "@" + org + "/" + name, name.replace(/-ui$/, "") + "-ui"]) {
    if (knownPkg.has(p) || !(await mine(p, c.repo))) continue;
    try { const j = await (await fetch(`https://api.npmjs.org/downloads/point/last-week/${p}`)).json(); c.npm = { pkg: p, weekly: j.downloads ?? 0 }; break; } catch {}
  }
}

const date = today.toISOString().slice(0, 10);
mkdirSync(join(root, ".cache/discovery"), { recursive: true });
let file = join(root, `.cache/discovery/${date}.json`), n = 1;
while (existsSync(file)) file = join(root, `.cache/discovery/${date}-${++n}.json`);
writeFileSync(file, JSON.stringify({ date, rule: RULE, candidates: out, rejected: showAll ? rejected : rejected.length }, null, 1));

console.log(`${cand.size} repo diperiksa, ${out.length} kandidat lolos aturan (bintang >= ${RULE.stars}, aktif <= ${RULE.maxDays} hari).`);
for (const c of out) console.log(`${c.repo.padEnd(44)} ${String(c.stars).padStart(6)} bintang  ${String(c.days).padStart(3)} hari  ${String(c.license ?? "tanpa lisensi").padEnd(12)} ${c.npm ? c.npm.weekly + "/mgg" : "-"}  ${c.desc}`);
if (showAll) for (const c of rejected.sort((a, b) => b.stars - a.stars).slice(0, 40)) console.log(`  ditolak ${c.repo.padEnd(40)} ${c.why.join("; ")}`);
console.log("\nditulis:", file.replace(root, ""));
console.log("Tinjau tiap kandidat (demo, lisensi, framework) sebelum menambahkannya ke data/entries.json.");
