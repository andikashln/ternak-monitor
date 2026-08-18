# Frontend

Frontend React 19 + Vite untuk Ternak Monitor.

Jalankan dari root:

```bash
npm run dev:frontend
```

Konfigurasi API berada di `.env.local`:

```text
VITE_API_URL=http://localhost:3001/api
```

Data demo operasional saat ini disimpan di browser melalui `localStorage`. Export PDF menggunakan jsPDF, sedangkan import/export XLSX menggunakan parser yang dimuat secara dinamis.

Dashboard dilindungi halaman login. Token JWT disimpan di browser, diverifikasi ulang saat refresh, dan dibersihkan saat logout atau ketika backend mengembalikan status `401`.
