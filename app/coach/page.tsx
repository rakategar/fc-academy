import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ClipboardCheck, Users } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";
import { RoleConflict } from "@/components/auth/RoleConflict";
import { getAccount } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Masuk Coach" };

/** Halaman login coach (Google). */
export default async function CoachLogin() {
  const account = await getAccount();
  if (account.userId && account.kind !== "player") redirect("/coach/masuk");

  return (
    <AuthLayout
      badge="Area Coach"
      title="Masuk untuk mengelola skuad"
      subtitle="Catat absensi, beri nilai 1–10, dan pantau perkembangan pemain di skuadmu."
      aside={
        <ul className="mt-8 hidden space-y-3 text-sm text-nav-ink lg:block">
          {[
            { icon: ClipboardCheck, t: "Absensi di lapangan", d: "Sekali ketuk per pemain." },
            { icon: Activity, t: "Penilaian 1–10", d: "Checklist tes fisik, teknik, dan taktik." },
            { icon: Users, t: "Skuad sendiri", d: "Hanya pemain yang ditugaskan admin kepadamu." },
          ].map(({ icon: Icon, t, d }) => (
            <li key={t} className="flex gap-3"><Icon size={18} className="mt-0.5 shrink-0 text-gold" /><span><b className="text-white">{t}</b> — {d}</span></li>
          ))}
        </ul>
      }
    >
      {account.userId && account.kind === "player" ? (
        <RoleConflict registeredAs="pemain" email={account.player.email} here="coach" />
      ) : (
        <>
          <h2 className="h1 mb-1">Masuk Coach</h2>
          <p className="mb-5 text-sm text-ink-muted">Pakai akun Google. Coach baru mengisi data singkat lalu divalidasi admin.</p>
          <GoogleSignIn redirectTo="/coach/masuk" />
        </>
      )}
      <p className="mt-6 text-center text-sm text-ink-muted">
        Pemain? <Link href="/" className="font-semibold text-accent">Masuk sebagai pemain</Link>
        <span className="mx-2 text-ink-faint">·</span>
        <Link href="/admin" className="text-ink-muted hover:text-ink">Admin</Link>
      </p>
    </AuthLayout>
  );
}
