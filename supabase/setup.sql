-- ============================================================================
-- DUTA AGRI NUSANTARA — Supabase Setup (jalankan di SQL Editor dashboard)
-- Frontend membaca role dari auth.users.raw_user_meta_data.role
-- (lihat services/supabase.ts -> profileFromSupabaseUser).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Buat 5 user via Authentication > Users > Add user (dashboard).
--    Saat Add user, isi "User metadata" (JSON) dengan contoh di bawah.
--    Password tentukan sendiri (min. 6 karakter), lalu konfirmasi email bila
--    "Confirm email" aktif (rekomendasi: matikan dulu untuk testing).
--
--    Ptdanpusat@gmail.com          -> {"role":"OWNER","display_name":"Owner Pimpinan"}
--    Papifarmriau@gmail.com        -> {"role":"OWNER","display_name":"Owner Papi Farm"}
--    Azizf400@gmail.com            -> {"role":"MANAGER","display_name":"Manager Aziz"}
--    Financeptdan@gmail.com        -> {"role":"ACCOUNTANT","display_name":"Keuangan"}
--    Istriistrisholehah@gmail.com  -> {"role":"MITRA","display_name":"Mitra"}
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 2) ALTERNATIF via SQL: set role langsung di raw_user_meta_data setelah
--    user dibuat (pakai service-role context di SQL Editor, sudah otomatis).
--    Jalankan per baris UPDATE di bawah setelah user exist.
-- ---------------------------------------------------------------------------

-- update auth.users set raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data,'{}'::jsonb), '{role}', '"OWNER"') where email = 'Ptdanpusat@gmail.com';
-- update auth.users set raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data,'{}'::jsonb), '{role}', '"OWNER"') where email = 'Papifarmriau@gmail.com';
-- update auth.users set raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data,'{}'::jsonb), '{role}', '"MANAGER"') where email = 'Azizf400@gmail.com';
-- update auth.users set raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data,'{}'::jsonb), '{role}', '"ACCOUNTANT"') where email = 'Financeptdan@gmail.com';
-- update auth.users set raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data,'{}'::jsonb), '{role}', '"MITRA"') where email = 'Istriistrisholehah@gmail.com';

-- ---------------------------------------------------------------------------
-- 3) Tabel profiles (opsional, untuk Tahap 2b data terpusat nanti).
--    Belum wajib untuk Tahap 2 (auth + RBAC dari metadata).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'MITRA'
    check (role in ('OWNER','MANAGER','ACCOUNTANT','MITRA','ADMIN','USER','DEVELOPER')),
  location_ids text[] not null default '{}',
  status text not null default 'Aktif',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles viewable by owner"
  on public.profiles for select using (auth.uid() = id);
