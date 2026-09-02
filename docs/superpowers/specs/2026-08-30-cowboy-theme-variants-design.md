# Cowboy Theme Variants — Sapi Papi Farm

Tanggal: 2026-08-30  
Status: Design spec — menunggu review pengguna  
Target: `/home/ubuntu/ternak-monitor/.worktrees/safe-crud-video`

## Tujuan

Membuat tiga variant visual bertema cowboy/western untuk Sapi Papi Farm tanpa mengubah kontrak data, safe CRUD, autentikasi demo, PWA, atau alur keuangan. Setiap variant harus terasa sengaja dirancang untuk aplikasi peternakan, bukan template landing page atau poster AI yang ditempelkan ke dashboard.

## Prinsip bersama

- Satu source data dan satu routing; variant hanya mengubah presentation layer.
- Semua halaman utama tetap usable untuk input dan pembacaan data.
- Aksesibilitas: kontras teks minimum WCAG AA, focus-visible, keyboard navigation, target sentuh minimum 44px.
- Responsive checkpoint: 375px, 768px, 1024px, dan 1440px.
- Tidak memakai gradient ungu/biru, glassmorphism, emoji sebagai ikon, atau animasi dekoratif berlebihan.
- Tidak menyalin teks poster referensi sebagai copy produk.
- Tidak memakai watermark referensi.
- Tekstur/noise harus memiliki opacity rendah dan tidak mengganggu tabel atau form.
- `prefers-reduced-motion` wajib dihormati.

## Sumber inspirasi yang dipetakan satu per satu

1. **Dusty Saddle** — dipakai untuk frame tipis, ribbon, badge bintang, dan treatment aged-paper.
2. **Cowboys** — dipakai untuk color grading sunset teal–ember dan siluet lanskap sebagai aksen.
3. **Sunset Rider** — dipakai untuk headline editorial yang kuat dan image-strip/layering terkontrol.
4. **Storm Rider** — dipakai untuk kontras charcoal–ember pada hero/login; watermark dan teks asing tidak digunakan.

---

## Variant A — Modern Ranch Editorial (default recommendation)

### Positioning

Aplikasi kerja harian dengan identitas ranch yang kuat tetapi tetap tenang untuk laporan keuangan.

### Visual system

- Canvas parchment terang.
- Surface cream solid.
- Primary dark brown/charcoal.
- Accent rust dan burnt orange.
- Secondary dark teal dan muted olive untuk status.
- Serif/slab heading; sans-serif body.
- Border tipis seperti label cetak.
- Ribbon hanya untuk section label, bukan setiap card.
- Noise hanya di page background dan hero/header.

### Layout

- Sidebar/header tetap fungsional.
- Dashboard KPI tetap grid biasa, bukan poster composition.
- Hero dashboard memiliki eyebrow, heading, divider, dan satu aksen lanskap tipis.
- Laporan menonjolkan KPI dan tabel dengan panel solid.
- Login memakai framing dan ember lighting yang lebih kuat.

### Interaksi

- Hover cukup dengan perubahan border/shadow kecil.
- Ribbon dan badge tidak menjadi button kecuali memiliki fungsi nyata.
- Animasi masuk singkat dan dapat dimatikan oleh reduced-motion.

### Trade-off

- Paling aman untuk operasional dan mobile.
- Identitas cowboy terasa melalui token dan detail, bukan ilustrasi besar.
- Tidak sedramatis variant B.

---

## Variant B — Full Western Poster UI

### Positioning

Aplikasi dengan pengalaman visual seperti poster frontier modern, untuk demo, branding, dan halaman publik.

### Visual system

- Background parchment/aged paper di seluruh shell.
- Frame dekoratif tipis pada halaman.
- Banner/ribbon sebagai section separator.
- Siluet desert, cactus, cowboy, dan horse sebagai layer SVG dekoratif.
- Judul besar condensed western pada hero.
- Palette rust, sand, brown, charcoal, dan muted teal.
- Surface tetap solid ketika berisi tabel/form.

### Layout

- Halaman dashboard memakai komposisi editorial asimetris.
- Hero kiri berisi headline dan summary; lanskap berada pada bagian bawah.
- KPI ditata sebagai placard horizontal dengan label uppercase.
- Tabel memakai header bergaya ribbon, tetapi row tetap standar dan terbaca.
- Mobile mengubah hero menjadi stack; ornamen samping dipotong atau disembunyikan.

### Interaksi

- Page transition fade/slide sangat ringan.
- Hover pada poster layer dibatasi agar tidak terasa seperti game.
- Dekorasi tidak menangkap pointer dan tidak mengubah layout.

### Trade-off

- Paling kuat secara branding dan mudah diingat.
- Risiko keterbacaan dan information density paling tinggi.
- Membutuhkan QA visual lebih banyak, terutama mobile dan tabel panjang.

---

## Variant C — Dual Experience

### Positioning

Dua mode visual dengan satu design token base: operational workspace yang bersih dan public/onboarding experience yang sinematik.

### Mode operational

- Mengambil fondasi Variant A.
- Parchment terang, surface cream, border rust tipis.
- Fokus pada laporan, pengeluaran, penjualan, dan navigasi.
- Tidak ada ilustrasi besar di belakang data.

### Mode public/brand

- Mengambil fondasi Variant B dan aksen Storm Rider.
- Login, empty state, onboarding, dan halaman publik boleh memakai full-bleed dusk/ranch artwork.
- Headline besar dan image-strip digunakan hanya pada area brand.
- CTA tetap konkret dan tidak memakai copy generik.

### Layout

- Routing dan data sama.
- `data-theme-variant="dual"` mengontrol shell dan public surface.
- Halaman finance selalu memakai operational mode agar konsisten dan terbaca.
- Login dan public catalog memakai brand mode.

### Interaksi

- Peralihan mode tidak dianimasikan secara berlebihan.
- Public hero dapat memakai parallax ringan; operational pages tidak.
- Semua modal/form tetap memakai focus management standar.

### Trade-off

- Keseimbangan terbaik antara branding dan usability.
- Surface area CSS dan QA lebih besar karena dua mode.
- Cocok jika Sapi Papi Farm membutuhkan wajah publik yang kuat sekaligus workspace harian yang efisien.

---

## Arsitektur implementasi

### Komponen

```text
ThemeVariantProvider
  ├─ ThemeSwitcher (dev/demo only)
  ├─ AppShell
  ├─ CowboyFrame
  ├─ RanchRibbon
  ├─ RanchBadge
  ├─ DesertAccent
  ├─ EditorialHero
  └─ OperationalSurface
```

### State dan persistence

- Variant awal dapat dipilih melalui query string atau localStorage khusus demo.
- Data domain tidak berubah.
- Default production variant: A atau C sesuai keputusan final.
- Theme switcher tidak ditampilkan sebagai fitur operasional permanen kecuali diminta.

### Asset policy

- Logo Sapi Papi tetap orisinal.
- Ilustrasi dekoratif dibuat sebagai SVG/CSS sederhana atau asset berlisensi jelas.
- Gambar AI hanya dipakai sebagai moodboard/reference, bukan dipasang langsung sebagai product asset tanpa audit.
- Tidak menghapus atau menimpa asset PWA yang sudah ada.

## Halaman yang akan divalidasi

1. Login/demo login.
2. Dashboard.
3. Pengeluaran.
4. Jual & Beli.
5. Hasil Penjualan.
6. Laporan Laba Rugi — bulanan.
7. Laporan Laba Rugi — tahunan.
8. Mobile navigation.
9. Empty/error states yang tersedia.

## Acceptance criteria

- Ketiga variant dapat dipreview dengan data demo yang sama.
- Tidak ada perubahan pada rumus laba, safe CRUD, atau login contract.
- Semua label Indonesia tetap utuh pada 375px.
- Tidak ada overflow horizontal.
- Tabel dan angka memiliki kontras yang memadai.
- Semua button/link memiliki focus-visible.
- Build, lint, test, diff check, dan browser QA lulus.
- Video demo baru hanya dibuat setelah variant final dipilih dan QA selesai.
- Tidak push, merge, atau deploy otomatis dari tahap ini.

## Rekomendasi

Implementasikan ketiganya sebagai preview switchable, lalu gunakan:

- **A** untuk operational baseline,
- **B** untuk branded poster preview,
- **C** untuk kandidat production jika public-facing experience dibutuhkan.

Dengan demikian pengguna dapat membandingkan tiga arah secara langsung tanpa mengorbankan data atau membuat tiga fork aplikasi yang sulit dirawat.
