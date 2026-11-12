import { User } from "lucide-react";
import { PageHeader, Panel, Avatar } from "@/components/ui/Panel";
import { PlayerStatusBadge, PositionTag } from "@/components/ui/Badge";
import { requireActivePlayer } from "@/lib/auth/roles";
import { getAgeGroups } from "@/lib/data";
import { ageFrom, fmtDate } from "@/lib/format";
import { POSITIONS } from "@/lib/types";

export const metadata = { title: "Profil" };

export default async function PlayerProfile() {
  const player = await requireActivePlayer();
  const group = (await getAgeGroups()).find((g) => g.id === player.age_group_id);
  const rows: [string, React.ReactNode][] = [
    ["Nama lengkap", player.full_name],
    ["Tanggal lahir", fmtDate(player.birth_date)],
    ["Umur", <span key="u" className="num">{ageFrom(player.birth_date)} tahun</span>],
    ["Posisi", POSITIONS.find((p) => p.value === player.position)?.label],
    ["Kelompok usia", group?.name ?? "—"],
    ["Tim", player.team],
    ["No. punggung", player.jersey_no ? <span key="j" className="num">#{player.jersey_no}</span> : "—"],
    ["No. HP", player.phone ? <span key="p" className="num">{player.phone}</span> : "—"],
    ["Email (Google)", player.email ?? "—"],
    ["Terdaftar", fmtDate(player.created_at.slice(0, 10))],
  ];
  return (
    <div className="mx-auto max-w-[720px]">
      <PageHeader icon={User} title="Profil" />
      <Panel>
        <div className="mb-5 flex items-center gap-4">
          <Avatar name={player.full_name} size={64} />
          <div>
            <p className="text-lg font-semibold">{player.full_name}</p>
            <p className="mt-1 flex items-center gap-2"><PositionTag position={player.position} /><PlayerStatusBadge status={player.status} /></p>
          </div>
        </div>
        <dl className="divide-y divide-line border-t border-line">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[140px_1fr] gap-3 py-3 text-sm">
              <dt className="text-ink-muted">{k}</dt>
              <dd className="min-w-0 break-words font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="caption mt-4">Ada data yang keliru? Sampaikan ke coach atau admin — perubahan data pemain dilakukan oleh admin akademi.</p>
      </Panel>
    </div>
  );
}
