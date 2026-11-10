import { AppShell } from "@/components/shell/AppShell";
import { requireCoach } from "@/lib/auth/coach";
import { countPending } from "@/lib/data";
import { logoutCoach } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const coach = await requireCoach();
  const pending = await countPending();
  return (
    <AppShell role="coach" user={{ name: coach.name, subtitle: "Pengelola / Pelatih" }} pending={pending} logoutAction={logoutCoach}>
      {children}
    </AppShell>
  );
}
