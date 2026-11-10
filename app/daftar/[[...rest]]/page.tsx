import { SignUp } from "@clerk/nextjs";
import { AuthLayout } from "@/components/auth/AuthLayout";

export const metadata = { title: "Daftar Pemain" };

export default function PlayerSignUp() {
  return (
    <AuthLayout badge="Pendaftaran pemain" title="Bergabung dengan UNESA FC Academy" subtitle="Langkah 1: buat akun dengan Google. Langkah 2: isi data diri. Coach akan memverifikasi pendaftaranmu.">
      <ol className="mb-5 flex items-center gap-2 text-xs font-medium">
        <li className="flex items-center gap-1.5 text-accent"><span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-white">1</span>Akun Google</li>
        <li className="h-px flex-1 bg-line-strong" />
        <li className="flex items-center gap-1.5 text-ink-muted"><span className="grid h-6 w-6 place-items-center rounded-full bg-sunken">2</span>Data diri</li>
        <li className="h-px flex-1 bg-line-strong" />
        <li className="flex items-center gap-1.5 text-ink-muted"><span className="grid h-6 w-6 place-items-center rounded-full bg-sunken">3</span>Verifikasi</li>
      </ol>
      <div className="flex justify-center">
        <SignUp routing="path" path="/daftar" signInUrl="/login" forceRedirectUrl="/lengkapi-data" />
      </div>
    </AuthLayout>
  );
}
