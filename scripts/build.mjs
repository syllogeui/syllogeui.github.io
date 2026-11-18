// Membangun situs statis ke dist/: aplikasi katalog, satu halaman per entri, halaman daftar,
// sitemap, robots, llms.txt, data JSON dan CSV.
// Pakai: node scripts/build.mjs [--out folder] [--base https://alamat]
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg("--base", "https://syllogeui.github.io").replace(/\/$/, "");
const out = arg("--out", join(root, "dist"));
const read = (p) => readFileSync(join(root, p), "utf8");
const put = (p, s) => { mkdirSync(join(out, p, ".."), { recursive: true }); writeFileSync(join(out, p), s); };

// data: tulisan tangan + snapshot terbaru
const entries = JSON.parse(read("data/entries.json"));
const snapFile = readdirSync(join(root, "data/snapshots")).filter((f) => /^\d{4}-\d\d-\d\d\.json$/.test(f)).sort().pop();
const snap = JSON.parse(read("data/snapshots/" + snapFile));
const DATE = snap.date;
const SEC = { fw: "ui", icon: "icons", arsip: "archive" };
const KIND = { fw: "UI framework", icon: "Set ikon", arsip: "Arsip" };
const days = (e) => (new Date(DATE) - new Date(e.push)) / 864e5;
const ST_CODE = { Aktif: "active", Melambat: "slowing", "Tidak aktif": "inactive", Diarsipkan: "archived" };
const statusOf = (e) => { const [a, m] = e.kind === "icon" ? [120, 540] : [45, 180]; return e.archived ? ["off", "Diarsipkan"] : days(e) <= a ? ["ok", "Aktif"] : days(e) <= m ? ["slow", "Melambat"] : ["off", "Tidak aktif"]; };
const data = entries.map((e) => {
  if (!snap.entries[e.id]) throw new Error("tidak ada snapshot untuk " + e.id);
  const d = { ...e, ...snap.entries[e.id] };
  return { ...d, status: statusOf(d)[1], statusCode: ST_CODE[statusOf(d)[1]], path: `/${SEC[d.kind]}/${d.id}/` };
});

// pembantu
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;
const tgl = (s) => new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
const num = (n) => new Intl.NumberFormat("id-ID").format(n);
const cut = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…");
const CURATOR = { "@type": "Person", name: "Garin Ramadhan", url: "https://github.com/garinramadhan" };
const HEAD = (title, desc, path) => `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="author" content="Garin Ramadhan">
<link rel="canonical" href="${BASE}${path}"><meta property="og:type" content="website"><meta property="og:site_name" content="Sylloge"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${BASE}${path}"><meta name="twitter:card" content="summary">
<link rel="icon" href="/brand/favicon.svg" type="image/svg+xml"><link rel="icon" href="/brand/favicon.ico" sizes="48x48"><link rel="apple-touch-icon" href="/brand/apple-touch-icon.png"><link rel="alternate" type="text/markdown" href="/for-ai.md"><link rel="manifest" href="/brand/site.webmanifest"><meta name="theme-color" content="#12161f">`;
const SHELL = (head, crumbs, body) => `<!doctype html><html lang="id"><head>${head}<link rel="stylesheet" href="/assets/page.css"></head><body><div class="wrap">
<header class="top"><a href="/"><img src="/brand/favicon.svg" alt="" width="28" height="28">Sylloge</a></header>
<nav class="crumb" aria-label="Jejak">${crumbs.map(([h, t]) => (h ? `<a href="${h}">${esc(t)}</a>` : esc(t))).join(" › ")}</nav>
<main>${body}</main>
<footer>Data per ${tgl(DATE)} dari GitHub dan npm. Penilaian "cocok untuk" dan catatan kurator adalah pendapat kurator, bukan data resmi. Dikurasi oleh <a href="https://github.com/garinramadhan" rel="noopener">Garin Ramadhan</a>. <a href="/">Buka katalog interaktif</a>. Untuk agen AI: <a href="/for-ai.md">for-ai.md</a> adalah panduan yang ditulis khusus untuk agen AI (bahasa Inggris).</footer></div></body></html>`;
const bc = (items) => ld({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([n, p], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: BASE + p })) });

// halaman entri
const row = (k, v) => (v == null || v === "" ? "" : `<dt>${k}</dt><dd>${v}</dd>`);
const ext = (h, t) => (h ? `<a href="${esc(h)}" rel="noopener">${t}</a>` : "");
function entryPage(e) {
  const [cls, st] = statusOf(e), sec = SEC[e.kind];
  const lead = `${e.name} berstatus ${st.toLowerCase()} per ${tgl(DATE)}: commit terakhir ${tgl(e.push)}, ${e.stars} bintang di GitHub${e.lic ? `, lisensi ${e.lic}` : ""}.`;
  const title = `${e.name}: ${e.kind === "icon" ? "set ikon, status, dan gaya" : "status perawatan dan cocok untuk"} | Sylloge`;
  const alts = data.filter((x) => x.id !== e.id && x.kind === e.kind && x.sub === e.sub).sort((a, b) => b.n - a.n).slice(0, 5);
  const body = `<h1>${esc(e.name)}</h1><p class="lead">${esc(lead)}</p>
${e.warn ? `<p class="warn">${esc(e.warn)}</p>` : ""}
<div class="card"><dl>${row("Status", `<span class="st ${cls}"><i></i>${st}</span>`)}${row("Kategori", `${KIND[e.kind]}, ${esc(e.sub)}`)}${row("Commit terakhir", tgl(e.push))}${row("Bintang GitHub", esc(e.stars))}${row("Versi", esc(e.v))}${row("Unduhan npm per minggu", e.dl ? num(e.dl) : "")}${row("Lisensi", esc(e.lic))}${row("Issue terbuka", num(e.issues))}${row("Dibuat", esc(e.created))}${row("Jumlah ikon", e.count ? num(e.count) : "")}${row("Teknologi", esc([...(e.fw || []), e.sty].filter(Boolean).join(", ")))}${row("Format", esc((e.fmt || []).join(", ")))}${row("Gaya ikon", esc((e.istyle || []).join(", ")))}</dl></div>
${e.fit ? `<h2>Cocok untuk</h2><p>${esc(e.fit)}</p>` : ""}${e.note ? `<h2>Catatan kurator</h2><p>${esc(e.note)}</p>` : ""}${e.desc ? `<h2>Deskripsi resmi</h2><p>${esc(e.desc)}</p>` : ""}
<div class="btns"><a class="pri" href="/#${esc(e.id)}">Buka di katalog</a>${ext(e.home, "Situs resmi")}${ext(e.demo, "Demo")}${ext(e.gh, "GitHub")}${e.pkg ? ext("https://www.npmjs.com/package/" + e.pkg, "npm") : ""}</div>
${alts.length ? `<h2>Alternatif di kategori yang sama</h2><ul class="alt">${alts.map((a) => `<li><a href="${a.path}">${esc(a.name)}</a>, ${a.status.toLowerCase()}, ${esc(a.stars)} bintang</li>`).join("")}</ul>` : ""}`;
  const crumbs = [["/", "Sylloge"], [`/${sec}/`, KIND[e.kind]], [null, e.name]];
  const head = HEAD(title, cut(lead + (e.fit ? " Cocok untuk: " + e.fit + "." : ""), 158), e.path) +
    ld({ "@context": "https://schema.org", "@type": "SoftwareSourceCode", name: e.name, description: e.desc || undefined, codeRepository: e.gh, url: BASE + e.path, license: e.lic ? "https://spdx.org/licenses/" + e.lic : undefined, version: e.v || undefined, dateModified: e.push }) +
    bc([["Sylloge", "/"], [KIND[e.kind], `/${sec}/`], [e.name, e.path]]);
  return SHELL(head, crumbs, body);
}

// halaman daftar
function listPage(kind) {
  const sec = SEC[kind], items = data.filter((e) => e.kind === kind), subs = [...new Set(items.map((e) => e.sub))];
  const intro = { fw: "Library UI dan design system untuk web, dikelompokkan per jenis, dengan status perawatan yang dihitung dari commit terakhir.", icon: "Set ikon open source dengan jumlah ikon, gaya, dan status perawatannya.", arsip: "Library yang sudah tidak dirawat atau diarsipkan, disimpan sebagai referensi. Jangan dipakai untuk proyek baru." }[kind];
  const body = `<h1>${KIND[kind]}</h1><p class="lead">${intro} ${items.length} entri per ${tgl(DATE)}.</p>` + subs.map((s) => `<h2>${esc(s)}</h2><div class="card"><table><thead><tr><th>Nama</th><th>Status</th><th>Bintang</th></tr></thead><tbody>${items.filter((e) => e.sub === s).map((e) => `<tr><td><a href="${e.path}">${esc(e.name)}</a>${e.fit ? `<br><span style="color:var(--mute)">${esc(e.fit)}</span>` : ""}</td><td class="n">${e.status}</td><td class="n">${esc(e.stars)}</td></tr>`).join("")}</tbody></table></div>`).join("");
  const head = HEAD(`${KIND[kind]}: daftar dan status perawatan | Sylloge`, cut(`${intro} ${items.length} entri.`, 158), `/${sec}/`) + bc([["Sylloge", "/"], [KIND[kind], `/${sec}/`]]);
  return SHELL(head, [["/", "Sylloge"], [null, KIND[kind]]], body);
}

// aplikasi (beranda)
let app = read("src/template.html").replace("__DATA__", JSON.stringify(data)).replace(/const SNAP=new Date\("[\d-]+"\)/, `const SNAP=new Date("${DATE}")`);
const nFw = data.filter((e) => e.kind === "fw").length, nIc = data.filter((e) => e.kind === "icon").length;
const tglEn = new Date(DATE).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
const title = "Sylloge: katalog UI framework dan ikon", desc = `Katalog kurasi ${nFw} UI framework dan ${nIc} set ikon, dengan status perawatan, catatan kecocokan, dan perbandingan antar entri. Data GitHub dan npm per ${tgl(DATE)}.`;
const META = { id: { t: title, d: desc }, en: { t: "Sylloge: UI framework and icon catalog", d: `Curated catalog of ${nFw} UI frameworks and ${nIc} icon sets, with maintenance status, best-fit notes, and comparison. GitHub and npm data as of ${tglEn}.` } };
app = app.replace("__META__", JSON.stringify(META).replace(/</g, "\\u003c"));
app = app.replace(/<title>.*?<\/title>/, "").replace('<meta name="author" content="Garin Ramadhan">', "").replace("<head>", "<head>" + HEAD(title, desc, "/").replace('<meta charset="utf-8">', "")).replace(/<link rel="icon"[^>]*><link rel="icon"[^>]*><link rel="apple-touch-icon"[^>]*><meta name="theme-color"[^>]*>/, "");
app = app.replace("</head>", ld({ "@context": "https://schema.org", "@type": "Dataset", name: title, description: desc, url: BASE + "/", creator: CURATOR, dateModified: DATE, inLanguage: "id", distribution: ["json", "csv"].map((x) => ({ "@type": "DataDownload", encodingFormat: x === "json" ? "application/json" : "text/csv", contentUrl: `${BASE}/data/entries.${x}` })) }) + "</head>");
const nos = `<noscript><nav aria-label="Daftar entri"><h1>Sylloge</h1><p>AI agents: <a href="/for-ai.md">for-ai.md</a> is a guide written for you, with the data map and the limits. <a href="/llms-full.txt">llms-full.txt</a> has every entry in one English file.</p><p>${esc(desc)}</p>${Object.entries(SEC).map(([k, s]) => `<h2><a href="/${s}/">${KIND[k]}</a></h2><ul>${data.filter((e) => e.kind === k).map((e) => `<li><a href="${e.path}">${esc(e.name)}</a></li>`).join("")}</ul>`).join("")}</nav></noscript>`;
{ const k = app.lastIndexOf("</body>"); if (k < 0) throw new Error("template tanpa </body>"); app = app.slice(0, k) + nos + app.slice(k); }

// tulis keluaran
rmSync(out, { recursive: true, force: true });
put("index.html", app);
data.forEach((e) => put(e.path + "index.html", entryPage(e)));
Object.entries(SEC).forEach(([k, s]) => put(`/${s}/index.html`, listPage(k)));
put("404.html", SHELL(HEAD("Halaman tidak ditemukan | Sylloge", "Halaman yang kamu cari tidak ada di Sylloge.", "/404.html") + '<meta name="robots" content="noindex">', [["/", "Sylloge"], [null, "Tidak ditemukan"]], '<h1>Halaman tidak ditemukan</h1><p class="lead">Coba <a href="/">katalog</a>, <a href="/ui/">UI framework</a>, atau <a href="/icons/">set ikon</a>.</p>'));
put(".nojekyll", "");

const urls = ["/", ...Object.values(SEC).map((s) => `/${s}/`), ...data.map((e) => e.path)];
put("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${BASE}${u}</loc><lastmod>${DATE}</lastmod></url>`).join("\n")}\n</urlset>\n`);
put("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`);
// berkas untuk agen AI (bahasa Inggris): llms.txt, llms-full.txt, for-ai.md, schema.json
const KIND_EN = { fw: "UI framework", icon: "Icon set", arsip: "Archive" };
const SUB_EN = { "Komponen siap pakai": "Ready-made components", "Design system perusahaan": "Corporate design systems", "Tailwind dan copy-paste": "Tailwind and copy-paste", "Headless dan primitif": "Headless and primitives", "Dashboard dan data": "Dashboards and data", "UI untuk AI dan agent": "UI for AI and agents", "Mobile dan hybrid": "Mobile and hybrid", "Web components": "Web components", "Eksperimental dan niche": "Experimental and niche", "Set serbaguna": "General-purpose sets", "Set lengkap": "Large sets", "Milik sistem desain": "Design-system sets", "Logo merek": "Brand logos", Agregator: "Aggregators", Arsip: "Archive" };
const nf = (n) => new Intl.NumberFormat("en-US").format(n);
const block = (e) => [
  `### ${e.name}`, `- Page: ${BASE}${e.path}`, `- Type: ${KIND_EN[e.kind]}, ${SUB_EN[e.sub] ?? e.sub}`,
  `- Status: ${e.statusCode} (last push ${e.push})`, `- Stars: ${nf(e.n)}`,
  e.pkg && `- npm: ${e.pkg}${e.v ? " " + e.v : ""}${e.dl ? `, ${nf(e.dl)} downloads/week` : ""}`,
  e.lic && `- License: ${e.lic}`, e.fw?.length && `- Frameworks: ${e.fw.join(", ")}`, e.sty && `- Styling: ${e.sty}`,
  e.fmt?.length && `- Formats: ${e.fmt.join(", ")}`, e.istyle?.length && `- Icon styles: ${e.istyle.join(", ")}`, e.count && `- Icons: ${nf(e.count)}`,
  e.fit_en && `- Best for (curator's opinion): ${e.fit_en}`, e.note_en && `- Curator note: ${e.note_en}`, e.warn_en && `- Warning: ${e.warn_en}`,
  `- Repo: ${e.gh}`, e.home && `- Site: ${e.home}`,
].filter(Boolean).join("\n");
const nAr = data.filter((e) => e.kind === "arsip").length;
const agentIntro = `Curated catalog of ${nFw} web UI frameworks and ${nIc} icon sets (React, Vue, Svelte, Angular, Solid, web components), with maintenance status computed from GitHub and npm. Curated by Garin Ramadhan. Data as of ${DATE}.`;
const limits = "A snapshot refreshed by hand, not live. Not exhaustive on purpose (entry rule: 1,000+ stars or 50,000+ weekly npm downloads, and a push within 180 days). \"Best for\", notes and warnings are the curator's opinion, not official project statements.";
put("llms.txt", `# Sylloge\n\n> ${agentIntro}\n\nIf you are an AI agent: you are welcome here. for-ai.md is a guide written for you (it is documentation about this site, not a prompt). Please prefer the bulk files below to crawling pages one by one.\n\n## Start here\n\n- [for-ai.md](${BASE}/for-ai.md): guide for AI agents: where to read, what each field means, limits, how to cite\n- [llms-full.txt](${BASE}/llms-full.txt): every entry in one English text file\n- [entries.json](${BASE}/data/entries.json): structured data in both languages, with [schema.json](${BASE}/data/schema.json)\n- [entries.csv](${BASE}/data/entries.csv): the same as a spreadsheet\n\n## Limits\n\n${limits}\n\n` +
  Object.entries(SEC).map(([k, s]) => `## Entries: ${KIND_EN[k]}\n\n${data.filter((e) => e.kind === k).map((e) => `- [${e.name}](${BASE}${e.path}): ${e.statusCode}, ${nf(e.n)} stars${e.fit_en ? "; best for: " + e.fit_en : ""}`).join("\n")}\n`).join("\n"));
put("llms-full.txt", `# Sylloge: all entries\n\n> ${agentIntro}\n\nLimits: ${limits}\nRead ${BASE}/for-ai.md (a guide written for AI agents) for field meanings and how status is computed. Indonesian text for each entry is in ${BASE}/data/entries.json.\n\n` +
  Object.keys(SEC).map((k) => `## ${KIND_EN[k]} (${data.filter((e) => e.kind === k).length})\n\n${data.filter((e) => e.kind === k).map(block).join("\n\n")}\n`).join("\n"));
const V = { nFw, nIc, nAr, DATE, BASE };
put("for-ai.md", read("src/for-ai.md").replace(/\{(\w+)\}/g, (_, k) => V[k] ?? `{${k}}`));
const FIELDS = { id: ["string", "Stable id"], name: ["string", "Display name"], kind: ["string", "fw, icon or arsip"], sub: ["string", "Subcategory (Indonesian)"], status: ["string", "Indonesian status label"], statusCode: ["string", "active, slowing, inactive or archived"], push: ["string", "Date of last push, YYYY-MM-DD"], n: ["integer", "Exact GitHub stars"], stars: ["string", "Stars rounded for display"], pkg: ["string|null", "npm package"], v: ["string|null", "Latest npm version"], dl: ["integer|null", "npm downloads in the last week"], lic: ["string|null", "SPDX license from GitHub"], fw: ["array", "Web frameworks supported"], sty: ["string|null", "Styling approach"], fmt: ["array", "Icon formats"], istyle: ["array", "Icon styles"], count: ["integer|null", "Number of icons"], fit: ["string|null", "Curator: best for (Indonesian)"], fit_en: ["string", "Curator: best for (English)"], note: ["string|null", "Curator note (Indonesian)"], note_en: ["string", "Curator note (English)"], warn: ["string|null", "Warning (Indonesian)"], warn_en: ["string", "Warning (English)"], gh: ["string", "Repository URL"], home: ["string|null", "Official site"], demo: ["string|null", "Demo link"], path: ["string", "Page path on this site"] };
put("data/schema.json", JSON.stringify({ $schema: "https://json-schema.org/draft/2020-12/schema", title: "Sylloge entries.json", description: "Read " + BASE + "/for-ai.md (a guide written for AI agents) for field meanings and limits.", type: "object", required: ["date", "curator", "entries"], properties: { date: { type: "string", format: "date" }, curator: { type: "string" }, entries: { type: "array", items: { type: "object", required: ["id", "name", "kind", "status", "statusCode", "push", "n", "path"], properties: Object.fromEntries(Object.entries(FIELDS).map(([k, [t, d]]) => [k, { type: t.includes("|") ? t.split("|") : t, description: d }])) } } } }, null, 1));
put("data/entries.json", JSON.stringify({ date: DATE, curator: "Garin Ramadhan", entries: data }, null, 1));
const cols = ["id", "name", "kind", "sub", "status", "stars", "push", "v", "dl", "lic", "gh", "fit"];
const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
put("data/entries.csv", [cols.join(","), ...data.map((e) => cols.map((c) => q(e[c])).join(","))].join("\n") + "\n");

// aset
cpSync(join(root, "brand"), join(out, "brand"), { recursive: true });
cpSync(join(root, "src/thumbs"), join(out, "assets/thumbs"), { recursive: true });
cpSync(join(root, "src/page.css"), join(out, "assets/page.css"));
execFileSync("node", [join(root, "scripts/icons.mjs"), "--out", join(out, "assets")], { stdio: "ignore" });
console.log(`dist: ${data.length} entri, ${urls.length} URL, data per ${DATE}, base ${BASE}`);
