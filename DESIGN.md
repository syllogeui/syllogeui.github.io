# DESIGN.md: Peta UI Framework React

Arah: **Meja kerja mengambang** bertema **Liquid Glass** (dipilih Garin, 17 Nov 2026). Mode: Operate (memilih dan membandingkan). Semua layar di proyek ini mengikuti dokumen ini sampai Garin minta revamp.

## Konsep
Tiga zona yang masing-masing melayang di atas latar (kontrol hanya di rak, kanvas hanya berisi daftar): **rak** di kiri (kategori dan filter), **kanvas** di tengah (galeri), **inspector** di kanan yang baru muncul saat kartu diklik (detail entri terpilih). Tidak ada komponen yang menyentuh tepi layar, dan isi komponen tidak menyentuh tepi wadahnya.

## Aturan inti (urutan penting)
1. **Tepi viewport**: setiap komponen berjarak `--edge` (16px, 12px di bawah 900px) dari tepi layar. Tidak ada panel yang menempel ke tepi atau sudut.
2. **Jarak antar zona**: `--gap` 16px.
3. **Isi tidak menyentuh tepi wadah**: padding panel `--pad` 12px. Elemen sticky memakai offset sama (`top: 12px`), jadi toolbar tidak pernah menempel ke tepi panel.
4. **Radius konsentris**: radius dalam = radius luar dikurangi padding. Panel 28, kartu 16 (28 - 12), gambar dalam kartu 8 (16 - 8). Kontrol berbentuk pil memakai 999.
5. **Elevasi tiga tingkat**, semua dengan offset dan blur lembut, tanpa halo nol-offset:
   - e1: kartu dan kontrol.
   - e2: panel (rak, kanvas, inspector).
   - e3: dock perbandingan, dialog.
   Panel tidak memakai garis tepi; kedalaman datang dari bayangan.
6. **Fokus**: cincin 2px aksen dengan jarak 2px. Semua kontrol dapat dijangkau keyboard.

## Material (Liquid Glass)
Dasar riset: vault `concepts/liquid-glass-web.md` (Apple WWDC25, HIG, Dribbble, Awwwards). Satu dunia: semua komponen duduk di atas latar yang sama.
- **Latar**: sedikit digelapkan dan dilembutkan (brightness 0,84 terang / 0,74 gelap, blur 2px) supaya kaca dan kartu naik sebagai hierarki; lingkaran tipis tetap tajam agar lensing terbaca. Enam bola warna bertepi tegas yang melayang pelan (warna diambil dari screenshot library, berganti tiap 9 detik), cahaya ambient blur, lingkaran konsentris tipis. Bola bertepi tegas adalah bahan yang dibengkokkan kaca, jadi lensing terbaca.
- **Kaca (navigasi dan kontrol)**: rak, inspector, dialog, menu, dock. Lensing SVG (peta perpindahan dari permukaan squircle dan hukum Snell, n 1,5) di `backdrop-filter`, blur 1px untuk kaca besar. Hanya Chromium; di browser lain jatuh ke blur dan rim. Param per elemen: `data-lens="bezel,ketebalan,perpindahan-maks"`; uji `?lens=off` dan `?lens=strong`. Kaca yang berisi teks padat (`.dense`: menu, dialog, dock) memakai blur 16px dan tint lebih pekat agar terbaca.
- **Rim**: garis 1,5px dengan dua highlight yang mengalir sendiri mengelilingi tepi (dua `@property` sudut, kecepatan dan arah berbeda, napas opasitas), fase tiap panel digeser. Tidak terhubung ke kursor.
- **Konten (kartu, judul grup, tabel)**: bahan konten hampir buram tanpa blur dan tanpa lensing, tint dari tema, rim tipis statis. Tidak ada wadah kanvas: kartu melayang langsung di atas latar. Tidak ada kaca di atas kaca.
- **Kontrol di atas kaca** memakai fill tipis (`--cf`) dan garis dalam (`--cl`). Aksi utama (Lihat demo, Bandingkan) satu-satunya yang diberi tint aksen.
- **Dropdown kustom**: tombol + popover listbox kaca, mendukung ↑ ↓ Home End, ketik huruf, Enter, Esc, dan fokus kembali ke tombol. Tidak ada elemen bawaan browser (select, tombol hapus kolom cari, tooltip `title`).
- **Aksesibilitas**: reduced-motion mematikan semua gerak; reduced-transparency mengganti kaca dengan permukaan padat dan memudarkan latar; prefers-contrast menebalkan garis. Kontras teks di atas kaca terukur 7,0 sampai 15,6.

## Taksonomi dan detail
- Rak berisi accordion **Kategori → Subkategori** (eksklusif, satu kategori terbuka): UI Framework (9 subkategori), Ikon (5), Arsip (library mati, tersembunyi dari "Semua"). Tiap entri punya satu `kind` dan satu `sub`, ditambah tag per dimensi: gaya styling, framework, gaya ikon, format, lisensi. Filter (status dan tag) berupa bagian lipat di rak dengan jumlah per chip.
- Status ikon memakai ambang lebih longgar (aktif ≤120 hari, melambat ≤540) karena set ikon yang selesai tidak perlu sering diperbarui.
- **Hirarki menu rak**: tanpa garis pemisah, pengelompokan lewat permukaan. Pohon kategori (Semua, UI Framework, Ikon) ada di satu panel dalam; kategori bercetak tebal dengan ikon gambar sendiri dan titik aksen bila anaknya aktif; subkategori menjorok, ringan dan redup, aktif berisi lembut dengan titik aksen (CSS biasa). Arsip baris terpisah di bawah panel. Filter, Gallery/Tabel, dan Urutkan di panel dalam kedua yang menempel ke dasar rak. Penunjuk meregang hanya di tingkat teratas. Di HP menu menjadi baris pil yang bisa digeser.
- **Detail = modal besar** (maks 1080x780, jarak 16px dari tepi, HP hampir layar penuh), dua kolom: pratinjau di kiri, informasi lengkap di kanan. Tidak ada inspector samping. Link dalam (`#id`) tetap membuka entri, termasuk entri Arsip.
- **Lab ikon** di modal ikon: 60 ikon contoh per set (tertanam di `assets/icons.js`, tanpa jaringan), cari, ukuran 16-96px, 5 warna, salin SVG dan nama, tombol ke galeri lengkap. Sumber SVG: Iconify API saat build (lisensi tiap set tetap berlaku; Font Awesome wajib atribusi).

## Tier perangkat dan performa
Tujuan: jalan di perangkat lemah dan tidak membuat laptop panas. Default **mid**; **lite** untuk HP dan perangkat 2 inti ke bawah; **full** hanya lewat `?tier=full` (opt-in). Tier turun sendiri ke lite bila 1,5 detik pertama berjalan di bawah 30 fps. Paksa dengan `?tier=full|mid|lite`.
- **full**: lensing SVG di rak, gooey, parallax kursor, bola bertepi tegas.
- **mid**: kaca blur 8px (menu, dialog, dock 12px), bola latar bertepi lembut tanpa filter, tanpa lensing.
- **lite**: tanpa backdrop-filter dan tanpa cahaya ambient; hanya transform dan opasitas.
Aturan biaya di semua tier:
- Gerak latar dan rim berhenti 6 detik setelah tidak ada interaksi, saat jendela tidak aktif, dan saat tab tersembunyi; hidup lagi begitu ada interaksi.
- Rim berputar lewat `transform` (GPU), bukan animasi `@property`.
- Cahaya ambient berupa gradien radial, bukan `blur(90px)`.
- Kartu di luar layar tidak dirender (`content-visibility`); tidak ada shimmer.
- Lensing SVG hanya di rak.

## Revisi material (17 Nov, akhir)
Liquid glass aman untuk semua device: blur hanya di rak (2px) plus lensing SVG di rak, otomatis di tier full (6+ inti, 8GB+, bukan sentuh; turun ke mid bila fps <45, lite untuk HP). Panel lain (modal, menu, dock) tanpa backdrop-filter: kesan kaca dari tint padat, sorot dalam atas-bawah, dan rim mengalir. Gooey dimatikan secara default. Modal: kolom kiri menempel (sticky), fakta 3 kolom, tinggi mengikuti isi.

## Modal ikon
Satu file per set di `assets/icons/<id>.js` (25MB total, 18 set, dimuat hanya saat modal set itu dibuka; `assets/icons.js` hanya contoh untuk thumbnail kartu). Penyaringan gaya saat build: Phosphor tanpa Thin/Light, Fluent hanya ukuran 24, Material Symbols hanya Outline dan Solid, Heroicons tanpa ukuran 16/20, Ionicons tanpa Sharp. Tata letak: header satu baris; kiri pencarian, pemilih gaya, dan kisi virtual (hanya baris terlihat yang dirender); kanan pratinjau, kontrol (ukuran, garis, alpha, warna, latar), tab kode (SVG, React, Vue, Svelte, HTML, CSS), dan info set dalam bagian lipat. Pratinjau mengikuti blok CSS (nesting di `#lbig`), jadi tab CSS bisa disunting langsung. Kode React native hanya untuk Lucide, Tabler, Phosphor, Heroicons, Radix; set lain memakai @iconify/react. Kontrol garis hanya muncul untuk ikon berbasis stroke. Panah keyboard berpindah ikon, Enter atau klik dua kali menyalin nama.

## Filter dan modal ikon (revisi)
Filter pindah dari rak ke toolbar konten (kanan atas): tombol Filter berlencana membuka panel kaca (popover, 380px, rata kanan ke tombol); filter aktif tampil sebagai chip yang bisa dihapus satu per satu plus "Hapus semua". Modal ikon dikelompokkan jadi tiga bagian berjudul (Pratinjau, Atur, Kode), kontrol dalam panel dalam, kolom label 96px satu baris, dua kolom mulai 760px.

## Toolbar, rak bawah, Docs/Legal, bahasa (17 Nov, akhir)
Toolbar konten (kanan atas): Urutkan, toggle Gallery/Tabel (ikon + tooltip), Filter. Dasar rak: tema (3 ikon), bahasa ID/EN, Docs, Legal, tanggal data. Docs dan Legal berupa modal; Legal memuat tabel lisensi dari data dan catatan atribusi. Bahasa: ID adalah teks asli di kode, EN lewat kamus + pola dan MutationObserver (`tr()`), catatan kurator ("Cocok untuk", "Catatan kurator") tetap Indonesia dan diberi keterangan di Docs. Modal ikon satu layar (tinggi = layar - 32px): kiri pencarian + gaya + kisi virtual, kanan tab Pratinjau/Info, kontrol dua kolom, tab kode, editor mengisi sisa tinggi. Pengaturan ikon terakhir disimpan (localStorage `iconset`), tautan dalam `#set/ikon`, pintasan `/`, `[`, `]`, `C`, komentar atribusi lisensi pada kode Font Awesome/Simple Icons.

## Pencarian di toolbar, spacing modal, hover (17 Nov, akhir)
Pencarian pindah ke toolbar konten, satu baris dengan Urutkan, toggle tampilan, dan Filter (HP: cari di atas, kontrol di bawahnya); placeholder mengikuti kategori. Semua modal memakai token `--medge` (24px ke tepi layar) dan `--mpad` (28px padding dalam); turun ke 16/20px di layar rendah dan 12/16px di HP. Hover kartu: naik 3px, bayangan netral, tanpa outline berwarna, tanpa senter dan tilt; fokus keyboard memakai cincin warna ink. Tanpa mask gradasi di tepi gulir dan tanpa content-visibility pada kartu.

## Tema dan tooltip
Tiga pilihan: System (default, ikut OS), Light, Dark. Dipasang lewat `data-theme` di `<html>` oleh skrip kecil sebelum cat pertama (tanpa kedip), disimpan di localStorage; System menghapus penyimpanan. Semua warna lewat token di `:root`, nilai gelap ada di dua tempat yang identik (`@media` untuk System, `[data-theme=dark]` untuk paksa). Kontrol tiga ikon di dasar rak. Tooltip kustom: atribut `data-tip` (tanpa `title`), muncul seketika saat hover dan fokus keyboard, membalik bila mepet tepi, tidak muncul di layar sentuh.

## Editor kode
Blok kode di modal ikon bergaya editor: bilah berkas (nama sesuai tab), tombol Salin, nomor baris, latar gelap tetap di kedua tema, pewarna sintaks tulis sendiri (markup/JSX dan CSS, tanpa pustaka). Tab CSS: textarea transparan di atas lapisan berwarna dengan ukuran identik, jadi bisa disunting langsung.

## Fokus modal
Saat modal terbuka, satu lapisan `.veil` memburamkan latar (14px, digelapkan) dan gerak latar dijeda; modal menjadi kaca tembus (tint 60%). Tier lite: tanpa blur, modal padat. Reduced-transparency: padat.

## Gerak
Satu bahasa: kaca bergerak seperti cairan.
- Materialize: inspector, dialog, menu, dock, dan perbandingan muncul dengan menaikkan pembelokan lensing dari nol (460ms) ditambah skala kecil, bukan fade.
- Press: kontrol mengempis 5% lalu kembali dengan kurva pegas; kartu terangkat 3px saat hover.
- Daftar mengalir (FLIP): saat filter, kategori, urutan, atau pencarian berubah, kartu yang tetap meluncur ke posisi baru, yang hilang mengerut, yang baru tumbuh bergelombang. Hanya kartu di layar (maksimal 30) dan hanya tier mid ke atas. Pencarian ditunda 140ms.
- Hover kartu: tilt maksimal 3,5 derajat dengan kilap yang mengikuti posisi kursor; hanya pointer halus, mati saat kursor cepat.
- Inspector: isi bergeser searah navigasi (maju atau mundur), angka stars menghitung naik 0,6 detik, thumbnail dan judul terbang dari kartu (View Transitions).
- Kontrol: centang tergambar, dock menampilkan chip nama entri yang dipilih, kolom cari melentur saat fokus.
- Morph: thumbnail kartu menyatu ke gambar inspector (View Transitions).
- Rim mengalir sendiri; bola latar melayang 36-58 detik.
- Scroll edge menggantikan scrollbar (mask 28px hanya bila masih ada konten).

## Token
| Token | Terang | Gelap |
|---|---|---|
| `--ground` | #cfd6df (dengan sorotan radial lembut) | #07090c |
| `--panel` | #f4f6f9 | #12161c |
| `--card` | #ffffff | #1a2028 |
| `--ink` | #11151b | #e9ebef |
| `--mute` | #55606d | #9aa3af |
| `--acc` (isi tombol, lencana) | #db5fa1 | #db5fa1 |
| `--acc-ink` (teks di atas isi) | #10141b | #10141b |
| `--acc-t` (teks dan tautan aksen) | #971c65 | #f594c3 |
| `--ok` / `--slow` / `--off` | #0f7a4a / #9a6200 / #6b7280 | #4ade9a / #f0b84a / #8b94a1 |

Jarak: skala 4, 8, 12, 16, 24. Tipe: tumpukan sistem (`ui-sans-serif`), 15px dasar, angka tabular untuk data, mono hanya untuk perintah dan pintasan. Status tidak pernah hanya warna: selalu titik plus teks.

## Komponen
- **Rak**: panel kiri 268px, satu-satunya tempat kontrol daftar: pencarian, jumlah hasil, kategori, chip status, Gallery/Tabel, urutan, tombol latar, catatan sumber. Tidak ada bar kontrol terpisah di kanvas.
- **Kartu** (lapisan konten): padding 8px, gambar masuk ke dalam kartu dengan radius selaras, nama sebagai tombol yang meregang ke seluruh kartu, kotak "Bandingkan" terpisah. Kartu terpilih memakai cincin aksen.
- **Inspector**: panel kanan 392px. Tertutup saat halaman dibuka dan kanvas memakai seluruh lebar. Muncul saat kartu diklik (kanvas menyempit), tertutup lewat tombol X atau Esc. Di bawah 1200px berubah jadi dialog melayang dengan jarak 12px dari semua tepi. Isi: gambar, aksi (Lihat demo utama), cocok untuk, catatan kurator, deskripsi, fakta dalam ubin terpisah, perintah pasang, topik.
- **Dock perbandingan**: pil gelap melayang di bawah kanvas, aktif saat 2 entri atau lebih dipilih (maksimal 4).
- **Infinite scroll**: 24 kartu (tabel 40 baris) per batch lewat IntersectionObserver, dengan tombol "Muat lebih banyak" sebagai cadangan keyboard.



## Suara teks
Bahasa Indonesia biasa, kalimat lengkap. Istilah umum (dashboard, headless, design system) tetap Inggris. Label fakta tidak menyembunyikan angka: penilaian kurator selalu diberi label "Catatan kurator" atau "Cocok untuk".

## Data dan batas
Data GitHub dan npm per 17 Nov 2026 (snapshot). Sumber utama ada di vault, `concepts/react-ui-frameworks.md`. Thumbnail adalah screenshot situs resmi yang disimpan di `assets/thumbs/`.

## Identitas
Nama Sylloge (kumpulan hal pilihan). Tanda: bingkai kaca persegi membulat berisi empat bentuk (lingkaran, kotak, segitiga, cincin). Lingkaran dan cincin berwarna aksen Magenta #db5fa1, bingkai dan dua bentuk lain netral (ink #10141b di terang, putih di gelap). Warna aksen dipilih karena jauh dari hijau, amber, dan abu status, dan dari biru yang ramai di kategori ini. Teks di atas isi aksen memakai ink gelap (5,4:1), bukan putih.

Berkas di `brand/`: simbol (terang), simbol-reversed (gelap), versi kecil untuk ukuran favicon (bingkai lebih tebal), varian hitam, putih, dan satu warna, ikon aplikasi (tile #12161f), favicon.svg yang mengikuti skema warna sistem, favicon.ico dan PNG, apple-touch-icon, ikon 192/512, maskable, webmanifest. Lockup dengan tulisan menunggu keputusan font.

## Panel kiri
Header berisi logo, nama Sylloge, dan subjudul pendek. Tombol bulat di tepi kanan panel mengciutkan panel menjadi rail 72 px dan melebarkannya lagi; posisinya tidak berpindah di dua keadaan. Pilihan tersimpan di `localStorage` (`rail`); tanpa pilihan, panel ciut otomatis di layar 900 sampai 1199 px. Di bawah 900 px susunan bertumpuk dan tombol tidak ada.

Mode ciut: hanya logo (32 px), ikon kategori, satu tombol tema, satu tombol bahasa, Docs, dan Legal; semua tombol satu bentuk (kotak membulat 44 px) tanpa wadah bersarang, dengan garis tipis sebelum Arsip dan sebelum kontrol bawah. Hover menampilkan tooltip nama di kanan ikon (`data-rtip`, dengan jumlah entri). Klik kategori (UI Framework, Ikon), tema, atau bahasa membuka panel samping (popover kaca, `#sidem`) di kanan ikon yang sama: kategori menampilkan "Semua" dan subkategori dengan jumlah, tema dan bahasa menampilkan pilihannya. Panah, Home, End, Enter, dan Esc bekerja; klik di luar menutup; tooltip disembunyikan selama panel terbuka. "Semua" dan "Arsip" langsung memilih. Selama panel bergerak, kaca lensing diganti blur biasa, lalu dipasang lagi di akhir, supaya peta lensing tidak dihitung ulang tiap frame.

