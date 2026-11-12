import { PlayerDetailView } from "@/components/views/PlayerDetailView";
import { requireStaff } from "@/lib/scope";

export const metadata = { title: "Detail Pemain" };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ periode?: string }> }) {
  const [scope, { id }, sp] = await Promise.all([requireStaff("coach"), params, searchParams]);
  return <PlayerDetailView scope={scope} id={id} periode={sp.periode} />;
}
