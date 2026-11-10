import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { getCoach } from "@/lib/auth/coach";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Masuk Coach" };

export default async function CoachLogin() {
  if (await getCoach()) redirect("/coach");
  return (
    <AuthLayout badge="Area Coach" title="Masuk untuk mengelola tim" subtitle="Catat absensi, nilai performa, dan pantau perkembangan pemain UNESA FC Academy.">
      <h2 className="h1 mb-1">Masuk Coach</h2>
      <p className="mb-6 text-sm text-ink-muted">Gunakan akun yang diberikan pengelola akademi.</p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-ink-muted">
        Kamu pemain? <Link href="/login" className="font-semibold text-accent">Masuk dengan Google</Link>
      </p>
    </AuthLayout>
  );
}
