-- ============================================================================
-- DUTA AGRI NUSANTARA — Set role & display name untuk 5 user
-- Role disimpan di raw_APP_meta_data (server-only, tidak bisa diubah client).
-- Aplikasi membaca role dari app_metadata (lihat services/supabase.ts).
-- Jalankan di Supabase SQL Editor atau `supabase db query --linked`.
-- ============================================================================

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"OWNER"}'::jsonb,
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"display_name":"Owner Pimpinan"}'::jsonb
where email = 'ptdanpusat@gmail.com';

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"OWNER"}'::jsonb,
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"display_name":"Owner Papi Farm"}'::jsonb
where email = 'papifarmriau@gmail.com';

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"MANAGER"}'::jsonb,
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"display_name":"Manager Aziz"}'::jsonb
where email = 'azizf400@gmail.com';

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"ACCOUNTANT"}'::jsonb,
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"display_name":"Keuangan"}'::jsonb
where email = 'financeptdan@gmail.com';

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"MITRA"}'::jsonb,
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"display_name":"Mitra"}'::jsonb
where email = 'istriistrisholehah@gmail.com';

-- Verifikasi: semua user harus muncul dengan role-nya.
select email, raw_app_meta_data ->> 'role' as role, raw_user_meta_data ->> 'display_name' as display_name
from auth.users
order by email;
