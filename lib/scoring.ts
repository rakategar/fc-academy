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

export const BAND_LABEL: Record<ScoreBand, string> = {
  unggul: "Unggul",
  baik: "Baik",
  cukup: "Cukup",
  perhatian: "Perlu perhatian",
};

/** Ambang minimal kehadiran untuk seleksi turnamen (persen). */
export const SELECTION_MIN_ATTENDANCE = 75;
