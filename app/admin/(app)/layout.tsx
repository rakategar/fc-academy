import { AppShell } from "@/components/shell/AppShell";
import { requireAdmin } from "@/lib/auth/admin";
import { countPending } from "@/lib/data";
import { logoutAdmin } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const pending = await countPending();
  return (
    <AppShell role="admin" user={{ name: admin.name, subtitle: "Admin akademi" }} pending={pending.players + pending.coaches} logoutAction={logoutAdmin}>
      {children}
    </AppShell>
  );
}
