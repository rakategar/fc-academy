import { User, Users } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { PageHeader, Panel, Avatar } from "@/components/ui/Panel";
import { CoachStatusBadge, SourceBadge, PositionTag } from "@/components/ui/Badge";
import { btn } from "@/components/ui/Button";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { getAgeGroups, getMemberships, getPeriod, getPlayers } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { requireStaff } from "@/lib/scope";
import { FOCUS_LABEL } from "@/lib/types";

export const metadata = { title: "Profil & Skuad" };

export default async function CoachProfile() {
  const scope = await requireStaff("coach");
  const c = scope.coach!;
  const [groups, memberships, players, season] = await Promise.all([getAgeGroups(), getMemberships({ coachId: c.id }), getPlayers({ status: "aktif", ids: scope.ids }), getPeriod("musim")]);
  const src = new Map(memberships.map((m) => [m.player_id, m.source]));
  const gName = new Map(groups.map((g) => [g.id, g.name]));
  const rows: [string, React.ReactNode][] = [
    ["Nama", c.full_name],
    ["Email (Google)", c.email ?? "—"],
    ["No. HP", c.phone ? <span key="p" className="num">{c.phone}</span> : "—"],
    ["Kelompok usia", c.age_group_ids.map((id) => gName.get(id)).join(", ") || "—"],
    ["Fokus", FOCUS_LABEL[c.focus]],
    ["Musim aktif", `${season.label} (${fmtDate(season.from)} – ${fmtDate(season.seasonEnd ?? season.to)})`],
  ];
  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader icon={User} title="Profil & skuad" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <div className="mb-5 flex items-center gap-4">
            <Avatar name={c.full_name} size={60} tone="gold" />
            <div>
              <p className="text-lg font-semibold">{c.full_name}</p>
              <p className="mt-1"><CoachStatusBadge status={c.status} /></p>
            </div>
          </div>
          <dl className="divide-y divide-line border-t border-line">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[120px_1fr] gap-3 py-3 text-sm"><dt className="text-ink-muted">{k}</dt><dd className="min-w-0 font-medium break-words">{v}</dd></div>
            ))}
          </dl>
          <p className="caption mt-4">Skuad, kelompok usia, dan musim diatur oleh admin akademi. Hubungi admin bila ada pemain yang belum masuk skuadmu.</p>
          <InstallPrompt className="mt-4" />
          <SignOutButton redirectUrl="/coach"><button className={btn("secondary", "md", "mt-4 w-full")}>Keluar</button></SignOutButton>
        </Panel>
        <Panel icon={Users} title={`Skuad (${players.length} pemain)`} subtitle="Otomatis = sesuai aturan kelompok usia · Manual = ditambahkan admin" bodyClassName="p-0 md:p-0">
          <ul className="max-h-[560px] divide-y divide-line overflow-y-auto">
            {players.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 md:px-5">
                <PositionTag position={p.position} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.full_name}</span>
                <span className="caption">{p.age_group_id ? gName.get(p.age_group_id) : "—"}</span>
                <SourceBadge source={src.get(p.id) ?? "aturan"} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
