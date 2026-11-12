import { notFound } from "next/navigation";
import { Activity, ChevronLeft, Mail, Pencil, Phone, ShieldCheck } from "lucide-react";
import { Avatar, Panel } from "@/components/ui/Panel";
import { LinkButton } from "@/components/ui/Button";
import { PlayerStatusBadge, PositionTag, Badge } from "@/components/ui/Badge";
import { PeriodTabs } from "@/components/ui/PeriodTabs";
import { PlayerOverview } from "@/components/player/PlayerOverview";
import { getAgeGroups, getCoaches, getMemberships, getPeriod, getPlayer } from "@/lib/data";
import { ageFrom, fmtDate } from "@/lib/format";
import { FOCUS_LABEL, POSITIONS } from "@/lib/types";
import { inScope, type Scope } from "@/lib/scope";
import { PlayerStatusButton } from "@/app/admin/(app)/pemain/[id]/PlayerActions";
import { SquadMembership } from "@/app/admin/(app)/pemain/SquadMembership";

export async function PlayerDetailView({ scope, id, periode }: { scope: Scope; id: string; periode?: string }) {
  if (!inScope(scope, id)) notFound();
  const isAdmin = scope.role === "admin";
  const period = await getPeriod(periode, "musim");
  const [player, groups, coaches, memberships] = await Promise.all([getPlayer(id), getAgeGroups(), getCoaches(), getMemberships({ playerId: id })]);
  if (!player) notFound();
  const group = groups.find((g) => g.id === player.age_group_id);
  const gNames = (ids: number[]) => groups.filter((g) => ids.includes(g.id)).map((g) => g.name).join(", ");
  const cMap = new Map(coaches.map((c) => [c.id, c]));
  const myCoaches = memberships.filter((m) => cMap.has(m.coach_id));

  return (
    <>
      <LinkButton href={`${scope.base}/pemain`} variant="ghost" size="sm" className="mb-3 -ml-2"><ChevronLeft size={16} /> {isAdmin ? "Data pemain" : "Pemain saya"}</LinkButton>
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
            {isAdmin ? (
              <>
                <LinkButton href={`/admin/pemain/${player.id}/ubah`} variant="secondary"><Pencil size={17} /> Ubah data</LinkButton>
                <PlayerStatusButton id={player.id} status={player.status} />
              </>
            ) : (
              <>
                <LinkButton href={`/coach/penilaian?pemain=${player.id}`} variant="accent"><Activity size={17} /> Beri nilai</LinkButton>
                <LinkButton href={`/coach/analisis?pemain=${player.id}`} variant="secondary">Analisis</LinkButton>
              </>
            )}
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm md:grid-cols-4">
          <div><dt className="caption">Tanggal lahir</dt><dd>{fmtDate(player.birth_date)}</dd></div>
          <div><dt className="caption">Tim</dt><dd>{player.team}</dd></div>
          <div><dt className="caption">Kontak</dt><dd className="num flex items-center gap-1">{player.phone ? <><Phone size={13} />{player.phone}</> : "—"}</dd></div>
          <div className="min-w-0"><dt className="caption">Email</dt><dd className="flex items-center gap-1 truncate">{player.email ? <><Mail size={13} className="shrink-0" /><span className="truncate">{player.email}</span></> : "—"}</dd></div>
        </dl>
      </section>

      {isAdmin && (
        <Panel className="mb-4" icon={ShieldCheck} title="Coach yang memegang" subtitle="Otomatis dari aturan skuad (kelompok usia & fokus). Admin bisa menambah atau mengeluarkan secara manual.">
          <SquadMembership
            fixed={{ playerId: player.id }}
            addLabel="Tambahkan ke skuad coach"
            emptyText={player.status === "aktif" ? "Belum ada coach yang memegang pemain ini" : "Pemain tidak aktif — tidak masuk skuad mana pun"}
            rows={myCoaches.map((m) => {
              const c = cMap.get(m.coach_id)!;
              return { coachId: c.id, playerId: player.id, label: c.full_name, sub: `${FOCUS_LABEL[c.focus]} · ${gNames(c.age_group_ids)}${c.status !== "aktif" ? " · nonaktif" : ""}`, href: `/admin/coach/${c.id}`, source: m.source, excluded: m.excluded };
            })}
            addOptions={player.status === "aktif" ? coaches.filter((c) => c.status === "aktif" && !myCoaches.some((m) => m.coach_id === c.id)).map((c) => ({ value: c.id, label: `${c.full_name} (${c.focus === "kiper" ? "kiper · " : ""}${gNames(c.age_group_ids)})` })) : []}
          />
        </Panel>
      )}
      {!isAdmin && myCoaches.filter((m) => !m.excluded).length > 1 && (
        <p className="caption mb-3">Juga dipegang: {myCoaches.filter((m) => !m.excluded && m.coach_id !== scope.coachId).map((m) => cMap.get(m.coach_id)!.full_name).join(", ")}.</p>
      )}
      <div className="mb-4 flex justify-end"><PeriodTabs current={period.key} basePath={`${scope.base}/pemain/${player.id}`} /></div>
      <PlayerOverview playerId={player.id} from={period.from} to={period.to} periodLabel={period.label} />
    </>
  );
}
