create or replace function public.attendance_by_session(p_from date, p_to date)
returns table (session_id uuid, session_date date, kind text, start_time time, end_time time, status text,
  age_group_id smallint, hadir int, izin int, sakit int, alpa int, total int)
language sql stable set search_path = public as $$
  select s.id, s.session_date, s.kind, s.start_time, s.end_time, s.status, s.age_group_id,
    count(a.*) filter (where a.status='hadir')::int,
    count(a.*) filter (where a.status='izin')::int,
    count(a.*) filter (where a.status='sakit')::int,
    count(a.*) filter (where a.status='alpa')::int,
    count(a.*)::int
  from training_sessions s left join attendance a on a.session_id = s.id
  where s.session_date between p_from and p_to
  group by s.id order by s.session_date, s.start_time;
$$;

create or replace function public.perf_weekly(p_from date, p_to date, p_player uuid default null)
returns table (week_start date, teknik numeric, fisik numeric, taktik numeric, mental numeric, disiplin numeric, overall numeric, n int)
language sql stable set search_path = public as $$
  select date_trunc('week', review_date)::date,
    round(avg(teknik),1), round(avg(fisik),1), round(avg(taktik),1), round(avg(mental),1), round(avg(disiplin),1),
    round(avg(overall),1), count(*)::int
  from performance_reviews
  where review_date between p_from and p_to and (p_player is null or player_id = p_player)
  group by 1 order by 1;
$$;

revoke execute on function public.attendance_by_session(date, date) from public, anon, authenticated;
revoke execute on function public.perf_weekly(date, date, uuid) from public, anon, authenticated;
