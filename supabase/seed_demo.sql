-- Data demo UNESA FC ACADEMY (hapus dengan supabase/clear_demo.sql)
select setseed(0.42);

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
 (37,'Tegar Saputra','FW'),(38,'Yoga Prakoso','DF'),(39,'Malik Ibrahim','MF'),(40,'Arya Dwi Putra','FW')
), born as (
  select n, full_name, pos,
    (date '2026-11-10' - make_interval(years => 9 + (n % 8)) - make_interval(days => (n * 37) % 330))::date bd
  from names
)
insert into players(full_name, birth_date, position, age_group_id, jersey_no, phone, status, is_demo, created_at)
select b.full_name, b.bd, b.pos,
  (select id from age_groups g where extract(year from age(date '2026-11-10', b.bd)) between g.min_age and g.max_age),
  b.n + 1, '08' || (1200000000 + b.n * 7919)::text, 'aktif', true, timestamptz '2026-08-20' + make_interval(days => b.n % 10)
from born b;

-- 2 pendaftar menunggu verifikasi
insert into players(full_name, birth_date, position, age_group_id, phone, status, is_demo, email) values
 ('Nabil Akhtar', '2013-04-12', 'MF', (select id from age_groups where name='KU-14'), '081377712001', 'pending', true, 'nabil.demo@example.com'),
 ('Kenzo Aditya', '2015-09-03', 'FW', (select id from age_groups where name='KU-12'), '081377712002', 'pending', true, 'kenzo.demo@example.com');

-- Sesi: Selasa & Jumat 15.30–17.00, Sabtu 07.00–08.30, Minggu 07.00–09.00
insert into training_sessions(session_date, start_time, end_time, kind, focus, location, coach_id, status, is_demo)
select d::date,
  case extract(isodow from d) when 2 then time '15:30' when 5 then time '15:30' when 6 then time '07:00' else time '07:00' end,
  case extract(isodow from d) when 2 then time '17:00' when 5 then time '17:00' when 6 then time '08:30' else time '09:00' end,
  case extract(isodow from d) when 2 then 'Latihan Rutin' when 5 then 'Latihan Rutin' when 6 then 'Latihan Teknik' else 'Game Internal' end,
  case extract(isodow from d) when 2 then 'Fisik, teknik, taktik' when 5 then 'Fisik, teknik, taktik' when 6 then 'Penguasaan bola, transisi' else 'Evaluasi & taktik' end,
  'Lapangan UNESA', (select id from coaches where username='coach'),
  case when d::date < date '2026-11-10' then 'selesai' else 'terjadwal' end, true
from generate_series(date '2026-09-08', date '2026-11-23', interval '1 day') d
where extract(isodow from d) in (2,5,6,7);

-- Absensi untuk sesi yang sudah selesai; tiap pemain punya tingkat kerajinan berbeda
with p as (
  select id, 0.62 + (abs(hashtext(id::text)) % 36) / 100.0 as rel from players where is_demo and status='aktif'
)
insert into attendance(session_id, player_id, status, recorded_by, created_at)
select s.id, p.id,
  case
    when r < p.rel + (s.session_date - date '2026-09-08') * 0.0012 then 'hadir'
    when r < p.rel + 0.10 then 'izin'
    when r < p.rel + 0.17 then 'sakit'
    else 'alpa' end,
  'seed', s.session_date + time '18:00'
from training_sessions s cross join p cross join lateral (select random() r) x
where s.status='selesai' and s.is_demo;

-- Penilaian performa tiap Sabtu, cenderung naik seiring waktu & kehadiran
with p as (
  select pl.id, 58 + (abs(hashtext(pl.id::text)) % 22) base,
    coalesce((select count(*) filter (where a.status='hadir')::numeric / nullif(count(*),0) from attendance a where a.player_id=pl.id), 0.7) att
  from players pl where pl.is_demo and pl.status='aktif'
), s as (
  select id, session_date, row_number() over (order by session_date) k
  from training_sessions where is_demo and status='selesai' and extract(isodow from session_date)=6
)
insert into performance_reviews(player_id, session_id, review_date, coach_id, teknik, fisik, taktik, mental, disiplin, notes)
select p.id, s.id, s.session_date, (select id from coaches where username='coach'),
  least(100, greatest(30, round(p.base + s.k * (0.4 + p.att * 1.1) + random()*8 - 4)))::int,
  least(100, greatest(30, round(p.base + 3 + s.k * (0.3 + p.att) + random()*8 - 4)))::int,
  least(100, greatest(30, round(p.base - 4 + s.k * (0.5 + p.att * 1.2) + random()*8 - 4)))::int,
  least(100, greatest(30, round(p.base + 2 + s.k * 0.6 + random()*10 - 5)))::int,
  least(100, greatest(30, round(55 + p.att * 40 + random()*6 - 3)))::int,
  case when random() < 0.25 then (array['Kontrol bola makin rapi.','Perlu tingkatkan stamina babak kedua.','Komunikasi dengan lini belakang bagus.','Disiplin posisi membaik.','Finishing perlu diasah lagi.'])[1 + floor(random()*5)::int] end
from p cross join s;

-- Beberapa riwayat perubahan absensi untuk contoh "Jejak perubahan"
update attendance set status='izin', recorded_by='coach', note='Surat izin menyusul'
where id in (select a.id from attendance a join training_sessions s on s.id=a.session_id
             where a.status='alpa' order by s.session_date desc limit 4);
