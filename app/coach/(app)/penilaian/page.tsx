import Link from "next/link";
import { Activity, History, Pencil } from "lucide-react";
import { PageHeader, Panel, EmptyState, Avatar } from "@/components/ui/Panel";
import { LinkButton } from "@/components/ui/Button";
import { getAgeGroups, getAssessment, getAssessmentItems, getAssessments, getPlayers, getScores, getSessions } from "@/lib/data";
import { addDays, dayName, fmtDate, fmtScore, todayISO } from "@/lib/format";
import { valueTone } from "@/lib/scoring";
import { inScope, requireStaff } from "@/lib/scope";
import { AssessmentForm, type EditTarget } from "./AssessmentForm";
import { DeleteReview } from "./DeleteReview";

export const metadata = { title: "Penilaian 1–10" };

export default async function AssessmentPage({ searchParams }: { searchParams: Promise<{ pemain?: string; ubah?: string }> }) {
  const [scope, sp] = await Promise.all([requireStaff("coach"), searchParams]);
  const today = todayISO();
  const [players, groups, items, recentAll, sessions, editRow] = await Promise.all([
    getPlayers({ status: "aktif", ids: scope.ids }),
    getAgeGroups(),
    getAssessmentItems(),
    getAssessments({ ids: scope.ids, from: addDays(today, -180) }),
    getSessions(addDays(today, -21), today, scope.coachId),
    sp.ubah ? getAssessment(sp.ubah) : Promise.resolve(null),
  ]);
  const edit: EditTarget | undefined = editRow && editRow.coach_id === scope.coachId && inScope(scope, editRow.player_id)
    ? { id: editRow.id, player_id: editRow.player_id, assessed_on: editRow.assessed_on, session_id: editRow.session_id, notes: editRow.notes, scores: editRow.scores }
    : undefined;

  // nilai terakhir tiap pemain untuk tombol "Sama dengan terakhir"
  const lastIds = new Map<string, string>();
  for (const a of recentAll) if (!lastIds.has(a.player_id)) lastIds.set(a.player_id, a.id);
  const scores = await getScores([...lastIds.values()]);
  const lastBy = new Map<string, Record<number, number>>();
  for (const [pid, aid] of lastIds) lastBy.set(pid, Object.fromEntries(scores.filter((s) => s.assessment_id === aid).map((s) => [s.item_id, s.score])));

  const gName = new Map(groups.map((g) => [g.id, g.name]));
  const pName = new Map(players.map((p) => [p.id, p.full_name]));
  const mine = recentAll.filter((a) => a.coach_id === scope.coachId).slice(0, 25);

  return (
    <>
      <PageHeader icon={Activity} title={edit ? "Ubah penilaian" : "Penilaian 1–10"} subtitle="Beri poin 1–10 untuk setiap tes fisik, teknik, dan taktik. Kiper otomatis memakai item tes kiper." />
      <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7" title={edit ? `Mengubah penilaian ${pName.get(edit.player_id)} · ${fmtDate(edit.assessed_on)}` : "Penilaian baru"} actions={edit ? <LinkButton href="/coach/penilaian" variant="ghost" size="sm">Batal ubah</LinkButton> : undefined}>
          {players.length ? (
            <AssessmentForm
              key={edit?.id ?? "baru"}
              today={today}
              defaultPlayer={sp.pemain && inScope(scope, sp.pemain) ? sp.pemain : undefined}
              edit={edit}
              items={items}
              players={[...players].sort((a, b) => (a.age_group_id ?? 0) - (b.age_group_id ?? 0) || a.full_name.localeCompare(b.full_name)).map((p) => ({
                id: p.id, name: p.full_name, position: p.position, group: p.age_group_id ? gName.get(p.age_group_id) ?? "Lainnya" : "Lainnya", last: lastBy.get(p.id) ?? null,
              }))}
              sessions={sessions.filter((s) => s.status !== "batal").reverse().map((s) => ({ id: s.id, label: `${dayName(s.session_date)}, ${fmtDate(s.session_date)} · ${s.kind}` }))}
            />
          ) : <EmptyState title="Skuadmu belum berisi pemain">Admin perlu menambahkan pemain ke skuadmu sebelum penilaian bisa diisi.</EmptyState>}
        </Panel>
        <Panel className="lg:col-span-5" icon={History} title="Penilaian saya" subtitle="25 penilaian terakhir yang kamu isi" bodyClassName="p-0 md:p-0">
          {mine.length ? (
            <ul className="divide-y divide-line">
              {mine.map((r) => (
                <li key={r.id} className={`flex items-center gap-3 px-4 py-3 md:px-5 ${edit?.id === r.id ? "bg-accent-soft" : ""}`}>
                  <Avatar name={pName.get(r.player_id) ?? "?"} size={34} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/coach/pemain/${r.player_id}`} className="block truncate text-sm font-medium hover:text-accent">{pName.get(r.player_id) ?? "Pemain keluar dari skuad"}</Link>
                    <p className="caption num">{fmtDate(r.assessed_on)} · F {fmtScore(r.fisik)} · Te {fmtScore(r.teknik)} · Ta {fmtScore(r.taktik)}</p>
                  </div>
                  <p className={`num rounded-full px-2 py-0.5 text-sm font-semibold ${valueTone(r.overall)}`}>{fmtScore(r.overall)}</p>
                  {inScope(scope, r.player_id) && (
                    <Link href={`/coach/penilaian?ubah=${r.id}`} className="grid h-9 w-9 place-items-center rounded-[6px] text-ink-faint hover:bg-sunken hover:text-ink" aria-label="Ubah penilaian"><Pencil size={16} /></Link>
                  )}
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
