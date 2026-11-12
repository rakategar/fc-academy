import Link from "next/link";
import { ChevronRight, ShieldCheck, UserCheck } from "lucide-react";
import { PageHeader, Panel, EmptyState, Avatar } from "@/components/ui/Panel";
import { Badge, CoachStatusBadge } from "@/components/ui/Badge";
import { getAgeGroups, getCoaches, getMemberships } from "@/lib/data";
import { requireStaff } from "@/lib/scope";
import { FOCUS_LABEL } from "@/lib/types";

export const metadata = { title: "Coach & Skuad" };

export default async function CoachesPage() {
  await requireStaff("admin");
  const [coaches, groups, memberships] = await Promise.all([getCoaches(), getAgeGroups(), getMemberships()]);
  const gNames = (ids: number[]) => groups.filter((g) => ids.includes(g.id)).map((g) => g.name).join(", ") || "—";
  const order = { aktif: 0, pending: 1, nonaktif: 2, ditolak: 3 } as const;
  const list = [...coaches].sort((a, b) => order[a.status] - order[b.status] || a.full_name.localeCompare(b.full_name));
  const pending = coaches.filter((c) => c.status === "pending").length;

  return (
    <>
      <PageHeader icon={ShieldCheck} title="Coach & skuad" subtitle="Skuad tiap coach terisi otomatis dari kelompok usia + fokus (semua posisi / kiper). Admin bisa menambah atau mengeluarkan pemain secara manual." />
      {pending > 0 && (
        <Link href="/admin/verifikasi?tab=coach" className="mb-3 flex items-center gap-3 rounded-[10px] border border-gold/40 bg-gold-soft p-3 text-sm text-gold-ink">
          <UserCheck size={18} /> <span className="flex-1"><b className="num">{pending}</b> coach menunggu verifikasi.</span><b>Verifikasi ▸</b>
        </Link>
      )}
      <Panel bodyClassName="p-0 md:p-0">
        {list.length ? (
          <ul className="divide-y divide-line">
            {list.map((c) => {
              const n = memberships.filter((m) => m.coach_id === c.id && !m.excluded).length;
              const manual = memberships.filter((m) => m.coach_id === c.id && !m.excluded && m.source === "manual").length;
              return (
                <li key={c.id}>
                  <Link href={c.status === "pending" ? "/admin/verifikasi?tab=coach" : `/admin/coach/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-sunken md:px-5">
                    <Avatar name={c.full_name} size={40} tone={c.focus === "kiper" ? "gold" : "brand"} />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-medium">{c.full_name} <CoachStatusBadge status={c.status} />{c.is_demo && <Badge tone="neutral" dot={false}>Demo</Badge>}</p>
                      <p className="caption truncate">{FOCUS_LABEL[c.focus]} · {gNames(c.age_group_ids)}{c.email ? ` · ${c.email}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="num text-lg font-semibold">{n}</p>
                      <p className="caption">pemain{manual ? ` · ${manual} manual` : ""}</p>
                    </div>
                    <ChevronRight size={18} className="text-ink-faint" />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : <div className="p-5"><EmptyState title="Belum ada coach">Coach mendaftar sendiri lewat halaman /coach dengan akun Google, lalu disetujui di menu Verifikasi.</EmptyState></div>}
      </Panel>
    </>
  );
}
