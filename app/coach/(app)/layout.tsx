import { AppShell } from "@/components/shell/AppShell";
import { requireActiveCoach } from "@/lib/auth/roles";
import { getAgeGroups } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const coach = await requireActiveCoach();
  const groups = await getAgeGroups();
  const squad = coach.focus === "kiper" ? "Coach kiper" : `Coach ${groups.filter((g) => coach.age_group_ids.includes(g.id)).map((g) => g.name).join(", ") || "—"}`;
  return (
    <AppShell role="coach" user={{ name: coach.full_name, subtitle: squad }}>
      {children}
    </AppShell>
  );
}
