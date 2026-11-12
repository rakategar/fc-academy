import { LaporanView } from "@/components/views/LaporanView";
import { requireStaff } from "@/lib/scope";

export const metadata = { title: "Laporan" };

export default async function Page() {
  return <LaporanView scope={await requireStaff("admin")} />;
}
