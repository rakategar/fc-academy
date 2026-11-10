"use server";
import { requireCoach } from "@/lib/auth/coach";
import { getAgeGroups, getAttendanceRange, getPlayerStats, getPlayers, getReviews } from "@/lib/data";
import { fmtDate, fmtDateTime, fmtNum, fmtPct } from "@/lib/format";
import { BAND_LABEL, SCORE_WEIGHTS, scoreBand } from "@/lib/scoring";
import { ATTENDANCE_LABEL } from "@/lib/types";
import type { Report } from "@/lib/export/types";

export type ReportKind = "absensi" | "performa" | "skor" | "detail";

export async function buildReport(kind: ReportKind, from: string, to: string, groupId: number | null): Promise<Report | { error: string }> {
  const coach = await requireCoach();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) return { error: "Rentang tanggal tidak valid." };
  const [players, groups, stats] = await Promise.all([getPlayers({ status: ["aktif", "arsip"] }), getAgeGroups(), getPlayerStats(from, to)]);
  const gName = new Map(groups.map((g) => [g.id, g.name]));
  const scope = players.filter((p) => groupId === null || p.age_group_id === groupId);
  const ids = new Set(scope.map((p) => p.id));
  const sMap = new Map(stats.map((s) => [s.player_id, s]));
  const groupLabel = groupId ? gName.get(groupId) ?? "" : "Semua kelompok";
  const base = {
    subtitle: `Periode ${fmtDate(from)} – ${fmtDate(to)} · ${groupLabel}`,
    generatedAt: fmtDateTime(new Date().toISOString()),
    generatedBy: coach.name,
  };
  const fileBase = `${from}_sd_${to}${groupId ? "_" + gName.get(groupId) : ""}`;
  const active = scope.filter((p) => p.status === "aktif").sort((a, b) => a.full_name.localeCompare(b.full_name));
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

  if (kind === "performa") {
    const reviews = (await getReviews({ from, to })).filter((r) => ids.has(r.player_id));
    const by = new Map<string, typeof reviews>();
    reviews.forEach((r) => by.set(r.player_id, [...(by.get(r.player_id) ?? []), r]));
    const avg = (xs: number[]) => (xs.length ? fmtNum(xs.reduce((a, b) => a + b, 0) / xs.length) : "—");
    const rows = active.map((p, i) => {
      const rs = by.get(p.id) ?? [];
      return {
        no: i + 1, nama: p.full_name, posisi: p.position, kelompok: g(p.age_group_id), n: rs.length,
        teknik: avg(rs.map((r) => r.teknik)), fisik: avg(rs.map((r) => r.fisik)), taktik: avg(rs.map((r) => r.taktik)),
        mental: avg(rs.map((r) => r.mental)), disiplin: avg(rs.map((r) => r.disiplin)), rata: avg(rs.map((r) => r.overall)),
      };
    });
    return {
      ...base, title: "Rekap Performa Pemain", filename: `rekap-performa_${fileBase}`,
      columns: [
        { key: "no", label: "No", align: "right", width: 5 }, { key: "nama", label: "Nama pemain" }, { key: "posisi", label: "Posisi", align: "center" },
        { key: "kelompok", label: "Kelompok" }, { key: "n", label: "Penilaian", align: "right" }, { key: "teknik", label: "Teknik", align: "right" },
        { key: "fisik", label: "Fisik", align: "right" }, { key: "taktik", label: "Taktik", align: "right" }, { key: "mental", label: "Mental", align: "right" },
        { key: "disiplin", label: "Disiplin", align: "right" }, { key: "rata", label: "Rata-rata", align: "right" },
      ],
      rows,
      summary: [
        { label: "Jumlah penilaian", value: String(reviews.length) },
        { label: "Rata-rata tim", value: avg(reviews.map((r) => r.overall)) },
      ],
    };
  }

  if (kind === "skor") {
    const ranked = active.map((p) => ({ p, s: sMap.get(p.id) })).sort((a, b) => (b.s?.total_score ?? -1) - (a.s?.total_score ?? -1));
    const rows = ranked.map(({ p, s }, i) => {
      const band = scoreBand(s?.total_score);
      return {
        no: i + 1, nama: p.full_name, posisi: p.position, kelompok: g(p.age_group_id), hadir: fmtPct(s?.attendance_pct),
        skor_hadir: fmtNum(s?.attendance_score), performa: fmtNum(s?.perf_avg), skor: fmtNum(s?.total_score), kategori: band ? BAND_LABEL[band] : "—",
      };
    });
    return {
      ...base, title: "Skor & Peringkat Pemain", filename: `skor-pemain_${fileBase}`,
      columns: [
        { key: "no", label: "Peringkat", align: "right", width: 10 }, { key: "nama", label: "Nama pemain" }, { key: "posisi", label: "Posisi", align: "center" },
        { key: "kelompok", label: "Kelompok" }, { key: "hadir", label: "% Hadir", align: "right" }, { key: "skor_hadir", label: "Skor hadir", align: "right" },
        { key: "performa", label: "Performa", align: "right" }, { key: "skor", label: "Skor total", align: "right" }, { key: "kategori", label: "Kategori" },
      ],
      rows,
      summary: [
        { label: "Bobot skor", value: `${SCORE_WEIGHTS.attendance * 100}% hadir + ${SCORE_WEIGHTS.performance * 100}% performa` },
        { label: "Pemain dinilai", value: String(rows.filter((r) => r.skor !== "—").length) },
      ],
    };
  }

  const att = (await getAttendanceRange(from, to)).filter((a) => ids.has(a.player_id));
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
