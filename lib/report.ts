"use server";
import { getAgeGroups, getAssessmentItems, getAssessments, getAttendanceRange, getCoaches, getPlayerStats, getPlayers, getScores } from "@/lib/data";
import { fmtDate, fmtDateTime, fmtNum, fmtPct, fmtScore } from "@/lib/format";
import { BAND_LABEL, SCORE_WEIGHTS, scoreBand } from "@/lib/scoring";
import { requireStaff, type StaffRole } from "@/lib/scope";
import { ATTENDANCE_LABEL, CATEGORIES } from "@/lib/types";
import type { Report } from "@/lib/export/types";

export type ReportKind = "absensi" | "penilaian" | "item" | "skor" | "detail";

export async function buildReport(role: StaffRole, kind: ReportKind, from: string, to: string, groupId: number | null): Promise<Report | { error: string }> {
  const scope = await requireStaff(role);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) return { error: "Rentang tanggal tidak valid." };
  const [players, groups, stats] = await Promise.all([getPlayers({ status: ["aktif", "cuti", "arsip"], ids: scope.ids }), getAgeGroups(), getPlayerStats(from, to, scope.ids, true)]);
  const gName = new Map(groups.map((g) => [g.id, g.name]));
  const inGroup = players.filter((p) => groupId === null || p.age_group_id === groupId);
  const ids = new Set(inGroup.map((p) => p.id));
  const sMap = new Map(stats.map((s) => [s.player_id, s]));
  const groupLabel = groupId ? gName.get(groupId) ?? "" : scope.role === "coach" ? "Skuad " + scope.actor.name : "Semua kelompok";
  const base = {
    subtitle: `Periode ${fmtDate(from)} – ${fmtDate(to)} · ${groupLabel}`,
    generatedAt: fmtDateTime(new Date().toISOString()),
    generatedBy: scope.actor.name,
  };
  const fileBase = `${from}_sd_${to}${groupId ? "_" + gName.get(groupId) : ""}`;
  // laporan memuat pemain aktif + yang sedang cuti (riwayatnya di periode itu tetap dihitung), ditandai "(cuti)"
  const active = inGroup.filter((p) => p.status === "aktif" || p.status === "cuti")
    .map((p) => (p.status === "cuti" ? { ...p, full_name: `${p.full_name} (cuti)` } : p))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
  const g = (id: number | null) => (id ? gName.get(id) ?? "—" : "—");

  if (kind === "absensi") {
    let H = 0, I = 0, S = 0, A = 0;
    const rows = active.map((p, i) => {
      const s = sMap.get(p.id);
      H += s?.hadir ?? 0; I += s?.izin ?? 0; S += s?.sakit ?? 0; A += s?.alpa ?? 0;
      return { no: i + 1, nama: p.full_name, posisi: p.position, kelompok: g(p.age_group_id), sesi: s?.sessions_total ?? 0, hadir: s?.hadir ?? 0, izin: s?.izin ?? 0, sakit: s?.sakit ?? 0, alpa: s?.alpa ?? 0, persen: fmtPct(s?.attendance_pct) };
    });
    const total = H + I + S + A;
    return {
      ...base, title: "Rekap Absensi Pemain", filename: `rekap-absensi_${fileBase}`,
      columns: [
        { key: "no", label: "No", align: "right", width: 5 }, { key: "nama", label: "Nama pemain" }, { key: "posisi", label: "Posisi", align: "center" },
        { key: "kelompok", label: "Kelompok" }, { key: "sesi", label: "Sesi", align: "right" }, { key: "hadir", label: "Hadir", align: "right" },
        { key: "izin", label: "Izin", align: "right" }, { key: "sakit", label: "Sakit", align: "right" }, { key: "alpa", label: "Tanpa ket.", align: "right" },
        { key: "persen", label: "% Hadir", align: "right" },
      ],
      rows,
      summary: [
        { label: "Jumlah pemain", value: String(rows.length) },
        { label: "Rata-rata kehadiran", value: total ? fmtPct((H / total) * 100) : "—" },
        { label: "Izin / sakit", value: `${I} / ${S}` },
        { label: "Tanpa keterangan", value: String(A) },
      ],
    };
  }

  if (kind === "penilaian" || kind === "item") {
    const [assess, coaches] = await Promise.all([getAssessments({ ids: [...ids], from, to }), getCoaches()]);
    const cName = new Map(coaches.map((c) => [c.id, c.full_name]));
    if (kind === "penilaian") {
      const rows = active.map((p, i) => {
        const s = sMap.get(p.id);
        const d = s && s.n_assess >= 2 && s.perf_first !== null && s.perf_last !== null ? s.perf_last - s.perf_first : null;
        return {
          no: i + 1, nama: p.full_name, posisi: p.position, kelompok: g(p.age_group_id), n: s?.n_assess ?? 0,
          fisik: fmtScore(s?.fisik), teknik: fmtScore(s?.teknik), taktik: fmtScore(s?.taktik), rata: fmtScore(s?.perf_avg),
          naik: d === null ? "—" : `${d >= 0 ? "+" : ""}${fmtNum(d)}`,
        };
      });
      const all = (k: "fisik" | "teknik" | "taktik" | "overall") => (assess.length ? fmtScore(assess.reduce((t, a) => t + a[k], 0) / assess.length) : "—");
      return {
        ...base, title: "Rekap Penilaian Pemain (1–10)", filename: `rekap-penilaian_${fileBase}`,
        columns: [
          { key: "no", label: "No", align: "right", width: 5 }, { key: "nama", label: "Nama pemain" }, { key: "posisi", label: "Posisi", align: "center" },
          { key: "kelompok", label: "Kelompok" }, { key: "n", label: "Penilaian", align: "right" }, { key: "fisik", label: "Fisik", align: "right" },
          { key: "teknik", label: "Teknik", align: "right" }, { key: "taktik", label: "Taktik", align: "right" }, { key: "rata", label: "Rata-rata", align: "right" },
          { key: "naik", label: "Peningkatan", align: "right" },
        ],
        rows,
        summary: [
          { label: "Jumlah penilaian", value: String(assess.length) },
          { label: "Rata-rata", value: all("overall") },
          { label: "Fisik / Teknik / Taktik", value: `${all("fisik")} / ${all("teknik")} / ${all("taktik")}` },
        ],
      };
    }
    const [items, scores] = await Promise.all([getAssessmentItems(true), getScores(assess.map((a) => a.id))]);
    const iMap = new Map(items.map((it) => [it.id, it]));
    const pName = new Map(players.map((p) => [p.id, p]));
    const byA = new Map<string, typeof scores>();
    scores.forEach((s) => byA.set(s.assessment_id, [...(byA.get(s.assessment_id) ?? []), s]));
    const rows = [...assess].sort((a, b) => a.assessed_on.localeCompare(b.assessed_on) || (pName.get(a.player_id)?.full_name ?? "").localeCompare(pName.get(b.player_id)?.full_name ?? ""))
      .flatMap((a) => (byA.get(a.id) ?? []).sort((x, y) => (iMap.get(x.item_id)?.category ?? "").localeCompare(iMap.get(y.item_id)?.category ?? "") || (iMap.get(x.item_id)?.sort ?? 0) - (iMap.get(y.item_id)?.sort ?? 0)).map((s) => ({
        tanggal: fmtDate(a.assessed_on), nama: pName.get(a.player_id)?.full_name ?? "—", posisi: pName.get(a.player_id)?.position ?? "",
        kategori: CATEGORIES.find((c) => c.key === iMap.get(s.item_id)?.category)?.label ?? "", tes: iMap.get(s.item_id)?.name ?? "", nilai: s.score,
        coach: a.coach_id ? cName.get(a.coach_id) ?? "" : "",
      })));
    return {
      ...base, title: "Detail Nilai per Tes", filename: `detail-nilai_${fileBase}`,
      columns: [
        { key: "tanggal", label: "Tanggal" }, { key: "nama", label: "Nama pemain" }, { key: "posisi", label: "Posisi", align: "center" },
        { key: "kategori", label: "Kategori" }, { key: "tes", label: "Tes" }, { key: "nilai", label: "Nilai", align: "right" }, { key: "coach", label: "Coach" },
      ],
      rows,
      summary: [{ label: "Jumlah penilaian", value: String(assess.length) }, { label: "Jumlah nilai tes", value: String(rows.length) }],
    };
  }

  if (kind === "skor") {
    const ranked = active.filter((p) => p.status === "aktif").map((p) => ({ p, s: sMap.get(p.id) })).sort((a, b) => (b.s?.total_score ?? -1) - (a.s?.total_score ?? -1));
    const rows = ranked.map(({ p, s }, i) => {
      const band = scoreBand(s?.total_score);
      return {
        no: i + 1, nama: p.full_name, posisi: p.position, kelompok: g(p.age_group_id), hadir: fmtPct(s?.attendance_pct),
        skor_hadir: fmtNum(s?.attendance_score), performa: fmtScore(s?.perf_avg), skor: fmtNum(s?.total_score), kategori: band ? BAND_LABEL[band] : "—",
      };
    });
    return {
      ...base, title: "Skor & Peringkat Pemain", filename: `skor-pemain_${fileBase}`,
      columns: [
        { key: "no", label: "Peringkat", align: "right", width: 10 }, { key: "nama", label: "Nama pemain" }, { key: "posisi", label: "Posisi", align: "center" },
        { key: "kelompok", label: "Kelompok" }, { key: "hadir", label: "% Hadir", align: "right" }, { key: "skor_hadir", label: "Skor hadir", align: "right" },
        { key: "performa", label: "Nilai (1–10)", align: "right" }, { key: "skor", label: "Skor total", align: "right" }, { key: "kategori", label: "Kategori" },
      ],
      rows,
      summary: [
        { label: "Bobot skor", value: `${SCORE_WEIGHTS.attendance * 100}% hadir + ${SCORE_WEIGHTS.performance * 100}% nilai` },
        { label: "Pemain dinilai", value: String(rows.filter((r) => r.skor !== "—").length) },
      ],
    };
  }

  const att = (await getAttendanceRange(from, to, { ids: scope.ids })).filter((a) => ids.has(a.player_id));
  const pName = new Map(players.map((p) => [p.id, p.full_name]));
  const rows = att
    .sort((a, b) => a.training_sessions.session_date.localeCompare(b.training_sessions.session_date) || (pName.get(a.player_id) ?? "").localeCompare(pName.get(b.player_id) ?? ""))
    .map((a, i) => ({
      no: i + 1, tanggal: fmtDate(a.training_sessions.session_date), sesi: a.training_sessions.kind, nama: pName.get(a.player_id) ?? "—",
      status: ATTENDANCE_LABEL[a.status], catatan: a.note ?? "", oleh: a.recorded_by === "seed" ? "coach" : a.recorded_by,
    }));
  return {
    ...base, title: "Detail Absensi per Sesi", filename: `detail-absensi_${fileBase}`,
    columns: [
      { key: "no", label: "No", align: "right", width: 6 }, { key: "tanggal", label: "Tanggal" }, { key: "sesi", label: "Sesi" },
      { key: "nama", label: "Nama pemain" }, { key: "status", label: "Status" }, { key: "catatan", label: "Catatan" }, { key: "oleh", label: "Dicatat oleh" },
    ],
    rows,
    summary: [{ label: "Jumlah catatan", value: String(rows.length) }],
  };
}
