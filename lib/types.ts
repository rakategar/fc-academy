export type Position = "GK" | "DF" | "MF" | "FW";
export type PlayerStatus = "pending" | "aktif" | "arsip";
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
  created_at: string;
}

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

export interface PerformanceReview {
  id: string;
  player_id: string;
  session_id: string | null;
  review_date: string;
  teknik: number;
  fisik: number;
  taktik: number;
  mental: number;
  disiplin: number;
  overall: number;
  notes: string | null;
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
  perf_avg: number | null;
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
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  total: number;
}

export interface PerfWeek {
  week_start: string;
  teknik: number;
  fisik: number;
  taktik: number;
  mental: number;
  disiplin: number;
  overall: number;
  n: number;
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
