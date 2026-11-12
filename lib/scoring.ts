/** Bobot skor pemain. Ubah di sini bila klub ingin komposisi lain. */
export const SCORE_WEIGHTS = { attendance: 0.4, performance: 0.6 } as const;

/** Nilai tiap status absensi untuk skor kehadiran (0–1). */
export const ATTENDANCE_POINTS = { hadir: 1, izin: 0.5, sakit: 0.5, alpa: 0 } as const;

export type ScoreBand = "unggul" | "baik" | "cukup" | "perhatian";

export function scoreBand(score: number | null | undefined): ScoreBand | null {
  if (score === null || score === undefined) return null;
  if (score >= 85) return "unggul";
  if (score >= 75) return "baik";
  if (score >= 65) return "cukup";
  return "perhatian";
}

/** Pita untuk nilai penilaian skala 1–10. */
export function valueBand(v: number | null | undefined): ScoreBand | null {
  return v === null || v === undefined ? null : scoreBand(v * 10);
}

/** Kelas warna untuk angka nilai 1–10. */
export function valueTone(v: number | null | undefined): string {
  const b = valueBand(v);
  return b === "unggul" ? "text-hadir-ink bg-hadir-bg" : b === "baik" ? "text-izin-ink bg-izin-bg" : b === "cukup" ? "text-sakit-ink bg-sakit-bg" : b ? "text-alpa-ink bg-alpa-bg" : "bg-sunken text-ink-muted";
}

export const BAND_LABEL: Record<ScoreBand, string> = {
  unggul: "Unggul",
  baik: "Baik",
  cukup: "Cukup",
  perhatian: "Perlu perhatian",
};

/** Ambang minimal kehadiran untuk kandidat turnamen (persen). */
export const SELECTION_MIN_ATTENDANCE = 75;

/** Domain sumbu Y untuk grafik nilai 1–10. */
export function valueDomain(values: number[]): [number, number] {
  if (!values.length) return [0, 10];
  return [Math.max(0, Math.floor(Math.min(...values) - 1)), Math.min(10, Math.ceil(Math.max(...values) + 0.5))];
}
