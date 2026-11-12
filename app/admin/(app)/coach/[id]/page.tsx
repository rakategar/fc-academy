import { notFound } from "next/navigation";
import { ChevronLeft, Mail, Phone, Settings2, Users } from "lucide-react";
import { Avatar, Panel } from "@/components/ui/Panel";
import { LinkButton } from "@/components/ui/Button";
import { Badge, CoachStatusBadge } from "@/components/ui/Badge";
import { getAgeGroups, getCoach, getMemberships, getPlayers } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { requireStaff } from "@/lib/scope";
import { FOCUS_LABEL } from "@/lib/types";
import { SquadRulesForm } from "../SquadRulesForm";
import { CoachStatusButton } from "./CoachStatusButton";
import { SquadMembership } from "../../pemain/SquadMembership";

export const metadata = { title: "Detail Coach" };

export default async function CoachDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("admin");
  const { id } = await params;
  const [coach, groups, memberships, players] = await Promise.all([getCoach(id), getAgeGroups(), getMemberships({ coachId: id }), getPlayers({ status: "aktif" })]);
  if (!coach) notFound();
  const gName = new Map(groups.map((g) => [g.id, g.name]));
  const pMap = new Map(players.map((p) => [p.id, p]));
  const rows = memberships.filter((m) => pMap.has(m.player_id)).map((m) => {
    const p = pMap.get(m.player_id)!;
    return { coachId: id, playerId: p.id, label: p.full_name, sub: `${p.position} · ${p.age_group_id ? gName.get(p.age_group_id) : "—"}`, href: `/admin/pemain/${p.id}`, source: m.source, excluded: m.excluded };
  }).sort((a, b) => a.label.localeCompare(b.label));
  const range = (g: { min_age: number; max_age: number }) => (g.max_age >= 99 ? `${g.min_age}+` : g.min_age === 0 ? `≤${g.max_age}` : `${g.min_age}–${g.max_age}`);

  return (
    <>
      <LinkButton href="/admin/coach" variant="ghost" size="sm" className="mb-3 -ml-2"><ChevronLeft size={16} /> Coach & skuad</LinkButton>
      <section className="mb-4 rounded-[10px] border border-line bg-panel p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <Avatar name={coach.full_name} size={60} tone={coach.focus === "kiper" ? "gold" : "brand"} />
            <div>
              <h1 className="h1">{coach.full_name}</h1>
              <p className="mt-1 text-sm text-ink-muted">{FOCUS_LABEL[coach.focus]} · {coach.age_group_ids.map((g) => gName.get(g)).join(", ") || "—"}</p>
              <div className="mt-2 flex flex-wrap gap-2"><CoachStatusBadge status={coach.status} />{coach.clerk_user_id ? <Badge tone="izin">Akun Google tertaut</Badge> : <Badge tone="neutral">Data demo / tanpa akun</Badge>}</div>
            </div>
          </div>
          <div className="md:ml-auto">{(coach.status === "aktif" || coach.status === "nonaktif") && <CoachStatusButton id={coach.id} status={coach.status} />}</div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm md:grid-cols-4">
          <div className="min-w-0"><dt className="caption">Email</dt><dd className="flex items-center gap-1 truncate">{coach.email ? <><Mail size={13} className="shrink-0" /><span className="truncate">{coach.email}</span></> : "—"}</dd></div>
          <div><dt className="caption">No. HP</dt><dd className="num flex items-center gap-1">{coach.phone ? <><Phone size={13} />{coach.phone}</> : "—"}</dd></div>
          <div><dt className="caption">Terdaftar</dt><dd>{fmtDate(coach.created_at.slice(0, 10))}</dd></div>
          <div><dt className="caption">Anggota skuad</dt><dd className="num">{rows.filter((r) => !r.excluded).length} pemain</dd></div>
        </dl>
      </section>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-5" icon={Settings2} title="Aturan skuad" subtitle="Pemain aktif yang cocok otomatis masuk skuad">
          <SquadRulesForm coachId={coach.id} groups={groups.map((g) => ({ id: g.id, name: g.name, range: range(g) }))} initial={{ groups: coach.age_group_ids, focus: coach.focus }} mode={coach.status === "pending" ? "approve" : "edit"} />
        </Panel>
        <Panel className="lg:col-span-7" icon={Users} title="Anggota skuad" subtitle="Otomatis = dari aturan · Manual = ditambahkan admin">
          <SquadMembership
            fixed={{ coachId: coach.id }}
            rows={rows}
            addLabel="Tambahkan pemain"
            emptyText="Skuad masih kosong"
            addOptions={players.filter((p) => !memberships.some((m) => m.player_id === p.id)).map((p) => ({ value: p.id, label: `${p.full_name} · ${p.position} · ${p.age_group_id ? gName.get(p.age_group_id) : "—"}` }))}
          />
        </Panel>
      </div>
    </>
  );
}
