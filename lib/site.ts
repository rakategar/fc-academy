/** URL publik situs. Pakai NEXT_PUBLIC_SITE_URL jika ada, lalu domain produksi Vercel (otomatis). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE_NAME = "UNESA FC Academy";
export const SITE_DESCRIPTION =
  "Portal resmi UNESA FC Academy, akademi sepak bola usia muda di Surabaya: absensi latihan, penilaian fisik, teknik & taktik, peringkat pemain, dan laporan perkembangan untuk pemain, coach, dan admin.";
