# Sylloge

Katalog UI framework dan set ikon, dengan status perawatan dari GitHub dan npm. Setiap entri punya catatan "cocok untuk" dari kurator.

Situs: https://syllogeui.github.io

112 entri (85 UI framework, 19 set ikon, 8 arsip). Data per 18 November 2026.

## Fitur

- Cari, filter per jenis dan per framework (React, Vue, Svelte, Angular, Solid, Web Components, React Native), status, dan tag. Bandingkan beberapa entri. Tampilan galeri atau tabel.
- Lab ikon per set: lihat semua ikon, ubah ukuran, warna, dan gaya, salin SVG atau kode.
- Satu halaman statis per entri, terbaca tanpa JavaScript.
- Bahasa Indonesia dan English. Tema terang, gelap, atau ikut sistem.
- Data terbuka: `data/entries.json`.

## Menjalankan

Butuh Node 20 atau lebih baru. Tidak ada dependensi untuk dipasang.

```bash
npm run build     # membangun situs ke dist/
npm run check     # pemeriksaan sebelum rilis
cd dist && python3 -m http.server 8765
```

Build pertama mengunduh paket ikon Iconify (sekitar 45 MB) ke `.cache/`.

Memperbarui bintang, versi, dan tanggal commit butuh [GitHub CLI](https://cli.github.com) yang sudah login:

```bash
npm run fetch     # menulis data/snapshots/<tanggal>.json
```

Snapshot lama tidak diubah. Build memakai yang terbaru.

## Menambah entri

Tambahkan objek ke `data/entries.json` dengan `id`, `name`, `kind` (`fw`, `icon`, atau `arsip`), `sub`, `repo`, dan tautannya. Teks `fit`, `note`, dan `warn` ditulis dalam bahasa Indonesia, dan tiap teks wajib punya padanan English di `fit_en`, `note_en`, `warn_en`. Lalu:

```bash
node scripts/fetch.mjs --only <id>
npm run release:check
```

Syarat masuk: minimal 1.000 bintang atau 50 ribu unduhan npm per minggu, ada commit dalam 180 hari terakhir, punya lisensi dan dokumentasi yang bisa dibuka. Status dihitung dari commit terakhir. UI framework: aktif sampai 45 hari, melambat sampai 180 hari, setelahnya tidak aktif. Set ikon: 120 dan 540 hari. Repo yang diarsipkan selalu tidak aktif.

## Mencari kandidat baru

```bash
npm run discover
```

Mencari repo yang belum ada di katalog lewat pencarian GitHub dan daftar organisasi besar, lalu menyaringnya dengan syarat masuk di atas. Hasilnya laporan di `.cache/discovery/`, tidak menambah entri otomatis. Tinjau demo, lisensi, dan framework tiap kandidat sebelum menambahkannya.

## Rilis

Situs tayang dari cabang `pages`, berisi hasil build saja. Cabang `main` berisi sumber.

```bash
npm run release          # build, check, siapkan commit pages (tanpa push)
npm run release -- --push
```

`--push` menimpa cabang `pages` dengan satu commit baru.

## Struktur

| Folder | Isi |
|---|---|
| `data/` | `entries.json` (tulisan tangan) dan `snapshots/` (hasil ukur per tanggal) |
| `src/` | Templat aplikasi, CSS halaman statis, thumbnail |
| `brand/` | Logo, favicon, ikon aplikasi |
| `scripts/` | `fetch`, `icons`, `build`, `check`, `release` |

## Lisensi

Kode dan data kurasi: MIT, lihat `LICENSE`. Yang bukan milik proyek ini:

- Ikon di lab ikon memakai lisensi aslinya per set (MIT, ISC, Apache-2.0, CC0, CC BY 4.0), tampil di halaman tiap set.
- Bendera bahasa dari [Circle Flags](https://github.com/HatScripts/circle-flags), MIT.
- Thumbnail di `src/thumbs/` adalah tangkapan layar situs resmi tiap proyek. Hak ciptanya milik pemiliknya.
- Nama dan logo proyek yang dikatalogkan milik pemiliknya.

"Cocok untuk" dan catatan kurator adalah pendapat pribadi, bukan data resmi proyek.
