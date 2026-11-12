import { AppShell } from "@/components/shell/AppShell";
import { requireActivePlayer } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const player = await requireActivePlayer();
  return (
    <AppShell role="pemain" user={{ name: player.full_name, subtitle: `Pemain · ${player.position}` }}>
      {children}
    </AppShell>
  );
}
