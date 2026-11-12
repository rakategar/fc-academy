import { PeringkatView } from "@/components/views/PeringkatView";
import { requireStaff } from "@/lib/scope";

export const metadata = { title: "Peringkat Pemain" };

export default async function Page({ searchParams }: { searchParams: Promise<{ periode?: string; kelompok?: string; posisi?: string; urut?: string; min?: string }> }) {
  const [scope, sp] = await Promise.all([requireStaff("admin"), searchParams]);
  return <PeringkatView scope={scope} sp={sp} />;
}
