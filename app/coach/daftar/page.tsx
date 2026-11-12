import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RoleConflict } from "@/components/auth/RoleConflict";
import { getAccount } from "@/lib/auth/roles";
import { getAgeGroups } from "@/lib/data";
import { CoachRegisterForm } from "./CoachRegisterForm";

export const metadata = { title: "Daftar Coach" };
export const dynamic = "force-dynamic";

export default async function CoachRegister() {
  const account = await getAccount();
  if (!account.userId) redirect("/coach");
  const resubmit = account.kind === "coach" && account.coach.status === "ditolak";
  if (account.kind === "coach" && !resubmit) redirect("/coach/masuk");
  const [user, groups] = await Promise.all([currentUser(), getAgeGroups()]);
  const c = resubmit ? account.coach : null;

  return (
    <AuthLayout badge="Pendaftaran coach" title={resubmit ? "Perbaiki data pendaftaran" : "Data coach"} subtitle="Pilih kelompok usia yang kamu pegang. Admin akan memeriksa dan menetapkan skuadmu.">
      {account.kind === "player" ? (
        <RoleConflict registeredAs="pemain" email={account.player.email} here="coach" />
      ) : (
        <>
          <h2 className="h1 mb-1">Daftar sebagai coach</h2>
          <p className="mb-6 text-sm text-ink-muted">Masuk sebagai {user?.primaryEmailAddress?.emailAddress}</p>
          <CoachRegisterForm
            groups={groups.map((g) => ({ id: g.id, name: g.name, range: g.max_age >= 99 ? `${g.min_age}+ th` : g.min_age === 0 ? `≤ ${g.max_age} th` : `${g.min_age}–${g.max_age} th` }))}
            initial={{ full_name: c?.full_name ?? [user?.firstName, user?.lastName].filter(Boolean).join(" "), phone: c?.phone ?? "", groups: c?.age_group_ids ?? [], focus: c?.focus ?? "semua" }}
          />
          <p className="mt-6 text-center text-sm text-ink-muted">Kamu pemain? <Link href="/daftar" className="font-semibold text-accent">Daftar sebagai pemain</Link></p>
        </>
      )}
    </AuthLayout>
  );
}
