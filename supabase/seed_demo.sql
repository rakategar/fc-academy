-- Data demo UNESA FC ACADEMY (hapus dengan supabase/clear_demo.sql)
-- Asumsi "hari ini" = 2026-11-12. Butuh migrasi 003.
select setseed(0.42);

-- ===== Coach demo (tanpa akun Google) =====
insert into coaches(full_name, email, phone, status, age_group_ids, focus, is_demo) values
 ('Coach Hendra Wijaya',  'hendra.demo@example.com', '081311110001', 'aktif', array[(select id from age_groups where name='KU-9')],  'semua', true),
 ('Coach Agus Salim',     'agus.demo@example.com',   '081311110002', 'aktif', array[(select id from age_groups where name='KU-11')], 'semua', true),
 ('Coach Dedi Kurniawan', 'dedi.demo@example.com',   '081311110003', 'aktif', array[(select id from age_groups where name='KU-13')], 'semua', true),
 ('Coach Rudi Hartono',   'rudi.demo@example.com',   '081311110004', 'aktif', array[(select id from age_groups where name='KU-15')], 'semua', true),
 ('Coach Bambang Susilo', 'bambang.demo@example.com','081311110005', 'aktif', array[(select id from age_groups where name='KU-17')], 'semua', true),
 ('Coach Yoyok Prasetyo', 'yoyok.demo@example.com',  '081311110006', 'aktif', (select array_agg(id order by id) from age_groups), 'kiper', true),
 ('Coach Sinta Lestari',  'sinta.demo@example.com',  '081311110007', 'pending', array[(select id from age_groups where name='KU-11')], 'semua', true);

-- ===== Pemain =====
with names(n, full_name, pos) as (values
 (1,'Rafa Ardiansyah','FW'),(2,'Dimas Pratama','MF'),(3,'Alif Rahman','DF'),(4,'Bima Saputra','GK'),
 (5,'Andra Maulana','MF'),(6,'Fajar Nugroho','DF'),(7,'Rizky Hidayat','FW'),(8,'Galih Permana','MF'),
 (9,'Yusuf Kurniawan','DF'),(10,'Arkan Wibowo','GK'),(11,'Naufal Ramadhan','FW'),(12,'Farel Setiawan','MF'),
 (13,'Haikal Firmansyah','DF'),(14,'Zidan Akbar','FW'),(15,'Kevin Santoso','MF'),(16,'Daffa Prasetyo','DF'),
 (17,'Raihan Syahputra','MF'),(18,'Aditya Wijaya','FW'),(19,'Ilham Fauzi','DF'),(20,'Satria Gunawan','GK'),
 (21,'Bagas Aditama','MF'),(22,'Rendra Kusuma','DF'),(23,'Fikri Hakim','FW'),(24,'Gilang Ramadhani','MF'),
 (25,'Ammar Fadillah','DF'),(26,'Reza Mahendra','FW'),(27,'Hafiz Alfarizi','MF'),(28,'Danu Saputro','DF'),
 (29,'Rangga Putra','GK'),(30,'Fadli Anwar','MF'),(31,'Ihsan Maulidi','FW'),(32,'Wahyu Nugraha','DF'),
 (33,'Bintang Pamungkas','MF'),(34,'Ardi Kurnia','FW'),(35,'Azka Rabbani','DF'),(36,'Rifqi Hamdani','MF'),
 (37,'Tegar Saputra','FW'),(38,'Yoga Prakoso','DF'),(39,'Malik Ibrahim','MF'),(40,'Arya Dwi Putra','FW'),
 (41,'Kenzie Alvaro','MF'),(42,'Rayyan Hakim','DF'),(43,'Elang Samudra','GK'),(44,'Hanif Maulana','FW'),
 (45,'Damar Wicaksono','MF'),(46,'Juna Pradipta','DF'),(47,'Abim Sanjaya','FW'),(48,'Gibran Saputra','MF'),
 (49,'Nathan Pratama','DF'),(50,'Fathan Ali','FW'),(51,'Rasya Ramadhan','MF'),(52,'Zaki Mubarak','DF'),
 (53,'Dafa Aulia','FW'),(54,'Iqbal Fahreza','MF'),(55,'Bryan Hutapea','DF'),(56,'Ghani Nugraha','GK'),
 (57,'Akmal Fauzan','MF'),(58,'Raka Aditya','FW'),(59,'Reyhan Saputra','DF'),(60,'Faiz Ramadhan','MF')
), born as (
  -- umur 8..17 tersebar rata (6 pemain per umur)
  select n, full_name, pos,
    (date '2026-11-12' - make_interval(years => 8 + ((n - 1) % 10)) - make_interval(days => (n * 37) % 330))::date bd
  from names
)
insert into players(full_name, birth_date, position, age_group_id, jersey_no, phone, status, is_demo, created_at)
select b.full_name, b.bd, b.pos,
  (select id from age_groups g where extract(year from age(date '2026-11-12', b.bd)) between g.min_age and g.max_age),
  b.n + 1, '08' || (1200000000 + b.n * 7919)::text, 'aktif', true, timestamptz '2026-08-20' + make_interval(days => b.n % 10)
from born b;

-- 2 pendaftar pemain menunggu verifikasi
insert into players(full_name, birth_date, position, age_group_id, phone, status, is_demo, email) values
 ('Nabil Akhtar', '2013-04-12', 'MF', (select id from age_groups where name='KU-13'), '081377712001', 'pending', true, 'nabil.demo@example.com'),
 ('Kenzo Aditya', '2015-09-03', 'GK', (select id from age_groups where name='KU-11'), '081377712002', 'pending', true, 'kenzo.demo@example.com');

-- Skuad otomatis dari aturan
select sync_coach_players();

-- ===== Sesi =====
-- Coach kelompok usia: Selasa & Jumat 15.30–17.00, Sabtu 07.00–08.30
insert into training_sessions(session_date, start_time, end_time, kind, focus, age_group_id, location, coach_id, status, is_demo)
select d::date,
  case when extract(isodow from d) = 6 then time '07:00' else time '15:30' end,
  case when extract(isodow from d) = 6 then time '08:30' else time '17:00' end,
  case when extract(isodow from d) = 6 then 'Latihan Teknik' else 'Latihan Rutin' end,
  case when extract(isodow from d) = 6 then 'Penguasaan bola, transisi' else 'Fisik, teknik, taktik' end,
  c.age_group_ids[1], 'Lapangan UNESA', c.id,
  case when d::date < date '2026-11-12' then 'selesai' else 'terjadwal' end, true
from coaches c cross join generate_series(date '2026-09-08', date '2026-11-28', interval '1 day') d
where c.is_demo and c.status = 'aktif' and c.focus = 'semua' and extract(isodow from d) in (2,5,6);

-- Coach kiper: Rabu 15.30–17.00, semua kelompok, khusus kiper
insert into training_sessions(session_date, start_time, end_time, kind, focus, age_group_id, gk_only, location, coach_id, status, is_demo)
select d::date, time '15:30', time '17:00', 'Latihan Kiper', 'Refleks, diving, distribusi', null, true, 'Lapangan UNESA', c.id,
  case when d::date < date '2026-11-12' then 'selesai' else 'terjadwal' end, true
from coaches c cross join generate_series(date '2026-09-08', date '2026-11-28', interval '1 day') d
where c.is_demo and c.focus = 'kiper' and extract(isodow from d) = 3;

-- ===== Absensi (sesi selesai, peserta = skuad coach ∩ kelompok sesi) =====
insert into attendance(session_id, player_id, status, recorded_by, created_at)
select q.sid, q.pid,
  case
    when q.r < q.rel + (q.session_date - date '2026-09-08') * 0.0012 then 'hadir'
    when q.r < q.rel + 0.10 then 'izin'
    when q.r < q.rel + 0.17 then 'sakit'
    else 'alpa' end,
  'seed', q.session_date + time '18:00'
from (
  select s.id sid, p.id pid, s.session_date, 0.62 + (abs(hashtext(p.id::text)) % 36) / 100.0 as rel, random() r
  from training_sessions s
  join coach_players cp on cp.coach_id = s.coach_id and not cp.excluded
  join players p on p.id = cp.player_id and p.is_demo and p.status = 'aktif'
    and (s.age_group_id is null or p.age_group_id = s.age_group_id) and (not s.gk_only or p.position = 'GK')
  where s.status='selesai' and s.is_demo
) q;

-- ===== Penilaian 1–10, tiap 2 minggu (Sabtu), oleh coach kelompok; kiper oleh coach kiper =====
create temp table tmp_assess as
with pl as (
  select p.id, p.position,
    4.6 + (abs(hashtext(p.id::text)) % 25) / 10.0 as base,          -- 4,6 – 7,0
    0.05 + (abs(hashtext(p.id::text || 'g')) % 20) / 100.0 as growth, -- 0,05 – 0,24 per penilaian
    (select c.id from coach_players cp join coaches c on c.id = cp.coach_id
      where cp.player_id = p.id and not cp.excluded
      order by (c.focus = 'kiper') = (p.position = 'GK') desc, c.full_name limit 1) as coach_id
  from players p where p.is_demo and p.status='aktif'
), d as (
  select dd::date as day, row_number() over (order by dd) - 1 as k
  from generate_series(date '2026-09-12', date '2026-11-07', interval '14 days') dd
)
select gen_random_uuid() as id, pl.id as player_id, pl.coach_id, d.day, d.k, pl.base, pl.growth, pl.position
from pl cross join d;

insert into assessments(id, player_id, coach_id, assessed_on, fisik, teknik, taktik, overall, notes, is_demo, created_at)
select t.id, t.player_id, t.coach_id, t.day, 0, 0, 0, 0,
  case when random() < 0.35 then (array[
    'Kontrol bola makin rapi.','Perlu tingkatkan stamina babak kedua.','Komunikasi dengan rekan sudah bagus.',
    'Disiplin posisi membaik.','Finishing perlu diasah lagi.','Reaksi lebih cepat dari sebelumnya.'
  ])[1 + floor(random()*6)::int] end,
  true, t.day + time '09:00'
from tmp_assess t;

insert into assessment_scores(assessment_id, item_id, score)
select t.id, i.id,
  least(10, greatest(1, round(t.base + t.k * t.growth
    + case i.category when 'fisik' then 0.3 when 'teknik' then 0 else -0.4 end
    + (abs(hashtext(t.player_id::text || i.id::text)) % 15 - 7) / 10.0
    + random() * 1.2 - 0.6)))::int
from tmp_assess t
join assessment_items i on i.active and (i.applies_to = 'semua' or (i.applies_to = 'kiper') = (t.position = 'GK'));

update assessments a set
  fisik = x.f, teknik = x.t, taktik = x.tk, overall = round((x.f + x.t + x.tk) / 3, 1)
from (
  select s.assessment_id,
    round(avg(s.score) filter (where i.category='fisik'), 1) f,
    round(avg(s.score) filter (where i.category='teknik'), 1) t,
    round(avg(s.score) filter (where i.category='taktik'), 1) tk
  from assessment_scores s join assessment_items i on i.id = s.item_id group by s.assessment_id
) x where x.assessment_id = a.id and a.is_demo;

-- Contoh riwayat perubahan absensi untuk "Jejak perubahan"
update attendance set status='izin', recorded_by='Coach Agus Salim', note='Surat izin menyusul'
where id in (select a.id from attendance a join training_sessions s on s.id=a.session_id
             where a.status='alpa' order by s.session_date desc limit 4);
drop table if exists tmp_assess;
