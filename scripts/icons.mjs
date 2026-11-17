// Membangun berkas ikon per set (dist/assets/icons/<id>.js) dan sampel (dist/assets/icons.js)
// dari paket @iconify-json/*. Paket diunduh sekali ke .cache/ (diabaikan git).
// Pakai: node scripts/icons.mjs [--out folder]
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const out = arg("--out") || join(root, "dist/assets");
const cfg = JSON.parse(readFileSync(join(root, "scripts/icons.config.json"), "utf8"));
const dir = join(root, ".cache/node_modules/@iconify-json");

const pkgs = [...new Set(cfg.flatMap((c) => c.styles.map((s) => s[1])))];
const missing = pkgs.filter((p) => !existsSync(join(dir, p, "icons.json")));
if (missing.length) {
  console.log("mengunduh", missing.length, "paket ke .cache/");
  mkdirSync(join(root, ".cache"), { recursive: true });
  execFileSync("npm", ["install", "--prefix", join(root, ".cache"), "--no-audit", "--no-fund", "--ignore-scripts", "--no-package-lock", "--no-save", ...missing.map((p) => "@iconify-json/" + p)], { stdio: "inherit" });
}

const read = (p, f) => JSON.parse(readFileSync(join(dir, p, f), "utf8"));
const packs = Object.fromEntries(pkgs.map((p) => [p, { j: read(p, "icons.json"), info: read(p, "info.json") }]));
mkdirSync(join(out, "icons"), { recursive: true });

const sample = {};
for (const c of cfg) {
  const skip = c.skip ? new RegExp(c.skip) : null;
  const suf = c.styles.map((s) => s[2].replace("{b}", ""));
  const name = (st, b) => st[2].replace("{b}", b);
  // nama dasar: setiap ikon asli (tanpa alias) yang bukan varian gaya lain
  const bases = new Set();
  c.styles.forEach((st, k) => {
    for (const n of Object.keys(packs[st[1]].j.icons)) {
      if (skip && skip.test(n)) continue;
      if (suf[k]) { if (n.endsWith(suf[k])) { const b = n.slice(0, -suf[k].length); if (!(skip && skip.test(b))) bases.add(b); } }
      else if (!suf.some((x) => x && n.endsWith(x))) bases.add(n);
    }
  });
  const i = {}, d = {};
  for (const b of [...bases].sort()) {
    const row = c.styles.map((st) => packs[st[1]].j.icons[name(st, b)]?.body ?? null);
    if (row.every((x) => x === null)) continue;
    i[b] = row;
    const k = row.findIndex((x) => x !== null), e = packs[c.styles[k][1]].j.icons[name(c.styles[k], b)], j = packs[c.styles[k][1]].j;
    const w = e.width ?? j.width ?? 16, h = e.height ?? j.height ?? 16;
    if (w !== c.w || h !== c.h) d[b] = [w, h];
  }
  const set = { w: c.w, h: c.h, s: c.styles, i, d };
  writeFileSync(join(out, "icons", c.id + ".js"), `window.ICP=window.ICP||{};ICP[${JSON.stringify(c.id)}]=${JSON.stringify(set)};\n`);
  const p0 = packs[c.styles[0][1]];
  // sampel pratinjau: nama penuh ikon di paket set itu
  const si = {}, sd = {};
  for (const n of c.sample) {
    for (const p of new Set(c.styles.map((x) => x[1]))) {
      const j = packs[p].j, e = j.icons[n];
      if (!e) continue;
      si[n] = e.body;
      const w = e.width ?? j.width ?? 16, h = e.height ?? j.height ?? 16;
      if (w !== c.w || h !== c.h) sd[n] = [w, h];
      break;
    }
  }
  sample[c.id] = { w: c.w, h: c.h, t: p0.info.total, lic: p0.info.license.spdx, i: si, d: sd };
  console.log(c.id.padEnd(18), "ikon", String(Object.keys(i).length).padStart(5), "d", Object.keys(d).length, "t", p0.info.total);
}
writeFileSync(join(out, "icons.js"), `window.ICONS=${JSON.stringify(sample)};\n`);
