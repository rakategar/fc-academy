# UNESA FC Academy — Dashboard Manajemen Klub

Dashboard PWA untuk absensi latihan, input performa, skor pemain, dan laporan PDF/Excel.

## Stack
Next.js 16 (App Router) · Tailwind CSS 4 · Supabase (Postgres) · Clerk (login Google pemain) · Recharts + Motion · jsPDF · ExcelJS

## Peran
- **Coach** — `/coach/login`, username & password (tabel `coaches`, bcrypt + cookie JWT).
- **Pemain** — `/login` & `/daftar` lewat Clerk (Google). Setelah daftar, isi data diri lalu menunggu verifikasi coach.

## Menjalankan lokal
```bash
cp .env.example .env.local   # isi semua nilai
npm install
npm run dev
```

## Database
- Skema: `supabase/migrations/*.sql`
- Data demo: `supabase/seed_demo.sql` · hapus: `supabase/clear_demo.sql`
- Bobot skor & ambang seleksi: `lib/scoring.ts` (default 40% kehadiran + 60% performa)

Semua akses database lewat server memakai secret key; RLS aktif tanpa policy publik.
