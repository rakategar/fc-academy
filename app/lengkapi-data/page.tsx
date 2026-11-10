import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { getPlayerForUser } from "@/lib/auth/player";
import { getAgeGroups } from "@/lib/data";
import { RegisterForm } from "./RegisterForm";

export const metadata = { title: "Lengkapi Data Diri" };

export default async function CompleteProfile() {
  const { userId, player } = await getPlayerForUser();
  if (!userId) redirect("/login");
  if (player) redirect(player.status === "aktif" ? "/pemain" : "/menunggu");
  const [user, groups] = await Promise.all([currentUser(), getAgeGroups()]);
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return (
    <AuthLayout badge="Langkah 2 dari 3" title="Lengkapi data diri" subtitle="Data ini dipakai coach untuk menempatkanmu di kelompok usia dan mencatat absensi.">
      <h2 className="h1 mb-1">Data diri pemain</h2>
      <p className="mb-6 text-sm text-ink-muted">Masuk sebagai {user?.primaryEmailAddress?.emailAddress}</p>
      <RegisterForm defaultName={name} groups={groups} />
    </AuthLayout>
  );
}
