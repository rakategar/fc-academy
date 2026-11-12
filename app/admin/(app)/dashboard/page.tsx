import { DashboardView } from "@/components/views/DashboardView";
import { requireStaff } from "@/lib/scope";

export const metadata = { title: "Dashboard" };

export default async function Page({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  const [scope, sp] = await Promise.all([requireStaff("admin"), searchParams]);
  return <DashboardView scope={scope} periode={sp.periode} />;
}
