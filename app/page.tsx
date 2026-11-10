import Link from "next/link";
import { ArrowRight, ClipboardCheck, ShieldCheck, Trophy } from "lucide-react";
import { getCoach } from "@/lib/auth/coach";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export default async function Home() {
  const coach = await getCoach();
  return (
    <div className="min-h-dvh bg-nav text-white">
      <div className="relative mx-auto flex min-h-dvh max-w-[1100px] flex-col px-5 pt-8 pb-10 lg:px-8">
        <header className="flex items-center gap-3">
          <img src="/brand/logo-96.png" alt="" className="h-11 w-11" />
          <p className="text-[17px] leading-5 font-extrabold">UNESA FC<br /><span className="text-xs tracking-[0.2em] text-gold">ACADEMY</span></p>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <p className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-gold">Dashboard Manajemen Klub</p>
            <h1 className="text-[32px] leading-[38px] font-bold tracking-tight lg:text-[44px] lg:leading-[52px]">
              Absensi, performa, dan perkembangan pemain dalam satu tempat.
            </h1>
            <p className="mt-4 max-w-[52ch] text-[15px] text-nav-ink">
              Coach mencatat kehadiran dan menilai performa di lapangan. Pemain memantau riwayat dan skornya sendiri.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link href={coach ? "/coach" : "/coach/login"} className="group flex items-center gap-3 rounded-[10px] bg-white p-4 text-ink transition hover:-translate-y-0.5">
                <span className="grid h-11 w-11 place-items-center rounded-[8px] bg-gold-soft text-gold-ink"><ShieldCheck size={22} /></span>
                <span className="flex-1">
                  <span className="block font-semibold">{coach ? "Lanjut ke dashboard" : "Masuk sebagai Coach"}</span>
                  <span className="caption">Username & password</span>
                </span>
                <ArrowRight size={18} className="text-ink-faint transition group-hover:translate-x-0.5" />
              </Link>
              <Link href="/login" className="group flex items-center gap-3 rounded-[10px] bg-accent p-4 transition hover:-translate-y-0.5">
                <span className="grid h-11 w-11 place-items-center rounded-[8px] bg-white/15"><Trophy size={22} /></span>
                <span className="flex-1">
                  <span className="block font-semibold">Masuk sebagai Pemain</span>
                  <span className="text-xs text-white/80">Pakai akun Google</span>
                </span>
                <ArrowRight size={18} className="text-white/70 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
            <p className="mt-4 text-sm text-nav-ink">
              Pemain baru? <Link href="/daftar" className="font-semibold text-gold underline-offset-4 hover:underline">Daftar di sini</Link>
            </p>
            <InstallPrompt className="mt-6 text-ink" />
          </div>

          <div className="order-1 flex justify-center lg:order-2">
            <div className="relative">
              <div className="absolute inset-0 -z-0 scale-90 rounded-full bg-accent/25 blur-3xl" aria-hidden />
              <img src="/brand/logo-256.png" alt="Logo UNESA FC Academy" className="relative h-44 w-auto lg:h-72" />
            </div>
          </div>
        </div>

        <ul className="grid gap-3 text-sm text-nav-ink sm:grid-cols-3">
          {[
            { icon: ClipboardCheck, t: "Absensi cepat di lapangan", d: "Hadir, izin, sakit, atau tanpa keterangan dalam sekali ketuk." },
            { icon: Trophy, t: "Skor tiap pemain", d: "Akumulasi kehadiran dan penilaian performa coach." },
            { icon: ShieldCheck, t: "Laporan siap kirim", d: "Ekspor rekap ke PDF atau Excel." },
          ].map(({ icon: Icon, t, d }) => (
            <li key={t} className="flex gap-3 rounded-[10px] border border-white/10 p-4">
              <Icon size={20} className="mt-0.5 shrink-0 text-gold" />
              <span><span className="block font-semibold text-white">{t}</span>{d}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
