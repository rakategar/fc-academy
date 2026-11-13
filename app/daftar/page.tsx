import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RoleConflict } from "@/components/auth/RoleConflict";
import { getAccount, homeFor } from "@/lib/auth/roles";
import { getAgeGroups } from "@/lib/data";
import { RegisterForm } from "./RegisterForm";

export const metadata = { title: "Daftar Pemain" };
export const dynamic = "force-dynamic";

export default async function PlayerRegister() {
  const account = await getAccount();
  if (!account.userId) redirect("/");
  const resubmit = account.kind === "player" && account.player.status === "ditolak";
  if (account.kind === "player" && !resubmit) redirect(homeFor(account));
  const [user, groups] = await Promise.all([currentUser(), getAgeGroups()]);
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const p = resubmit ? account.player : null;

  return (
    <AuthLayout rail="accent" badge="Langkah 2 dari 3" title={resubmit ? "Perbaiki data pendaftaran" : "Lengkapi data diri"} subtitle="Data ini dipakai admin untuk menempatkanmu di kelompok usia dan skuad coach.">
      {account.kind === "coach" ? (
        <RoleConflict registeredAs="coach" email={account.coach.email} here="pemain" />
      ) : (
        <>
          <h2 className="h1 mb-1">Data diri pemain</h2>
          <p className="mb-6 text-sm text-ink-muted">Masuk sebagai {user?.primaryEmailAddress?.emailAddress}</p>
          <RegisterForm
            defaultName={p?.full_name ?? name}
            groups={groups}
            initial={p ? { birth_date: p.birth_date, position: p.position, team: p.team, phone: p.phone ?? "", jersey_no: p.jersey_no ? String(p.jersey_no) : "" } : undefined}
          />
          <p className="mt-6 text-center text-sm text-ink-muted">Kamu pelatih? <Link href="/coach/daftar" className="font-semibold text-accent">Daftar sebagai coach</Link></p>
        </>
      )}
    </AuthLayout>
  );
}
