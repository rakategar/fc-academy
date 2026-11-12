import { RekapView } from "@/components/views/RekapView";
import { requireStaff } from "@/lib/scope";

export const metadata = { title: "Rekap & Monitoring" };

export default async function Page({ searchParams }: { searchParams: Promise<{ periode?: string; kelompok?: string }> }) {
  const [scope, sp] = await Promise.all([requireStaff("coach"), searchParams]);
  return <RekapView scope={scope} sp={sp} />;
}
