import { Activity } from "lucide-react";
import { PageHeader } from "@/components/ui/Panel";
import { PeriodTabs } from "@/components/ui/PeriodTabs";
import { PlayerOverview } from "@/components/player/PlayerOverview";
import { requireActivePlayer } from "@/lib/auth/roles";
import { getPeriod } from "@/lib/data";

export const metadata = { title: "Nilai & Peringkat" };

export default async function PlayerPerformance({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  const sp = await searchParams;
  const player = await requireActivePlayer();
  const period = await getPeriod(sp.periode, "musim");
  return (
    <>
      <PageHeader icon={Activity} title="Nilai & peringkat" subtitle="Nilai coach 1–10 untuk fisik, teknik, dan taktik, grafik peningkatan, serta peringkatmu di kelompok usia." actions={<PeriodTabs current={period.key} basePath="/pemain/performa" />} />
      <PlayerOverview playerId={player.id} from={period.from} to={period.to} periodLabel={period.label} self show={["summary", "charts", "items", "reviews"]} />
    </>
  );
}
