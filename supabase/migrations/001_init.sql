-- UNESA FC ACADEMY — skema awal
create extension if not exists pgcrypto;

create table public.coaches (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  full_name text not null,
  created_at timestamptz not null default now()
);

create table public.age_groups (
  id smallint generated always as identity primary key,
  name text not null unique,
  min_age int not null,
  max_age int not null
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique,
  email text,
  full_name text not null,
  birth_date date not null,
  position text not null check (position in ('GK','DF','MF','FW')),
  team text not null default 'UNESA FC ACADEMY',
  age_group_id smallint references public.age_groups(id) on delete set null,
  jersey_no int,
  phone text,
  status text not null default 'pending' check (status in ('pending','aktif','arsip')),
  is_candidate boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index players_status_idx on public.players(status);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  session_date date not null,
  start_time time not null,
  end_time time not null,
  kind text not null,
  focus text,
  age_group_id smallint references public.age_groups(id) on delete set null,
  location text not null default 'Lapangan UNESA',
  coach_id uuid references public.coaches(id) on delete set null,
  status text not null default 'terjadwal' check (status in ('terjadwal','selesai','batal')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index sessions_date_idx on public.training_sessions(session_date);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null check (status in ('hadir','izin','sakit','alpa')),
  note text,
  recorded_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, player_id)
);
create index attendance_player_idx on public.attendance(player_id);

create table public.attendance_audit (
  id bigint generated always as identity primary key,
  attendance_id uuid,
  session_id uuid,
  player_id uuid,
  action text not null,
  old_status text,
  new_status text,
  changed_by text not null,
  changed_at timestamptz not null default now()
);
create index audit_changed_at_idx on public.attendance_audit(changed_at desc);

create table public.performance_reviews (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  session_id uuid references public.training_sessions(id) on delete set null,
  review_date date not null default current_date,
  coach_id uuid references public.coaches(id) on delete set null,
  teknik smallint not null check (teknik between 0 and 100),
  fisik smallint not null check (fisik between 0 and 100),
  taktik smallint not null check (taktik between 0 and 100),
  mental smallint not null check (mental between 0 and 100),
  disiplin smallint not null check (disiplin between 0 and 100),
  overall numeric(5,2) generated always as ((teknik + fisik + taktik + mental + disiplin) / 5.0) stored,
  notes text,
  created_at timestamptz not null default now()
);
create index perf_player_idx on public.performance_reviews(player_id, review_date);

-- Jejak perubahan absensi (seed memakai recorded_by = 'seed' agar tidak dicatat)
create or replace function public.log_attendance_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.recorded_by = 'seed' then return new; end if;
    insert into attendance_audit(attendance_id, session_id, player_id, action, new_status, changed_by)
    values (new.id, new.session_id, new.player_id, 'catat', new.status, new.recorded_by);
    return new;
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status or new.note is distinct from old.note then
      insert into attendance_audit(attendance_id, session_id, player_id, action, old_status, new_status, changed_by)
      values (new.id, new.session_id, new.player_id, 'ubah', old.status, new.status, new.recorded_by);
    end if;
    new.updated_at := now();
    return new;
  else
    insert into attendance_audit(attendance_id, session_id, player_id, action, old_status, changed_by)
    values (old.id, old.session_id, old.player_id, 'hapus', old.status, old.recorded_by);
    return old;
  end if;
end $$;

create trigger attendance_audit_ins after insert on public.attendance
  for each row execute function public.log_attendance_change();
create trigger attendance_audit_upd before update on public.attendance
  for each row execute function public.log_attendance_change();
create trigger attendance_audit_del after delete on public.attendance
  for each row execute function public.log_attendance_change();

-- Skor pemain per periode
create or replace function public.player_stats(
  p_from date, p_to date, w_att numeric default 0.4, w_perf numeric default 0.6
) returns table (
  player_id uuid, sessions_total int, hadir int, izin int, sakit int, alpa int,
  attendance_pct numeric, attendance_score numeric, perf_avg numeric, total_score numeric
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
    group by at.player_id
  ), p as (
    select pr.player_id, avg(pr.overall) pa from performance_reviews pr
    where pr.review_date between p_from and p_to group by pr.player_id
  )
  select pl.id,
    coalesce(a.total,0), coalesce(a.h,0), coalesce(a.i,0), coalesce(a.s,0), coalesce(a.al,0),
    case when a.total > 0 then round(a.h * 100.0 / a.total, 1) end,
    case when a.total > 0 then round((a.h + 0.5 * (a.i + a.s)) * 100.0 / a.total, 1) end,
    round(p.pa, 1),
    round(case
      when a.total > 0 and p.pa is not null then w_att * ((a.h + 0.5*(a.i+a.s)) * 100.0 / a.total) + w_perf * p.pa
      when a.total > 0 then (a.h + 0.5*(a.i+a.s)) * 100.0 / a.total
      else p.pa end, 1)
  from players pl
  left join a on a.player_id = pl.id
  left join p on p.player_id = pl.id
  where pl.status = 'aktif';
$$;

-- Keamanan: semua akses lewat server (service role). Anon/authenticated tidak punya akses.
alter table public.coaches enable row level security;
alter table public.age_groups enable row level security;
alter table public.players enable row level security;
alter table public.training_sessions enable row level security;
alter table public.attendance enable row level security;
alter table public.attendance_audit enable row level security;
alter table public.performance_reviews enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke execute on function public.player_stats(date, date, numeric, numeric) from public, anon, authenticated;
revoke execute on function public.log_attendance_change() from public, anon, authenticated;

insert into public.age_groups(name, min_age, max_age) values
  ('KU-10', 0, 10), ('KU-12', 11, 12), ('KU-14', 13, 14), ('KU-16', 15, 16), ('KU-18', 17, 99);

insert into public.coaches(username, password_hash, full_name)
values ('coach', crypt('sinergiacademy', gen_salt('bf', 10)), 'Coach UNESA FC');
