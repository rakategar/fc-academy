import { notFound } from "next/navigation";
import { Activity, ChevronLeft, Mail, Pencil, Phone } from "lucide-react";
import { Avatar } from "@/components/ui/Panel";
import { LinkButton } from "@/components/ui/Button";
import { PlayerStatusBadge, PositionTag, Badge } from "@/components/ui/Badge";
import { PeriodTabs } from "@/components/ui/PeriodTabs";
import { PlayerOverview } from "@/components/player/PlayerOverview";
import { getAgeGroups, getPlayer } from "@/lib/data";
import { ageFrom, fmtDate, periodRange } from "@/lib/format";
import { POSITIONS } from "@/lib/types";
import { PlayerStatusButton } from "./PlayerActions";

export default async function PlayerDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ periode?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const period = periodRange(sp.periode ?? "90");
  const [player, groups] = await Promise.all([getPlayer(id), getAgeGroups()]);
  if (!player) notFound();
  const group = groups.find((g) => g.id === player.age_group_id);

  return (
    <>
      <LinkButton href="/coach/pemain" variant="ghost" size="sm" className="mb-3 -ml-2"><ChevronLeft size={16} /> Data pemain</LinkButton>
      <section className="mb-4 rounded-[10px] border border-line bg-panel p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <Avatar name={player.full_name} size={64} />
            <div>
              <h1 className="h1">{player.full_name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                <PositionTag position={player.position} /> {POSITIONS.find((p) => p.value === player.position)?.label.split(" (")[0]}
                <span>·</span> <span className="num">{ageFrom(player.birth_date)}</span> tahun <span>·</span> {group?.name ?? "—"}
                {player.jersey_no && <><span>·</span> <span className="num">#{player.jersey_no}</span></>}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <PlayerStatusBadge status={player.status} />
                {player.clerk_user_id ? <Badge tone="izin">Akun Google tertaut</Badge> : <Badge tone="neutral">Belum punya akun</Badge>}
                {player.is_candidate && <Badge tone="gold">Kandidat turnamen</Badge>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:ml-auto">
            <LinkButton href={`/coach/performa?pemain=${player.id}`} variant="accent"><Activity size={17} /> Nilai performa</LinkButton>
            <LinkButton href={`/coach/pemain/${player.id}/ubah`} variant="secondary"><Pencil size={17} /> Ubah</LinkButton>
            <PlayerStatusButton id={player.id} status={player.status} />
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm md:grid-cols-4">
          <div><dt className="caption">Tanggal lahir</dt><dd>{fmtDate(player.birth_date)}</dd></div>
          <div><dt className="caption">Tim</dt><dd>{player.team}</dd></div>
          <div><dt className="caption">Kontak</dt><dd className="num flex items-center gap-1">{player.phone ? <><Phone size={13} />{player.phone}</> : "—"}</dd></div>
          <div className="min-w-0"><dt className="caption">Email</dt><dd className="flex items-center gap-1 truncate">{player.email ? <><Mail size={13} className="shrink-0" /><span className="truncate">{player.email}</span></> : "—"}</dd></div>
        </dl>
      </section>

      <div className="mb-4 flex justify-end"><PeriodTabs current={period.key} basePath={`/coach/pemain/${player.id}`} /></div>
      <PlayerOverview playerId={player.id} from={period.from} to={period.to} periodLabel={period.label} />
    </>
  );
}
