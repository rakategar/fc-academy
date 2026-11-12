import type { AttendanceStatus, CoachStatus, PlayerStatus } from "@/lib/types";
import { ATTENDANCE_LABEL } from "@/lib/types";
import { BAND_LABEL, scoreBand, valueBand } from "@/lib/scoring";

type Tone = "hadir" | "izin" | "sakit" | "alpa" | "brand" | "gold" | "neutral";

const tones: Record<Tone, { wrap: string; dot: string }> = {
  hadir: { wrap: "bg-hadir-bg text-hadir-ink", dot: "bg-hadir" },
  izin: { wrap: "bg-izin-bg text-izin-ink", dot: "bg-izin" },
  sakit: { wrap: "bg-sakit-bg text-sakit-ink", dot: "bg-sakit" },
  alpa: { wrap: "bg-alpa-bg text-alpa-ink", dot: "bg-alpa" },
  brand: { wrap: "bg-brand-soft text-brand", dot: "bg-brand" },
  gold: { wrap: "bg-gold-soft text-gold-ink", dot: "bg-gold" },
  neutral: { wrap: "bg-sunken text-ink-muted", dot: "bg-ink-faint" },
};

/** Lencana pil bertitik — warna selalu disertai teks. */
export function Badge({ tone = "neutral", children, dot = true, className = "" }: { tone?: Tone; children: React.ReactNode; dot?: boolean; className?: string }) {
  const t = tones[tone];
  return (
    <span className={`inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-xs font-medium whitespace-nowrap ${t.wrap} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} aria-hidden />}
      {children}
    </span>
  );
}

export function AttendanceBadge({ status, short = false }: { status: AttendanceStatus; short?: boolean }) {
  const label = short && status === "alpa" ? "Alpa" : ATTENDANCE_LABEL[status];
  return <Badge tone={status}>{label}</Badge>;
}

export function PlayerStatusBadge({ status }: { status: PlayerStatus }) {
  if (status === "aktif") return <Badge tone="hadir">Aktif</Badge>;
  if (status === "pending") return <Badge tone="gold">Menunggu verifikasi</Badge>;
  if (status === "ditolak") return <Badge tone="alpa">Ditolak</Badge>;
  return <Badge tone="neutral">Diarsipkan</Badge>;
}

export function CoachStatusBadge({ status }: { status: CoachStatus }) {
  if (status === "aktif") return <Badge tone="hadir">Aktif</Badge>;
  if (status === "pending") return <Badge tone="gold">Menunggu verifikasi</Badge>;
  if (status === "ditolak") return <Badge tone="alpa">Ditolak</Badge>;
  return <Badge tone="neutral">Nonaktif</Badge>;
}

/** Lencana untuk nilai penilaian skala 1–10. */
export function ValueBadge({ value }: { value: number | null | undefined }) {
  const band = valueBand(value);
  if (!band) return <Badge tone="neutral">Belum dinilai</Badge>;
  const tone: Tone = band === "unggul" ? "hadir" : band === "baik" ? "izin" : band === "cukup" ? "sakit" : "alpa";
  return <Badge tone={tone}>{BAND_LABEL[band]}</Badge>;
}

export function SourceBadge({ source }: { source: "aturan" | "manual" }) {
  return source === "manual" ? <Badge tone="gold">Manual</Badge> : <Badge tone="brand">Otomatis</Badge>;
}

export function ScoreBadge({ score }: { score: number | null | undefined }) {
  const band = scoreBand(score);
  if (!band) return <Badge tone="neutral">Belum ada data</Badge>;
  const tone: Tone = band === "unggul" ? "hadir" : band === "baik" ? "izin" : band === "cukup" ? "sakit" : "alpa";
  return <Badge tone={tone}>{BAND_LABEL[band]}</Badge>;
}

export function PositionTag({ position }: { position: string }) {
  return (
    <span className="inline-flex h-[22px] min-w-[34px] items-center justify-center rounded-[4px] bg-brand-soft px-1.5 text-[11px] font-bold tracking-wide text-brand">
      {position}
    </span>
  );
}
