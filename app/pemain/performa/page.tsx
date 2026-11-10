import { Activity } from "lucide-react";
import { PageHeader } from "@/components/ui/Panel";
import { PeriodTabs } from "@/components/ui/PeriodTabs";
import { PlayerOverview } from "@/components/player/PlayerOverview";
import { requireActivePlayer } from "@/lib/auth/player";
import { periodRange } from "@/lib/format";

export const metadata = { title: "Performa Saya" };

export default async function PlayerPerformance({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  const sp = await searchParams;
  const player = await requireActivePlayer();
  const period = periodRange(sp.periode ?? "musim");
  return (
    <>
      <PageHeader icon={Activity} title="Performa saya" subtitle="Penilaian coach untuk teknik, fisik, taktik, mental, dan disiplin." actions={<PeriodTabs current={period.key} basePath="/pemain/performa" />} />
      <PlayerOverview playerId={player.id} from={period.from} to={period.to} periodLabel={period.label} self show={["summary", "charts", "reviews"]} />
    </>
  );
}
