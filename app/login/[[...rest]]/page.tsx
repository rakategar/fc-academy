import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";

export const metadata = { title: "Masuk Pemain" };

export default function PlayerLogin() {
  return (
    <AuthLayout badge="Area Pemain" title="Pantau kehadiran dan skor kamu" subtitle="Masuk dengan akun Google yang kamu pakai saat mendaftar.">
      <div className="flex justify-center">
        <SignIn routing="path" path="/login" signUpUrl="/daftar" forceRedirectUrl="/pemain" />
      </div>
      <p className="mt-6 text-center text-sm text-ink-muted">
        Coach? <Link href="/coach/login" className="font-semibold text-accent">Masuk dengan username</Link>
      </p>
    </AuthLayout>
  );
}
