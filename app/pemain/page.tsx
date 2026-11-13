import { CalendarClock, Clock, MapPin } from "lucide-react";
import { Panel, EmptyState } from "@/components/ui/Panel";
import { PeriodTabs } from "@/components/ui/PeriodTabs";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { PlayerOverview } from "@/components/player/PlayerOverview";
import { requireActivePlayer } from "@/lib/auth/roles";
import { eligiblePlayers, getAgeGroups, getMemberships, getPeriod, getSessions } from "@/lib/data";
import { addDays, dayName, fmtDate, fmtTimeRange, todayISO } from "@/lib/format";

export const metadata = { title: "Beranda" };

export default async function PlayerHome({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  const sp = await searchParams;
  const player = await requireActivePlayer();
  const period = await getPeriod(sp.periode, "musim");
  const today = todayISO();
  const [sessions, groups, memberships] = await Promise.all([getSessions(today, addDays(today, 14)), getAgeGroups(), getMemberships({ playerId: player.id })]);
  const myCoaches = new Set(memberships.filter((m) => !m.excluded).map((m) => m.coach_id));
  const mine = sessions.filter((s) => s.status === "terjadwal" && s.coach_id && myCoaches.has(s.coach_id) && eligiblePlayers([player], s, null).length > 0).slice(0, 3);
  const group = groups.find((g) => g.id === player.age_group_id);
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", hour12: false }).format(new Date()));
  const greet = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 18 ? "Selamat sore" : "Selamat malam";

  return (
    <>
      <section className="relative mb-4 overflow-hidden rounded-[14px] bg-nav p-5 text-white md:p-6">
        <img src="/brand/logo-256.png" alt="" className="pointer-events-none absolute -right-6 -bottom-8 h-40 w-auto opacity-15 md:h-52" />
        <p className="text-sm text-nav-ink">{greet},</p>
        <h1 className="text-[24px] leading-8 font-bold tracking-tight md:text-[28px]">{player.full_name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-nav-ink">{player.team} · {group?.name ?? "—"} · {player.position}{player.jersey_no ? ` · #${player.jersey_no}` : ""}</p>
      </section>

      <InstallPrompt className="mb-4" />

      <Panel className="mb-4" icon={CalendarClock} title="Jadwal latihanmu" subtitle="2 minggu ke depan">
        {mine.length ? (
          <ul className="grid gap-3 md:grid-cols-3">
            {mine.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-[10px] bg-tint-blue p-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[8px] bg-panel text-center text-[11px] leading-tight font-semibold text-accent">
                  {dayName(s.session_date).slice(0, 3)}<br /><span className="num text-base">{s.session_date.slice(8)}</span>
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{s.kind}</p>
                  <p className="caption num flex items-center gap-1"><Clock size={12} />{fmtTimeRange(s.start_time, s.end_time)} WIB</p>
                  <p className="caption flex items-center gap-1"><MapPin size={12} />{s.location}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : player.status === "cuti" ? <EmptyState title="Sedang cuti">Jadwal latihan muncul lagi setelah coach mengakhiri cutimu.</EmptyState> : <EmptyState title="Belum ada jadwal baru">Coach belum menambahkan jadwal 2 minggu ke depan.</EmptyState>}
        {mine[0] && <p className="caption mt-3">Sesi terdekat: {dayName(mine[0].session_date)}, {fmtDate(mine[0].session_date)}. Datang 15 menit lebih awal untuk pemanasan.</p>}
      </Panel>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="h2">Perkembanganku</h2>
        <PeriodTabs current={period.key} basePath="/pemain" />
      </div>
      <PlayerOverview playerId={player.id} from={period.from} to={period.to} periodLabel={period.label} self show={["summary", "pattern", "charts"]} />
    </>
  );
}
