# Backend

Express API dengan PostgreSQL, JWT, dan Gemini.

Endpoint yang tersedia:

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/profile` (Bearer token)
- CRUD `/api/livestock` (Bearer token)
- CRUD `/api/locations` (Bearer token)
- `GET`, `POST`, dan ringkasan `/api/transactions` (Bearer token)
- `POST /api/owner-daily-brief`
- CRUD akun `/api/users` untuk role `OWNER` dan `ADMIN`

Jalankan dari root dengan `npm run dev:backend`. PostgreSQL yang tidak tersedia tidak menghentikan server; health check dan endpoint AI tetap dapat digunakan, sedangkan livestock memakai data mock sementara.

Hash password user memakai format `salt:hex`, dengan nilai hex berupa hasil `scrypt` 64-byte.
