import { notFound } from "next/navigation";
import { ChevronLeft, Clock, MapPin, Users } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { eligiblePlayers, getAgeGroups, getPlayers, getSession, getSessionAttendance } from "@/lib/data";
import { requireStaff } from "@/lib/scope";
import { dayName, fmtDate, fmtTimeRange } from "@/lib/format";
import { AttendanceSheet, type SheetRow } from "./AttendanceSheet";

export const metadata = { title: "Isi Absensi" };

export default async function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scope = await requireStaff("coach");
  const session = await getSession(id);
  if (!session || session.coach_id !== scope.coachId) notFound();
  const [players, groups, existing] = await Promise.all([getPlayers({ status: ["aktif", "arsip"] }), getAgeGroups(), getSessionAttendance(id)]);
  const gName = new Map(groups.map((g) => [g.id, g.name]));
  const byPlayer = new Map(existing.map((a) => [a.player_id, a]));
  const eligible = eligiblePlayers(players, session, new Set(scope.ids ?? []));
  // pemain yang sudah tercatat tapi kini diarsipkan tetap ditampilkan agar catatannya bisa diperbaiki
  const extra = players.filter((p) => byPlayer.has(p.id) && !eligible.includes(p));
  const rows: SheetRow[] = [...eligible, ...extra].map((p) => ({
    id: p.id, name: p.full_name, position: p.position, group: p.age_group_id ? gName.get(p.age_group_id) ?? "—" : "—",
    status: byPlayer.get(p.id)?.status ?? null, note: byPlayer.get(p.id)?.note ?? null,
  }));

  return (
    <>
      <LinkButton href="/coach/absensi" variant="ghost" size="sm" className="mb-2 -ml-2"><ChevronLeft size={16} /> Semua sesi</LinkButton>
      <header className="mb-1">
        <p className="caption">{dayName(session.session_date)}, {fmtDate(session.session_date)}</p>
        <h1 className="h1 flex flex-wrap items-center gap-2">{session.kind} {session.status === "selesai" ? <Badge tone="hadir">Selesai</Badge> : session.status === "batal" ? <Badge tone="alpa">Batal</Badge> : <Badge tone="izin">Terjadwal</Badge>}</h1>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
          <span className="num inline-flex items-center gap-1"><Clock size={14} />{fmtTimeRange(session.start_time, session.end_time)} WIB</span>
          <span className="inline-flex items-center gap-1"><Users size={14} />{session.age_group_id ? gName.get(session.age_group_id) : "Seluruh skuad"}{session.gk_only ? " · khusus kiper" : ""}</span>
          <span className="inline-flex items-center gap-1"><MapPin size={14} />{session.location}</span>
        </p>
        {session.focus && <p className="mt-1 text-sm">Fokus: {session.focus}</p>}
      </header>
      <AttendanceSheet sessionId={session.id} rows={rows} disabled={session.status === "batal" ? "Sesi ini dibatalkan. Aktifkan lagi dari menu Jadwal untuk mengisi absensi." : undefined} />
    </>
  );
}
