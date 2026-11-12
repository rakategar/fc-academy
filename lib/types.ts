export type Position = "GK" | "DF" | "MF" | "FW";
export type PlayerStatus = "pending" | "aktif" | "ditolak" | "arsip";
export type CoachStatus = "pending" | "aktif" | "ditolak" | "nonaktif";
export type CoachFocus = "semua" | "kiper";
export type Category = "fisik" | "teknik" | "taktik";
export type AttendanceStatus = "hadir" | "izin" | "sakit" | "alpa";
export type SessionStatus = "terjadwal" | "selesai" | "batal";

export interface AgeGroup { id: number; name: string; min_age: number; max_age: number }

export interface Player {
  id: string;
  clerk_user_id: string | null;
  email: string | null;
  full_name: string;
  birth_date: string;
  position: Position;
  team: string;
  age_group_id: number | null;
  jersey_no: number | null;
  phone: string | null;
  status: PlayerStatus;
  is_candidate: boolean;
  reject_reason: string | null;
  created_at: string;
}

export interface Coach {
  id: string;
  clerk_user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: CoachStatus;
  reject_reason: string | null;
  age_group_ids: number[];
  focus: CoachFocus;
  is_demo: boolean;
  created_at: string;
}

export interface CoachPlayer { coach_id: string; player_id: string; source: "aturan" | "manual"; excluded: boolean }

export interface Season { id: number; name: string; start_date: string; end_date: string; is_active: boolean }

export interface AssessmentItem {
  id: number;
  category: Category;
  name: string;
  test_hint: string | null;
  applies_to: "semua" | "lapangan" | "kiper";
  sort: number;
  active: boolean;
}

export interface Assessment {
  id: string;
  player_id: string;
  coach_id: string | null;
  session_id: string | null;
  assessed_on: string;
  fisik: number;
  teknik: number;
  taktik: number;
  overall: number;
  notes: string | null;
  created_at: string;
}

export interface AssessmentMonth { month: string; fisik: number; teknik: number; taktik: number; overall: number; n: number }
export interface ItemAvg { item_id: number; avg_score: number; n: number }

export interface TrainingSession {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  kind: string;
  focus: string | null;
  age_group_id: number | null;
  location: string;
  coach_id: string | null;
  gk_only: boolean;
  status: SessionStatus;
}

export interface Attendance {
  id: string;
  session_id: string;
  player_id: string;
  status: AttendanceStatus;
  note: string | null;
  recorded_by: string;
  updated_at: string;
}

export interface PlayerStat {
  player_id: string;
  sessions_total: number;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  attendance_pct: number | null;
  attendance_score: number | null;
  /** rata-rata penilaian skala 1–10 */
  perf_avg: number | null;
  fisik: number | null;
  teknik: number | null;
  taktik: number | null;
  n_assess: number;
  perf_first: number | null;
  perf_last: number | null;
  /** 0–100 */
  total_score: number | null;
}

export interface SessionAgg {
  session_id: string;
  session_date: string;
  kind: string;
  start_time: string;
  end_time: string;
  status: SessionStatus;
  age_group_id: number | null;
  gk_only: boolean;
  coach_id: string | null;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  total: number;
}

export const POSITIONS: { value: Position; label: string }[] = [
  { value: "GK", label: "Penjaga gawang (GK)" },
  { value: "DF", label: "Bek (DF)" },
  { value: "MF", label: "Gelandang (MF)" },
  { value: "FW", label: "Penyerang (FW)" },
];

export const SESSION_KINDS = ["Latihan Rutin", "Latihan Teknik", "Latihan Fisik", "Game Internal", "Uji Tanding"];

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpa: "Tanpa keterangan",
};

export const CATEGORIES: { key: Category; label: string; color: string }[] = [
  { key: "fisik", label: "Fisik", color: "var(--viz-2)" },
  { key: "teknik", label: "Teknik", color: "var(--viz-1)" },
  { key: "taktik", label: "Taktik", color: "var(--viz-3)" },
];

export const FOCUS_LABEL: Record<CoachFocus, string> = { semua: "Semua posisi", kiper: "Khusus kiper" };

/** Item tes yang berlaku untuk posisi pemain. */
export function itemsFor(items: AssessmentItem[], position: Position) {
  return items.filter((i) => i.active && (i.applies_to === "semua" || (i.applies_to === "kiper") === (position === "GK")));
}
