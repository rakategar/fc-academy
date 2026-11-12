import Link from "next/link";
import { CalendarPlus, ChevronRight, ClipboardCheck } from "lucide-react";
import { PageHeader, Panel, EmptyState } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { inputCls } from "@/components/ui/Field";
import { Stagger, Item, Bar } from "@/components/motion/Reveal";
import { eligiblePlayers, getAgeGroups, getPlayers, getSessionAgg } from "@/lib/data";
import { requireStaff } from "@/lib/scope";
import { addDays, dayName, fmtDate, fmtTimeRange, todayISO } from "@/lib/format";
import { SESSION_KINDS, type SessionAgg } from "@/lib/types";
import { quickSessionToday } from "./actions";

export const metadata = { title: "Absensi Latihan" };

export default async function AttendanceIndex() {
  const today = todayISO();
  const scope = await requireStaff("coach");
  const squad = new Set(scope.ids ?? []);
  const [sessions, players, groups] = await Promise.all([getSessionAgg(addDays(today, -21), addDays(today, 7), scope.coachId), getPlayers({ status: "aktif", ids: scope.ids }), getAgeGroups()]);
  const gName = new Map(groups.map((g) => [g.id, g.name]));
  const active = sessions.filter((s) => s.status !== "batal");
  const todays = active.filter((s) => s.session_date === today);
  const pendingPast = active.filter((s) => s.session_date < today && s.total === 0).reverse();
  const upcoming = active.filter((s) => s.session_date > today);
  const recorded = active.filter((s) => s.session_date < today && s.total > 0).reverse();

  const Card = ({ s, highlight = false }: { s: SessionAgg; highlight?: boolean }) => {
    const eligible = eligiblePlayers(players, s, squad).length;
    const pct = s.total ? (s.hadir / s.total) * 100 : 0;
    return (
      <Link href={`/coach/absensi/${s.session_id}`} className={`flex items-center gap-3 rounded-[10px] border bg-panel p-3.5 transition hover:border-accent ${highlight ? "border-accent ring-2 ring-accent/15" : "border-line"}`}>
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[8px] text-center text-[11px] leading-tight font-semibold ${highlight ? "bg-accent text-white" : "bg-brand-soft text-brand"}`}>
          {dayName(s.session_date).slice(0, 3)}<br /><span className="num text-base">{s.session_date.slice(8)}</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{s.kind}</p>
          <p className="caption">{fmtDate(s.session_date)} · <span className="num">{fmtTimeRange(s.start_time, s.end_time)}</span> · {s.age_group_id ? gName.get(s.age_group_id) : "Seluruh skuad"}{s.gk_only ? " · kiper" : ""}</p>
          {s.total > 0 && <Bar value={pct} className="mt-1.5 h-1.5" color="var(--hadir)" />}
        </div>
        <div className="text-right">
          {s.total > 0 ? (
            <><p className="num text-sm font-semibold">{s.hadir}/{s.total}</p><p className="caption">hadir</p></>
          ) : (
            <Badge tone={s.session_date < today ? "alpa" : "neutral"}>{s.session_date < today ? "Belum diabsen" : `${eligible} pemain`}</Badge>
          )}
        </div>
        <ChevronRight size={18} className="shrink-0 text-ink-faint" />
      </Link>
    );
  };

  return (
    <>
      <PageHeader icon={ClipboardCheck} title="Absensi latihan" subtitle="Sesi milikmu. Pilih sesi, tandai kehadiran tiap pemain di skuad, lalu simpan sekali." />

      <Panel title="Hari ini" subtitle={`${dayName(today)}, ${fmtDate(today)}`}>
        {todays.length ? (
          <Stagger className="grid gap-3 md:grid-cols-2">{todays.map((s) => <Item key={s.session_id}><Card s={s} highlight /></Item>)}</Stagger>
        ) : (
          <form action={quickSessionToday} className="rounded-[10px] border border-dashed border-line-strong p-4">
            <p className="font-medium">Tidak ada sesi terjadwal hari ini.</p>
            <p className="caption mb-3">Buat sesi sekarang untuk langsung mengisi absensi di lapangan.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_120px_120px_auto]">
              <select name="kind" className={`${inputCls} col-span-2 sm:col-span-1`} aria-label="Jenis latihan">{SESSION_KINDS.map((k) => <option key={k}>{k}</option>)}</select>
              <input type="time" name="start_time" defaultValue="15:30" className={inputCls} aria-label="Mulai" />
              <input type="time" name="end_time" defaultValue="17:00" className={inputCls} aria-label="Selesai" />
              <Button type="submit" variant="accent" className="col-span-2 sm:col-span-1"><CalendarPlus size={17} /> Buat & absen</Button>
            </div>
          </form>
        )}
      </Panel>

      {pendingPast.length > 0 && (
        <Panel className="mt-4 border-l-[3px] border-l-alpa" title="Belum diabsen" subtitle="Sesi yang sudah lewat tapi belum ada catatan kehadiran">
          <div className="grid gap-3 md:grid-cols-2">{pendingPast.map((s) => <Card key={s.session_id} s={s} />)}</div>
        </Panel>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Sudah tercatat" subtitle="3 minggu terakhir · ketuk untuk memperbaiki">
          {recorded.length ? <div className="space-y-3">{recorded.map((s) => <Card key={s.session_id} s={s} />)}</div> : <EmptyState title="Belum ada absensi tercatat" />}
        </Panel>
        <Panel title="Mendatang" subtitle="7 hari ke depan">
          {upcoming.length ? <div className="space-y-3">{upcoming.map((s) => <Card key={s.session_id} s={s} />)}</div> : <EmptyState title="Belum ada jadwal minggu depan" action={<Link href="/coach/jadwal" className="text-sm font-semibold text-accent">Atur jadwal ▸</Link>} />}
        </Panel>
      </div>
    </>
  );
}
