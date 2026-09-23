# Deploy Supabase Edge Function: upload-url

Edge function ini menghasilkan presigned PUT URL ke Cloudflare R2,
sehingga browser upload file langsung tanpa expose secret key.

## Prasyarat
1. Supabase CLI terinstall (`supabase --version`).
2. Login: `supabase login` (buka link di browser).
3. Link project: `supabase link --project-ref sltnzuuapmfhbineopfy`.

## Set secrets (sekali)
```bash
supabase secrets set \
  R2_ACCOUNT_ID=<R2_ACCOUNT_ID> \
  R2_ACCESS_KEY_ID=<R2_ACCESS_KEY_ID> \
  R2_SECRET_ACCESS_KEY=<R2_SECRET_ACCESS_KEY> \
  R2_BUCKET=papifarm
```

## Deploy function
```bash
cd /home/ubuntu/ternak-monitor/.worktrees/safe-crud-video
supabase functions deploy upload-url --no-verify-jwt
```

> `--no-verify-jwt` dipakai karena function dipanggil dari frontend dengan anon key
> (bukan JWT user). Untuk produksi, sebaiknya pakai JWT dan cek auth di function.

## Verifikasi
```bash
curl -X POST "https://sltnzuuapmfhbineopfy.supabase.co/functions/v1/upload-url" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.pdf","contentType":"application/pdf"}'
```
Harus return JSON berisi `signedUrl`, `key`, `publicUrl`.

## Catatan public URL
`publicUrl` yang dihasilkan memakai endpoint S3 langsung
(`<account>.r2.cloudflarestorage.com/<bucket>/<key>`) yang TIDAK bisa diakses
public tanpa auth. Agar file bisa dibuka di browser, aktifkan salah satu:
- **R2.dev subdomain** (Settings → Public access → R2.dev, bucket public), atau
- **Custom domain** di Cloudflare (lebih disarankan untuk produksi).

Setelah public access aktif, ganti `publicUrl` di function menjadi domain publik
(misal `https://pub-<hash>.r2.dev/<key>` atau custom domain).
