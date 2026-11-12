import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardCheck, ShieldCheck, Trophy } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";
import { RoleConflict } from "@/components/auth/RoleConflict";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { getAccount, homeFor } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Masuk Pemain" };

/** Halaman login pemain (Google). Coach masuk di /coach, admin di /admin. */
export default async function PlayerLogin() {
  const account = await getAccount();
  if (account.userId && account.kind === "player") redirect(homeFor(account));
  if (account.userId && account.kind === "none") redirect("/daftar");

  return (
    <AuthLayout
      rail="accent"
      badge="Area Pemain"
      title="Pantau kehadiran, nilai, dan peringkatmu"
      subtitle="Masuk dengan akun Google. Pemain baru langsung lanjut mengisi data diri, lalu diverifikasi admin akademi."
      aside={
        <ul className="mt-8 hidden space-y-3 text-sm text-nav-ink lg:block">
          {[
            { icon: ClipboardCheck, t: "Riwayat absensi", d: "Hadir, izin, sakit, atau tanpa keterangan di tiap sesi." },
            { icon: Trophy, t: "Nilai & peringkat", d: "Penilaian coach 1–10 untuk fisik, teknik, dan taktik." },
            { icon: ShieldCheck, t: "Data aman", d: "Hanya kamu, coach-mu, dan admin yang bisa melihat." },
          ].map(({ icon: Icon, t, d }) => (
            <li key={t} className="flex gap-3"><Icon size={18} className="mt-0.5 shrink-0 text-gold" /><span><b className="text-white">{t}</b> — {d}</span></li>
          ))}
        </ul>
      }
    >
      {account.userId && account.kind === "coach" ? (
        <RoleConflict registeredAs="coach" email={account.coach.email} here="pemain" />
      ) : (
        <>
          <h2 className="h1 mb-1">Masuk Pemain</h2>
          <p className="mb-5 text-sm text-ink-muted">Belum punya akun? Cukup masuk dengan Google — pendaftaran otomatis.</p>
          <GoogleSignIn redirectTo="/pemain" />
        </>
      )}
      <InstallPrompt className="mt-6" />
      <p className="mt-6 text-center text-sm text-ink-muted">
        Pelatih? <Link href="/coach" className="font-semibold text-accent">Masuk sebagai coach</Link>
        <span className="mx-2 text-ink-faint">·</span>
        <Link href="/admin" className="text-ink-muted hover:text-ink">Admin</Link>
      </p>
    </AuthLayout>
  );
}
