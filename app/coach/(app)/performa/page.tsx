import Link from "next/link";
import { Activity, History } from "lucide-react";
import { PageHeader, Panel, EmptyState, Avatar } from "@/components/ui/Panel";
import { getAgeGroups, getPlayers, getReviews, getSessions } from "@/lib/data";
import { addDays, dayName, fmtDate, fmtNum, todayISO } from "@/lib/format";
import { PerformanceForm } from "./PerformanceForm";
import { DeleteReview } from "./DeleteReview";

export const metadata = { title: "Input Performa" };

export default async function PerformancePage({ searchParams }: { searchParams: Promise<{ pemain?: string }> }) {
  const { pemain } = await searchParams;
  const today = todayISO();
  const [players, groups, recent, sessions] = await Promise.all([
    getPlayers({ status: "aktif" }), getAgeGroups(), getReviews({ from: addDays(today, -120) }), getSessions(addDays(today, -21), today),
  ]);
  const gName = new Map(groups.map((g) => [g.id, g.name]));
  const pName = new Map(players.map((p) => [p.id, p.full_name]));
  const lastBy = new Map<string, Record<string, number>>();
  for (const r of recent) if (!lastBy.has(r.player_id)) lastBy.set(r.player_id, { teknik: r.teknik, fisik: r.fisik, taktik: r.taktik, mental: r.mental, disiplin: r.disiplin });

  return (
    <>
      <PageHeader icon={Activity} title="Input performa" subtitle="Nilai teknik, fisik, taktik, mental, dan disiplin. Rata-ratanya menyumbang 60% skor pemain." />
      <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7" title="Penilaian baru">
          <PerformanceForm
            today={today}
            defaultPlayer={pemain}
            players={[...players].sort((a, b) => (a.age_group_id ?? 0) - (b.age_group_id ?? 0) || a.full_name.localeCompare(b.full_name)).map((p) => ({
              id: p.id, name: p.full_name, group: p.age_group_id ? gName.get(p.age_group_id) ?? "Lainnya" : "Lainnya", last: lastBy.get(p.id) ?? null,
            }))}
            sessions={sessions.filter((s) => s.status !== "batal").reverse().map((s) => ({ id: s.id, date: s.session_date, label: `${dayName(s.session_date)}, ${fmtDate(s.session_date)} · ${s.kind}` }))}
          />
        </Panel>
        <Panel className="lg:col-span-5" icon={History} title="Penilaian terbaru" subtitle="20 penilaian terakhir" bodyClassName="p-0 md:p-0">
          {recent.length ? (
            <ul className="divide-y divide-line">
              {recent.slice(0, 20).map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-4 py-3 md:px-5">
                  <Avatar name={pName.get(r.player_id) ?? "?"} size={34} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/coach/pemain/${r.player_id}`} className="block truncate text-sm font-medium hover:text-accent">{pName.get(r.player_id) ?? "Pemain diarsipkan"}</Link>
                    <p className="caption">{fmtDate(r.review_date)}{r.notes ? ` · ${r.notes}` : ""}</p>
                  </div>
                  <p className="num text-base font-semibold">{fmtNum(r.overall)}</p>
                  <DeleteReview id={r.id} />
                </li>
              ))}
            </ul>
          ) : <div className="p-5"><EmptyState title="Belum ada penilaian">Penilaian yang kamu simpan akan muncul di sini.</EmptyState></div>}
        </Panel>
      </div>
    </>
  );
}
