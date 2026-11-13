-- 004: status "cuti" untuk pemain (non-aktif sementara, diatur coach & admin)

alter table public.players drop constraint if exists players_status_check;
alter table public.players add constraint players_status_check
  check (status in ('pending','aktif','cuti','ditolak','arsip'));

alter table public.players
  add column if not exists leave_reason text,
  add column if not exists leave_since date,
  add column if not exists leave_until date,
  add column if not exists leave_by text;

-- Data cuti hanya bermakna saat status = 'cuti'. Dijaga di DB agar semua jalur
-- (aktifkan, arsipkan, ubah data) konsisten tanpa harus diingat di tiap action.
create or replace function public.players_leave_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'cuti' then
    new.leave_since := coalesce(new.leave_since, (now() at time zone 'Asia/Jakarta')::date);
    if new.leave_until is not null and new.leave_until < new.leave_since then
      raise exception 'leave_until sebelum leave_since';
    end if;
  else
    new.leave_reason := null; new.leave_since := null; new.leave_until := null; new.leave_by := null;
  end if;
  return new;
end $$;
drop trigger if exists players_leave_guard on public.players;
create trigger players_leave_guard before insert or update on public.players
  for each row execute function public.players_leave_guard();
revoke all on function public.players_leave_guard() from public, anon, authenticated;

-- Pemain cuti TETAP anggota skuad coach-nya, supaya coach bisa melihat dan
-- mengakhiri cutinya. Ia tidak ikut absensi/peringkat karena filter status 'aktif'.
create or replace function public.sync_coach_players(p_coach uuid default null, p_player uuid default null)
returns void language plpgsql set search_path = public as $$
begin
  delete from coach_players cp
  using coaches c, players p
  where cp.coach_id = c.id and cp.player_id = p.id
    and cp.source = 'aturan' and not cp.excluded
    and (p_coach is null or c.id = p_coach) and (p_player is null or p.id = p_player)
    and not (c.status = 'aktif' and p.status in ('aktif','cuti')
             and p.age_group_id = any(c.age_group_ids)
             and (c.focus = 'semua' or p.position = 'GK'));
  insert into coach_players(coach_id, player_id, source)
  select c.id, p.id, 'aturan'
  from coaches c join players p
    on p.age_group_id = any(c.age_group_ids) and (c.focus = 'semua' or p.position = 'GK')
  where c.status = 'aktif' and p.status in ('aktif','cuti')
    and (p_coach is null or c.id = p_coach) and (p_player is null or p.id = p_player)
  on conflict (coach_id, player_id) do nothing;
end $$;
revoke all on function public.sync_coach_players(uuid, uuid) from public, anon, authenticated;

-- player_stats: p_all_status = true menyertakan pemain non-aktif (cuti/arsip)
-- untuk laporan historis & halaman pemain itu sendiri. Default tetap hanya 'aktif'.
drop function if exists public.player_stats(date, date, numeric, numeric, uuid[]);
create function public.player_stats(p_from date, p_to date, w_att numeric default 0.4, w_perf numeric default 0.6,
  p_player_ids uuid[] default null, p_all_status boolean default false)
returns table(player_id uuid, sessions_total integer, hadir integer, izin integer, sakit integer, alpa integer,
  attendance_pct numeric, attendance_score numeric, perf_avg numeric, fisik numeric, teknik numeric, taktik numeric,
  n_assess integer, perf_first numeric, perf_last numeric, total_score numeric)
language sql stable set search_path = public as $$
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
  where (pl.status = 'aktif' or (p_all_status and pl.status in ('cuti','arsip')))
    and (p_player_ids is null or pl.id = any(p_player_ids));
$$;
revoke all on function public.player_stats(date, date, numeric, numeric, uuid[], boolean) from public, anon, authenticated;
