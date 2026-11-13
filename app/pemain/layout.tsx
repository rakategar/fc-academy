import { AppShell } from "@/components/shell/AppShell";
import { CheckInGate } from "@/components/player/CheckInGate";
import { requireActivePlayer } from "@/lib/auth/roles";
import { getOpenCheckIn } from "@/lib/checkin";
import { CalendarOff } from "lucide-react";
import { fmtDate, fmtTimeRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const player = await requireActivePlayer();
  const open = await getOpenCheckIn(player);
  return (
    <AppShell role="pemain" user={{ name: player.full_name, subtitle: `Pemain · ${player.position}` }}>
      {player.status === "cuti" && (
        <div role="status" className="mb-4 flex gap-3 rounded-[10px] border border-sakit/40 bg-sakit-bg p-3 text-sm text-sakit-ink">
          <CalendarOff size={18} className="mt-0.5 shrink-0" />
          <p>
            <b>Kamu sedang cuti</b>{player.leave_since && <> sejak {fmtDate(player.leave_since)}</>}{player.leave_reason && <> · {player.leave_reason}</>}
            {player.leave_until && <> · perkiraan kembali {fmtDate(player.leave_until)}</>}.
            <br /><span className="opacity-80">Selama cuti kamu tidak perlu absen dan tidak ikut peringkat. Riwayatmu tetap tersimpan. Kabari coach saat siap kembali berlatih.</span>
          </p>
        </div>
      )}
      {children}
      {open && (
        <CheckInGate
          key={open.session.id}
          sessionId={open.session.id}
          firstName={player.full_name.split(" ")[0]}
          kind={open.session.kind}
          time={fmtTimeRange(open.session.start_time, open.session.end_time)}
          location={open.session.location}
          coach={open.coachName}
          isKeeper={player.position === "GK"}
          more={open.all.length - 1}
        />
      )}
    </AppShell>
  );
}
