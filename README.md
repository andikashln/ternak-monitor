# Ternak Monitor

Aplikasi manajemen peternakan berbasis React dan Express untuk pencatatan ternak, kesehatan, bobot, reproduksi, mutasi, penjualan, pakan, keuangan, dan laporan harian.

## Struktur

```text
backend/   Express API, PostgreSQL, JWT, dan integrasi Gemini
frontend/  React 19, Vite, Tailwind CSS, local reactive store, PDF/XLSX
```

Frontend saat ini menyimpan data operasional demo di `localStorage`. Backend menyediakan fondasi REST untuk autentikasi, ternak, lokasi, transaksi, dan endpoint Owner Daily Brief. Integrasi penuh data operasional frontend ke PostgreSQL masih merupakan pengembangan berikutnya.

## Menjalankan aplikasi

Persyaratan: Node.js 18+ dan npm.

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health check: http://localhost:3001/api/health

PostgreSQL bersifat opsional untuk menjalankan UI demo. Untuk memakai REST API, isi konfigurasi database pada `backend/.env` berdasarkan `backend/.env.example`.

Fitur Owner Daily Brief memerlukan `GEMINI_API_KEY` pada `backend/.env`.

### Login development

Saat PostgreSQL belum terhubung, backend menyediakan login lokal khusus development berdasarkan nilai `DEMO_USER_*` di `backend/.env`.

```text
Email: owner@ternak.local
Password: TernakDemo2026!
```

Akun development bawaan memakai password yang sama:

| Role | Email |
|---|---|
| OWNER | `owner@ternak.local` |
| ADMIN | `admin@ternak.local` |
| PETUGAS | `petugas@ternak.local` |
| KEUANGAN | `keuangan@ternak.local` |
| PENJUALAN | `penjualan@ternak.local` |
| MITRA | `mitra@ternak.local` |

OWNER dan ADMIN mendapatkan menu **Manajemen Pengguna**. Owner dapat mengelola seluruh akun; Admin tidak dapat mengubah akun Owner.

Mode ini otomatis tidak berlaku ketika `NODE_ENV=production`. Pada production, login selalu memakai tabel `users` PostgreSQL.

## Pemeriksaan kualitas

```bash
npm run lint
npm run build
npm audit
```

## Script workspace

- `npm run dev` — menjalankan backend dan frontend bersamaan
- `npm run dev:backend` — hanya backend
- `npm run dev:frontend` — hanya frontend
- `npm run lint` — pemeriksaan TypeScript kedua workspace
- `npm run build` — build produksi kedua workspace
- `npm start` — menjalankan backend hasil build
