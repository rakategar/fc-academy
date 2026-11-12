import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { getAdmin } from "@/lib/auth/admin";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Masuk Admin" };
export const dynamic = "force-dynamic";

export default async function AdminLogin() {
  if (await getAdmin()) redirect("/admin/dashboard");
  return (
    <AuthLayout rail="sky" badge="Area Admin" title="Kelola akademi" subtitle="Validasi coach & pemain, atur skuad, musim, kriteria penilaian, dan pantau seluruh klub.">
      <h2 className="h1 mb-1">Masuk Admin</h2>
      <p className="mb-6 text-sm text-ink-muted">Gunakan akun admin akademi.</p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-ink-muted">
        <Link href="/coach" className="font-semibold text-accent">Masuk coach</Link>
        <span className="mx-2 text-ink-faint">·</span>
        <Link href="/" className="font-semibold text-accent">Masuk pemain</Link>
      </p>
    </AuthLayout>
  );
}
