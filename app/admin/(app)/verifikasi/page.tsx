import Link from "next/link";
import { Mail, Phone, ShieldCheck, UserCheck } from "lucide-react";
import { PageHeader, Panel, EmptyState, Avatar } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { getAgeGroups, getCoaches, getPlayers } from "@/lib/data";
import { ageFrom, fmtDate } from "@/lib/format";
import { requireStaff } from "@/lib/scope";
import { FOCUS_LABEL } from "@/lib/types";
import { SquadRulesForm } from "../coach/SquadRulesForm";
import { PendingPlayers } from "./PendingPlayers";

export const metadata = { title: "Verifikasi" };

const range = (g: { min_age: number; max_age: number }) => (g.max_age >= 99 ? `${g.min_age}+` : g.min_age === 0 ? `≤${g.max_age}` : `${g.min_age}–${g.max_age}`);

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [, sp] = await Promise.all([requireStaff("admin"), searchParams]);
  const [coaches, players, groups] = await Promise.all([getCoaches(), getPlayers(), getAgeGroups()]);
  const pendingCoaches = coaches.filter((c) => c.status === "pending");
  const pendingPlayers = players.filter((p) => p.status === "pending");
  const tab = sp.tab === "coach" || (!sp.tab && pendingCoaches.length && !pendingPlayers.length) ? "coach" : "pemain";
  const gName = new Map(groups.map((g) => [g.id, g.name]));
  const groupOpts = groups.map((g) => ({ id: g.id, name: g.name, range: range(g) }));

  return (
    <>
      <PageHeader icon={UserCheck} title="Verifikasi pendaftar" subtitle="Coach dan pemain masuk dengan Google, lalu menunggu persetujuan admin. Satu akun Google hanya bisa satu peran." />
      <div className="mb-3 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {[{ k: "pemain", l: "Pemain", n: pendingPlayers.length }, { k: "coach", l: "Coach", n: pendingCoaches.length }].map((t) => (
          <Link key={t.k} href={`/admin/verifikasi?tab=${t.k}`} role="tab" aria-selected={tab === t.k}
            className={`-mb-px flex h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium ${tab === t.k ? "border-accent text-accent" : "border-transparent text-ink-muted hover:text-ink"}`}>
            {t.l}<span className={`num rounded-full px-1.5 text-xs ${t.n ? "bg-gold text-nav" : "bg-sunken"}`}>{t.n}</span>
          </Link>
        ))}
      </div>

      {tab === "pemain" ? (
        <Panel bodyClassName="p-0 md:p-0">
          <PendingPlayers
            groups={groups.map((g) => ({ id: g.id, name: g.name }))}
            coachRules={coaches.filter((c) => c.status === "aktif").map((c) => ({ name: c.full_name, groups: c.age_group_ids, focus: c.focus }))}
            rows={pendingPlayers.map((p) => ({
              id: p.id, name: p.full_name, email: p.email, phone: p.phone, age: ageFrom(p.birth_date), position: p.position,
              groupId: p.age_group_id, group: p.age_group_id ? gName.get(p.age_group_id) ?? "—" : "—", registered: fmtDate(p.created_at.slice(0, 10)),
            }))}
            unlinked={players.filter((p) => p.status !== "pending" && !p.clerk_user_id).map((p) => ({ id: p.id, name: p.full_name }))}
          />
        </Panel>
      ) : pendingCoaches.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {pendingCoaches.map((c) => (
            <Panel key={c.id} className="border-l-[3px] border-l-gold">
              <div className="mb-4 flex items-start gap-3">
                <Avatar name={c.full_name} size={42} tone="gold" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.full_name}</p>
                  <p className="caption mt-0.5">Daftar {fmtDate(c.created_at.slice(0, 10))} · usulan: {FOCUS_LABEL[c.focus]}, {c.age_group_ids.map((id) => gName.get(id)).join(", ") || "—"}</p>
                  <p className="caption mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                    {c.email && <span className="inline-flex items-center gap-1"><Mail size={13} />{c.email}</span>}
                    {c.phone && <span className="num inline-flex items-center gap-1"><Phone size={13} />{c.phone}</span>}
                  </p>
                </div>
                {c.is_demo && <Badge tone="neutral">Demo</Badge>}
              </div>
              <SquadRulesForm coachId={c.id} groups={groupOpts} initial={{ groups: c.age_group_ids, focus: c.focus }} mode="approve" />
            </Panel>
          ))}
        </div>
      ) : (
        <Panel><EmptyState icon={ShieldCheck} title="Tidak ada coach yang menunggu">Coach yang mendaftar lewat halaman /coach akan muncul di sini.</EmptyState></Panel>
      )}
    </>
  );
}
