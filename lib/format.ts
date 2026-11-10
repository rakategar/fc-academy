const TZ = "Asia/Jakarta";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const MONTHS_LONG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/** Tanggal hari ini di WIB, format YYYY-MM-DD. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function parts(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { y, m, d, dow: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
}

/** 3 Nov 2026 */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
/** 3 Nov */
export function fmtDateShort(iso: string): string {
  const { m, d } = parts(iso);
  return `${d} ${MONTHS[m - 1]}`;
}
export function fmtMonthYear(iso: string): string {
  const { y, m } = parts(iso);
  return `${MONTHS_LONG[m - 1]} ${y}`;
}
export function dayName(iso: string): string {
  return DAYS[parts(iso).dow];
}
export function fmtDateTime(ts: string): string {
  const d = new Date(ts);
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
  const time = new Intl.DateTimeFormat("id-ID", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
  return `${fmtDate(date)}, ${time.replace(".", ":")}`;
}
/** 15:30 – 17:00 */
export function fmtTimeRange(a: string, b: string): string {
  return `${a.slice(0, 5)} – ${b.slice(0, 5)}`;
}

/** Desimal koma: 92,5 */
export function fmtNum(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(n);
}
export function fmtPct(n: number | null | undefined, digits = 1): string {
  return n === null || n === undefined ? "—" : `${fmtNum(n, digits)}%`;
}

export function ageFrom(birthISO: string, onISO = todayISO()): number {
  const b = parts(birthISO);
  const t = parts(onISO);
  let age = t.y - b.y;
  if (t.m < b.m || (t.m === b.m && t.d < b.d)) age--;
  return age;
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}

export type PeriodKey = "7" | "30" | "90" | "musim";
export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "7", label: "7 hari" },
  { key: "30", label: "30 hari" },
  { key: "90", label: "90 hari" },
  { key: "musim", label: "Musim ini" },
];
/** Musim mulai 1 Juli. */
export function periodRange(key: string | undefined): { from: string; to: string; key: PeriodKey; label: string } {
  const to = todayISO();
  const k = (PERIODS.find((p) => p.key === key)?.key ?? "30") as PeriodKey;
  if (k === "musim") {
    const { y, m } = parts(to);
    const startYear = m >= 7 ? y : y - 1;
    return { from: `${startYear}-07-01`, to, key: k, label: `Musim ${startYear}/${startYear + 1}` };
  }
  return { from: addDays(to, -(Number(k) - 1)), to, key: k, label: `${PERIODS.find((p) => p.key === k)!.label} terakhir` };
}
