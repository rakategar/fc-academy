import { AnalisisView } from "@/components/views/AnalisisView";
import { requireStaff } from "@/lib/scope";

export const metadata = { title: "Analisis Nilai" };

export default async function Page({ searchParams }: { searchParams: Promise<{ periode?: string; kelompok?: string; posisi?: string; pemain?: string }> }) {
  const [scope, sp] = await Promise.all([requireStaff("admin"), searchParams]);
  return <AnalisisView scope={scope} sp={sp} />;
}
