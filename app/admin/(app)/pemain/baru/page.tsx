import { UserPlus } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { getAgeGroups } from "@/lib/data";
import { PlayerForm } from "../PlayerForm";

export const metadata = { title: "Tambah Pemain" };

export default async function NewPlayer() {
  const groups = await getAgeGroups();
  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader icon={UserPlus} title="Tambah pemain" subtitle="Pemain yang ditambahkan admin langsung aktif dan otomatis masuk skuad coach sesuai kelompok usia. Akun Google-nya bisa ditautkan saat ia mendaftar." />
      <Panel><PlayerForm groups={groups} /></Panel>
    </div>
  );
}
