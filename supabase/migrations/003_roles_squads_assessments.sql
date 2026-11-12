-- Revisi 2: admin + coach (Google) + pemain, skuad per coach, musim, penilaian 1–10
-- Semua data sebelumnya adalah data demo → dikosongkan lalu di-seed ulang.

truncate attendance_audit, attendance, performance_reviews, training_sessions, players restart identity cascade;
drop function if exists public.perf_weekly(date, date, uuid);
drop function if exists public.player_stats(date, date, numeric, numeric);
drop function if exists public.attendance_by_session(date, date);
drop table if exists public.performance_reviews;

-- ===== Admin (username + password) =====
create table public.admins (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  full_name text not null,
  created_at timestamptz not null default now()
);
insert into public.admins(username, password_hash, full_name)
values ('admin', crypt('sinergiacademy', gen_salt('bf', 10)), 'Admin UNESA FC');

-- ===== Coach: sekarang akun Google (Clerk), divalidasi admin =====
delete from public.coaches;
alter table public.coaches drop column username, drop column password_hash;
alter table public.coaches
  add column clerk_user_id text unique,
  add column email text,
  add column phone text,
  add column status text not null default 'pending' check (status in ('pending','aktif','ditolak','nonaktif')),
  add column reject_reason text,
  add column age_group_ids smallint[] not null default '{}',
  add column focus text not null default 'semua' check (focus in ('semua','kiper')),
  add column is_demo boolean not null default false,
  add column updated_at timestamptz not null default now();

-- ===== Pemain: status ditolak + alasan =====
alter table public.players drop constraint players_status_check;
alter table public.players add constraint players_status_check check (status in ('pending','aktif','ditolak','arsip'));
alter table public.players add column reject_reason text;

-- 1 akun Google = 1 peran
create or replace function public.enforce_single_role() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.clerk_user_id is null then return new; end if;
  if tg_table_name = 'players' and exists (select 1 from coaches where clerk_user_id = new.clerk_user_id) then
    raise exception 'AKUN_SUDAH_COACH';
  elsif tg_table_name = 'coaches' and exists (select 1 from players where clerk_user_id = new.clerk_user_id) then
    raise exception 'AKUN_SUDAH_PEMAIN';
  end if;
  return new;
end $$;
create trigger players_single_role before insert or update of clerk_user_id on public.players
  for each row execute function public.enforce_single_role();
create trigger coaches_single_role before insert or update of clerk_user_id on public.coaches
  for each row execute function public.enforce_single_role();

-- ===== Kelompok usia: pita 2 tahun =====
delete from public.age_groups;
insert into public.age_groups(name, min_age, max_age) values
  ('KU-9', 0, 9), ('KU-11', 10, 11), ('KU-13', 12, 13), ('KU-15', 14, 15), ('KU-17', 16, 99);

-- ===== Skuad: anggota coach (aturan + manual) =====
create table public.coach_players (
  coach_id uuid not null references public.coaches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  source text not null default 'aturan' check (source in ('aturan','manual')),
  excluded boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (coach_id, player_id)
);
create index coach_players_player_idx on public.coach_players(player_id);

create or replace function public.sync_coach_players(p_coach uuid default null, p_player uuid default null)
returns void language plpgsql set search_path = public as $$
begin
  -- hapus baris aturan yang tidak lagi cocok (manual & excluded dibiarkan)
  delete from coach_players cp
  using coaches c, players p
  where cp.coach_id = c.id and cp.player_id = p.id
    and cp.source = 'aturan' and not cp.excluded
    and (p_coach is null or c.id = p_coach) and (p_player is null or p.id = p_player)
    and not (c.status = 'aktif' and p.status = 'aktif'
             and p.age_group_id = any(c.age_group_ids)
             and (c.focus = 'semua' or p.position = 'GK'));
  -- tambah yang cocok
  insert into coach_players(coach_id, player_id, source)
  select c.id, p.id, 'aturan'
  from coaches c join players p
    on p.age_group_id = any(c.age_group_ids) and (c.focus = 'semua' or p.position = 'GK')
  where c.status = 'aktif' and p.status = 'aktif'
    and (p_coach is null or c.id = p_coach) and (p_player is null or p.id = p_player)
  on conflict (coach_id, player_id) do nothing;
end $$;

-- ===== Musim (diatur admin) =====
create table public.seasons (
  id smallint generated always as identity primary key,
  name text not null,
  start_date date not null,
  end_date date not null check (end_date > start_date),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index seasons_one_active on public.seasons(is_active) where is_active;
insert into public.seasons(name, start_date, end_date, is_active) values ('Musim 2026/2027', '2026-07-01', '2027-06-30', true);

-- ===== Sesi: khusus kiper =====
alter table public.training_sessions add column gk_only boolean not null default false;
create index sessions_coach_idx on public.training_sessions(coach_id, session_date);

-- ===== Penilaian 1–10 =====
create table public.assessment_items (
  id smallint generated always as identity primary key,
  category text not null check (category in ('fisik','teknik','taktik')),
  name text not null,
  test_hint text,
  applies_to text not null default 'semua' check (applies_to in ('semua','lapangan','kiper')),
  sort int not null default 0,
  active boolean not null default true
);
insert into public.assessment_items(category, name, test_hint, applies_to, sort) values
  ('fisik','Kecepatan','Sprint 20 meter','semua',1),
  ('fisik','Daya tahan','Lari bolak-balik (bleep test)','semua',2),
  ('fisik','Kelincahan','Lari zig-zag antar kerucut','semua',3),
  ('fisik','Kekuatan & loncatan','Loncat tegak / vertical jump','semua',4),
  ('fisik','Kelentukan','Sit and reach','semua',5),
  ('teknik','Passing','Umpan pendek & panjang ke sasaran','lapangan',1),
  ('teknik','Kontrol bola','Menerima & menghentikan bola','lapangan',2),
  ('teknik','Dribel','Menggiring melewati kerucut','lapangan',3),
  ('teknik','Menembak','Tembakan ke gawang dari kotak penalti','lapangan',4),
  ('teknik','Sundulan','Menyundul ke arah sasaran','lapangan',5),
  ('teknik','Menangkap bola','Tangkapan bola atas & bawah','kiper',1),
  ('teknik','Diving','Menjatuhkan badan ke kiri & kanan','kiper',2),
  ('teknik','Refleks','Reaksi tembakan jarak dekat','kiper',3),
  ('teknik','Distribusi','Lemparan & tendangan gawang','kiper',4),
  ('teknik','Footwork','Langkah kaki & posisi siap','kiper',5),
  ('taktik','Penempatan posisi','Posisi saat menyerang & bertahan','lapangan',1),
  ('taktik','Membaca permainan','Antisipasi arah bola & lawan','lapangan',2),
  ('taktik','Transisi','Cepat berubah menyerang ⇄ bertahan','lapangan',3),
  ('taktik','Kerja sama tim','Kombinasi & komunikasi dengan rekan','lapangan',4),
  ('taktik','Pengambilan keputusan','Memilih umpan, giring, atau tembak','lapangan',5),
  ('taktik','Positioning','Sudut berdiri terhadap bola','kiper',1),
  ('taktik','Komunikasi lini belakang','Mengatur & memberi aba-aba','kiper',2),
  ('taktik','Antisipasi umpan silang','Keluar menangkap/menghalau crossing','kiper',3),
  ('taktik','Duel 1 lawan 1','Menutup ruang penyerang','kiper',4),
  ('taktik','Keputusan keluar gawang','Kapan maju dan kapan bertahan','kiper',5);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  coach_id uuid references public.coaches(id) on delete set null,
  session_id uuid references public.training_sessions(id) on delete set null,
  assessed_on date not null default current_date,
  fisik numeric(3,1) not null,
  teknik numeric(3,1) not null,
  taktik numeric(3,1) not null,
  overall numeric(3,1) not null,
  notes text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index assessments_player_idx on public.assessments(player_id, assessed_on);

create table public.assessment_scores (
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  item_id smallint not null references public.assessment_items(id) on delete restrict,
  score smallint not null check (score between 1 and 10),
  primary key (assessment_id, item_id)
);

-- ===== Log aktivitas (verifikasi, skuad, penilaian, dll.) =====
create table public.activity_log (
  id bigint generated always as identity primary key,
  actor_role text not null,
  actor_name text not null,
  action text not null,
  entity text not null,
  entity_id text,
  player_id uuid,
  coach_id uuid,
  detail text,
  at timestamptz not null default now()
);
create index activity_log_at_idx on public.activity_log(at desc);

-- ===== Agregat =====
create or replace function public.player_stats(
  p_from date, p_to date, w_att numeric default 0.4, w_perf numeric default 0.6, p_player_ids uuid[] default null
) returns table (
  player_id uuid, sessions_total int, hadir int, izin int, sakit int, alpa int,
  attendance_pct numeric, attendance_score numeric, perf_avg numeric, fisik numeric, teknik numeric, taktik numeric,
  n_assess int, perf_first numeric, perf_last numeric, total_score numeric
) language sql stable set search_path = public as $$
  with a as (
    select at.player_id,
      count(*)::int total,
      count(*) filter (where at.status='hadir')::int h,
      count(*) filter (where at.status='izin')::int i,
      count(*) filter (where at.status='sakit')::int s,
      count(*) filter (where at.status='alpa')::int al
    from attendance at join training_sessions ts on ts.id = at.session_id
    where ts.session_date between p_from and p_to and ts.status <> 'batal'
      and (p_player_ids is null or at.player_id = any(p_player_ids))
    group by at.player_id
  ), p as (
    select x.player_id, avg(x.overall) pa, avg(x.fisik) f, avg(x.teknik) t, avg(x.taktik) tk, count(*)::int n,
      (array_agg(x.overall order by x.assessed_on, x.created_at))[1] first_v,
      (array_agg(x.overall order by x.assessed_on desc, x.created_at desc))[1] last_v
    from assessments x
    where x.assessed_on between p_from and p_to and (p_player_ids is null or x.player_id = any(p_player_ids))
    group by x.player_id
  )
  select pl.id,
    coalesce(a.total,0), coalesce(a.h,0), coalesce(a.i,0), coalesce(a.s,0), coalesce(a.al,0),
    case when a.total > 0 then round(a.h * 100.0 / a.total, 1) end,
    case when a.total > 0 then round((a.h + 0.5 * (a.i + a.s)) * 100.0 / a.total, 1) end,
    round(p.pa, 2), round(p.f, 2), round(p.t, 2), round(p.tk, 2), coalesce(p.n, 0), p.first_v, p.last_v,
    round(case
      when a.total > 0 and p.pa is not null then w_att * ((a.h + 0.5*(a.i+a.s)) * 100.0 / a.total) + w_perf * p.pa * 10
      when a.total > 0 then (a.h + 0.5*(a.i+a.s)) * 100.0 / a.total
      else p.pa * 10 end, 1)
  from players pl
  left join a on a.player_id = pl.id
  left join p on p.player_id = pl.id
  where pl.status = 'aktif' and (p_player_ids is null or pl.id = any(p_player_ids));
$$;

create or replace function public.attendance_by_session(p_from date, p_to date, p_coach uuid default null)
returns table (session_id uuid, session_date date, kind text, start_time time, end_time time, status text,
  age_group_id smallint, gk_only boolean, coach_id uuid, hadir int, izin int, sakit int, alpa int, total int)
language sql stable set search_path = public as $$
  select s.id, s.session_date, s.kind, s.start_time, s.end_time, s.status, s.age_group_id, s.gk_only, s.coach_id,
    count(a.*) filter (where a.status='hadir')::int,
    count(a.*) filter (where a.status='izin')::int,
    count(a.*) filter (where a.status='sakit')::int,
    count(a.*) filter (where a.status='alpa')::int,
    count(a.*)::int
  from training_sessions s left join attendance a on a.session_id = s.id
  where s.session_date between p_from and p_to and (p_coach is null or s.coach_id = p_coach)
  group by s.id order by s.session_date, s.start_time;
$$;

-- Tren penilaian per bulan (rata-rata kategori)
create or replace function public.assessment_monthly(p_from date, p_to date, p_player_ids uuid[] default null)
returns table (month date, fisik numeric, teknik numeric, taktik numeric, overall numeric, n int)
language sql stable set search_path = public as $$
  select date_trunc('month', assessed_on)::date,
    round(avg(fisik),2), round(avg(teknik),2), round(avg(taktik),2), round(avg(overall),2), count(*)::int
  from assessments
  where assessed_on between p_from and p_to and (p_player_ids is null or player_id = any(p_player_ids))
  group by 1 order by 1;
$$;

-- Rata-rata per item tes
create or replace function public.item_averages(p_from date, p_to date, p_player_ids uuid[] default null)
returns table (item_id smallint, avg_score numeric, n int)
language sql stable set search_path = public as $$
  select s.item_id, round(avg(s.score),2), count(*)::int
  from assessment_scores s join assessments a on a.id = s.assessment_id
  where a.assessed_on between p_from and p_to and (p_player_ids is null or a.player_id = any(p_player_ids))
  group by s.item_id;
$$;

-- ===== Keamanan =====
alter table public.admins enable row level security;
alter table public.coach_players enable row level security;
alter table public.seasons enable row level security;
alter table public.assessment_items enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_scores enable row level security;
alter table public.activity_log enable row level security;
revoke all on all tables in schema public from anon, authenticated;
revoke execute on function public.player_stats(date, date, numeric, numeric, uuid[]) from public, anon, authenticated;
revoke execute on function public.attendance_by_session(date, date, uuid) from public, anon, authenticated;
revoke execute on function public.assessment_monthly(date, date, uuid[]) from public, anon, authenticated;
revoke execute on function public.item_averages(date, date, uuid[]) from public, anon, authenticated;
revoke execute on function public.sync_coach_players(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.enforce_single_role() from public, anon, authenticated;
