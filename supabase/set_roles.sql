-- ============================================================================
-- DUTA AGRI NUSANTARA — Set role & display name untuk 5 user (jalankan di SQL Editor)
-- Setelah user exist di auth.users (email HARUS persis sama, tanpa typo).
-- ============================================================================

update auth.users
set raw_user_meta_data = jsonb_build_object(
      'role', 'OWNER',
      'display_name', 'Owner Pimpinan'
    )
where email = 'ptdanpusat@gmail.com';

update auth.users
set raw_user_meta_data = jsonb_build_object(
      'role', 'OWNER',
      'display_name', 'Owner Papi Farm'
    )
where email = 'papifarmriau@gmail.com';

update auth.users
set raw_user_meta_data = jsonb_build_object(
      'role', 'MANAGER',
      'display_name', 'Manager Aziz'
    )
where email = 'azizf400@gmail.com';

update auth.users
set raw_user_meta_data = jsonb_build_object(
      'role', 'ACCOUNTANT',
      'display_name', 'Keuangan'
    )
where email = 'financeptdan@gmail.com';

update auth.users
set raw_user_meta_data = jsonb_build_object(
      'role', 'MITRA',
      'display_name', 'Mitra'
    )
where email = 'istriistrisholehah@gmail.com';

-- Verifikasi: semua user harus muncul dengan role-nya.
select email, raw_user_meta_data ->> 'role' as role, raw_user_meta_data ->> 'display_name' as display_name
from auth.users
order by email;
