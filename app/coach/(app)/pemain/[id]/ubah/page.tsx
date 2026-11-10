import { notFound } from "next/navigation";
import { UserCog } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { getAgeGroups, getPlayer } from "@/lib/data";
import { PlayerForm } from "../../PlayerForm";

export const metadata = { title: "Ubah Data Pemain" };

export default async function EditPlayer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [player, groups] = await Promise.all([getPlayer(id), getAgeGroups()]);
  if (!player) notFound();
  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader icon={UserCog} title={`Ubah data ${player.full_name}`} />
      <Panel><PlayerForm player={player} groups={groups} /></Panel>
    </div>
  );
}
