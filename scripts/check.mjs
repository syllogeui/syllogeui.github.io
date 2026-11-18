// Pemeriksaan sebelum rilis. Keluar dengan kode 1 bila ada masalah.
// Pakai: node scripts/check.mjs [--out folder]
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const i = process.argv.indexOf("--out");
const out = i > -1 ? process.argv[i + 1] : join(root, "dist");
const MAXMB = 400;
const problems = [];
const bad = (m) => problems.push(m);

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(out), rel = (p) => p.slice(out.length);
const TEXT = new Set([".html", ".xml", ".txt", ".json", ".csv", ".css", ".svg", ".webmanifest", ".md"]);
const isIconData = (p) => rel(p).startsWith("/assets/icons/") || rel(p) === "/assets/icons.js";
const pages = files.filter((p) => p.endsWith(".html"));

// 1. nama terlarang (daftar ada di .cache/forbid.json, lokal dan tidak ikut git), rahasia, dan jalur lokal
const FORBID = [[/\bgh[pousr]_[A-Za-z0-9]{20,}|\bak_[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{20,}/, "pola rahasia"], [/\/Users\/[a-z]+/, "jalur lokal"]];
const fl = join(root, ".cache/forbid.json");
if (existsSync(fl)) for (const [src, fl2, label] of JSON.parse(readFileSync(fl, "utf8"))) FORBID.push([new RegExp(src, fl2), label]);
else console.log("peringatan: .cache/forbid.json tidak ada, pemeriksaan nama terlarang dilewati");
for (const p of files) {
  if (!TEXT.has(extname(p)) || isIconData(p)) continue;
  const s = readFileSync(p, "utf8");
  for (const [re, label] of FORBID) { const m = s.match(re); if (m) bad(`${label} di ${rel(p)}: "${m[0]}"`); }
}

// terjemahan: tiap teks kurator harus punya padanan English
for (const e of JSON.parse(readFileSync(join(root, "data/entries.json"), "utf8")))
  for (const f of ["fit", "note", "warn"]) if (e[f] && !e[f + "_en"]) bad(`terjemahan ${f}_en belum ada untuk ${e.id}`);

// 2. tautan dan sumber internal ada, halaman statis tanpa title bawaan
const exists = (u) => { const path = join(out, u.split("#")[0].split("?")[0]); return existsSync(path) && (!statSync(path).isDirectory() || existsSync(join(path, "index.html"))); };
const titles = new Map(), descs = new Map();
for (const p of pages) {
  const s = readFileSync(p, "utf8"), r = rel(p);
  for (const [, u] of s.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[#?][^"]*)?"/g)) if (!exists(u)) bad(`tautan rusak di ${r}: ${u}`);
  for (const [, j] of s.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) { try { JSON.parse(j); } catch { bad(`JSON-LD tidak valid di ${r}`); } }
  if (/\stitle="/.test(s.replace(/<script[\s\S]*?<\/script>/g, ""))) bad(`atribut title bawaan browser di ${r}`);
  if (r !== "/404.html") {
    const t = s.match(/<title>(.*?)<\/title>/)?.[1], d = s.match(/<meta name="description" content="(.*?)">/)?.[1];
    if (!t) bad(`tanpa <title>: ${r}`); else titles.set(t, [...(titles.get(t) || []), r]);
    if (!d) bad(`tanpa deskripsi: ${r}`); else { descs.set(d, [...(descs.get(d) || []), r]); if (d.length > 170) bad(`deskripsi terlalu panjang (${d.length}) di ${r}`); }
    if (!s.includes('rel="canonical"')) bad(`tanpa canonical: ${r}`);
  }
}
for (const [t, rs] of titles) if (rs.length > 1) bad(`judul kembar "${t}": ${rs.join(", ")}`);
for (const [d, rs] of descs) if (rs.length > 1) bad(`deskripsi kembar di ${rs.join(", ")}`);

// 3. sitemap: setiap URL punya berkas, setiap halaman ada di sitemap
const site = readFileSync(join(out, "sitemap.xml"), "utf8");
const locs = [...site.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
for (const u of locs) if (!exists(u)) bad(`sitemap menunjuk ke berkas yang tidak ada: ${u}`);
for (const p of pages) { const r = rel(p); if (r === "/404.html") continue; const u = r.replace(/index\.html$/, ""); if (!locs.includes(u)) bad(`halaman tidak ada di sitemap: ${u}`); }

// 3a. berkas untuk agen AI: ada, memuat setiap entri, teks Inggris lengkap, tanpa penanda {kosong}
for (const f of ["for-ai.md", "llms.txt", "llms-full.txt", "data/schema.json"]) if (!existsSync(join(out, f))) bad(`berkas agen tidak ada: ${f}`);
if (existsSync(join(out, "llms-full.txt"))) {
  const full = readFileSync(join(out, "llms-full.txt"), "utf8"), list = JSON.parse(readFileSync(join(out, "data/entries.json"), "utf8")).entries;
  for (const e of list) if (!full.includes(e.path)) bad(`llms-full.txt tidak memuat ${e.path}`);
}
if (existsSync(join(out, "for-ai.md")) && /\{[a-zA-Z]+\}/.test(readFileSync(join(out, "for-ai.md"), "utf8"))) bad("for-ai.md masih berisi penanda {…} yang belum terisi");

// 3a2. halaman utama harus bisa dibaca tanpa JavaScript: <noscript> memuat tautan agen dan setiap entri
{
  const idx = readFileSync(join(out, "index.html"), "utf8"), ns = (idx.match(/<noscript>([\s\S]*?)<\/noscript>/) || [])[1] || "";
  if (!ns) bad("index.html tanpa <noscript>");
  else {
    for (const u of ["/for-ai.md", "/llms-full.txt"]) if (!ns.includes(`href="${u}"`)) bad(`<noscript> tanpa tautan ${u}`);
    for (const e of JSON.parse(readFileSync(join(out, "data/entries.json"), "utf8")).entries) if (!ns.includes(`href="${e.path}"`)) bad(`<noscript> tanpa tautan ${e.path}`);
  }
}

// 3b. manifest: ikon yang dirujuk ada
for (const p of files.filter((f) => f.endsWith(".webmanifest"))) for (const ic of JSON.parse(readFileSync(p, "utf8")).icons || []) if (!exists(ic.src)) bad(`manifest menunjuk ke ikon yang tidak ada: ${ic.src}`);

// 4. ukuran
const mb = files.reduce((a, p) => a + statSync(p).size, 0) / 1e6;
if (mb > MAXMB) bad(`ukuran ${mb.toFixed(0)} MB melebihi ${MAXMB} MB`);

console.log(`diperiksa: ${files.length} berkas, ${pages.length} halaman, ${locs.length} URL di sitemap, ${mb.toFixed(1)} MB`);
if (problems.length) { console.log(`${problems.length} masalah:`); problems.slice(0, 40).forEach((m) => console.log(" -", m)); process.exit(1); }
console.log("lolos semua pemeriksaan");
