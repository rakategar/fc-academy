import { CalendarDays, CalendarRange, Clock, MapPin, Timer, Users } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { KpiCard } from "@/components/ui/KpiCard";
import { Stagger, Item } from "@/components/motion/Reveal";
import { getAgeGroups, getPlayers, getSessionAgg, getSessions } from "@/lib/data";
import { requireStaff } from "@/lib/scope";
import { addDays, dayName, fmtDate, fmtMonthYear, todayISO } from "@/lib/format";
import { SessionManager, DAY_TONE, type SessionRow } from "./SessionManager";

export const metadata = { title: "Jadwal Latihan" };

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ lihat?: string }> }) {
  const { lihat } = await searchParams;
  const scope = lihat === "lalu" ? "lalu" : "mendatang";
  const today = todayISO();
  const monthStart = today.slice(0, 8) + "01";
  const sc = await requireStaff("coach");
  const [groupsAll, players, upcoming, past, month, full] = await Promise.all([
    getAgeGroups(),
    getPlayers({ status: "aktif", ids: sc.ids }),
    getSessionAgg(today, addDays(today, 120), sc.coachId),
    getSessionAgg(addDays(today, -120), addDays(today, -1), sc.coachId),
    getSessionAgg(monthStart, addDays(monthStart, 40), sc.coachId),
    getSessions(addDays(today, -120), addDays(today, 120), sc.coachId),
  ]);
  const groups = groupsAll.filter((g) => sc.coach!.age_group_ids.includes(g.id));
  const detail = new Map(full.map((s) => [s.id, s]));
  const gName = new Map(groupsAll.map((g) => [g.id, g.name]));
  const list = scope === "lalu" ? [...past].reverse() : upcoming;
  const rows: SessionRow[] = list.map((s) => ({
    id: s.session_id, date: s.session_date, dateLabel: fmtDate(s.session_date), day: dayName(s.session_date),
    start: s.start_time.slice(0, 5), end: s.end_time.slice(0, 5), kind: s.kind, focus: detail.get(s.session_id)?.focus ?? null,
    groupId: s.age_group_id, group: (s.age_group_id ? gName.get(s.age_group_id) ?? "—" : "Seluruh skuad") + (s.gk_only ? " · kiper" : ""),
    location: detail.get(s.session_id)?.location ?? "Lapangan UNESA", status: s.status, recorded: s.total,
  }));

  // Pola mingguan dari jadwal 4 minggu ke depan
  const nextWeeks = upcoming.filter((s) => s.session_date <= addDays(today, 28) && s.status !== "batal");
  const pattern = new Map<string, { day: string; kind: string; time: string; dow: number }>();
  for (const s of nextWeeks) {
    const day = dayName(s.session_date);
    if (!pattern.has(day)) pattern.set(day, { day, kind: s.kind, time: `${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)}`, dow: (new Date(s.session_date).getUTCDay() + 6) % 7 });
  }
  const weekly = [...pattern.values()].sort((a, b) => a.dow - b.dow);
  const monthSessions = month.filter((s) => s.session_date.slice(0, 7) === today.slice(0, 7) && s.status !== "batal");
  const avgDur = monthSessions.length ? Math.round(monthSessions.reduce((t, s) => t + toMin(s.end_time) - toMin(s.start_time), 0) / monthSessions.length) : null;

  return (
    <>
      <PageHeader icon={CalendarDays} title="Jadwal latihan" subtitle={`Sesi latihan milikmu · ${fmtMonthYear(today)} dan seterusnya.${sc.coach!.focus === "kiper" ? " Sesi coach kiper otomatis khusus kiper." : ""}`} />
      <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Item><KpiCard icon={Users} tone="blue" value={players.length} label="Pemain di skuad" /></Item>
        <Item><KpiCard icon={CalendarRange} tone="green" value={weekly.length} label="Hari latihan / minggu" /></Item>
        <Item><KpiCard icon={CalendarDays} tone="purple" value={monthSessions.length} label="Sesi bulan ini" /></Item>
        <Item><KpiCard icon={Timer} tone="orange" value={avgDur} label="Menit / sesi" caption="Rata-rata bulan ini" /></Item>
        <Item className="col-span-2 lg:col-span-1"><KpiCard icon={MapPin} tone="sky" value={1} label="Lapangan utama" caption="Lapangan UNESA" /></Item>
      </Stagger>

      {weekly.length > 0 && (
        <Panel className="mt-4" icon={CalendarRange} title="Ringkasan jadwal mingguan">
          <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {weekly.map((w) => (
              <Item key={w.day}>
                <div className={`rounded-[10px] p-4 ${DAY_TONE[w.day]?.split(" ")[0] ?? "bg-sunken"}`}>
                  <p className={`text-lg font-bold ${DAY_TONE[w.day]?.split(" ")[1] ?? ""}`}>{w.day}</p>
                  <p className="mt-2 text-sm font-medium text-ink">{w.kind}</p>
                  <p className="num mt-1 flex items-center gap-1.5 text-sm text-ink-muted"><Clock size={14} /> {w.time} WIB</p>
                </div>
              </Item>
            ))}
          </Stagger>
        </Panel>
      )}

      <Panel className="mt-4" title="Detail jadwal latihan" subtitle={scope === "lalu" ? "120 hari terakhir, terbaru di atas" : `Mulai ${fmtDate(today)}`} bodyClassName="p-0 md:p-0">
        <SessionManager rows={rows} groups={groups} today={today} scope={scope} />
      </Panel>
    </>
  );
}
