# UNESA FC Academy — Dashboard Manajemen Klub

Dashboard PWA untuk absensi latihan, input performa, skor pemain, dan laporan PDF/Excel.

## Stack
Next.js 16 (App Router) · Tailwind CSS 4 · Supabase (Postgres) · Clerk (login Google pemain) · Recharts + Motion · jsPDF · ExcelJS

## Peran & halaman login
| Peran | Login | Cara masuk |
|---|---|---|
| **Admin** | `/admin` | username & password (tabel `admins`, bcrypt + cookie JWT `ufa_admin`) |
| **Coach** | `/coach` | Google (Clerk) → isi data & kelompok usia → divalidasi admin |
| **Pemain** | `/` | Google (Clerk) → isi data diri → divalidasi admin |

- Satu akun Google hanya boleh satu peran (dicek di server + trigger DB).
- **Skuad coach** = aturan (kelompok usia + fokus semua posisi/kiper) + penugasan manual admin (`coach_players`). Coach hanya melihat & mengubah data skuadnya.
- **Musim** diatur admin (tabel `seasons`); “Musim ini” di semua halaman memakai musim aktif.
- **Penilaian 1–10**: checklist tes Fisik/Teknik/Taktik (`assessment_items`, item khusus kiper), dikelola admin di Pengaturan.

## Menjalankan lokal
```bash
cp .env.example .env.local   # isi semua nilai
npm install
npm run dev
```

## Database
- Skema: `supabase/migrations/*.sql`
- Data demo: `supabase/seed_demo.sql` · hapus: `supabase/clear_demo.sql`
- Bobot skor: `lib/scoring.ts` (default 40% kehadiran + 60% nilai coach ×10)

Semua akses database lewat server memakai secret key; RLS aktif tanpa policy publik.
