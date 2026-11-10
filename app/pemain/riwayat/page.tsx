import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/Panel";
import { PeriodTabs } from "@/components/ui/PeriodTabs";
import { PlayerOverview } from "@/components/player/PlayerOverview";
import { requireActivePlayer } from "@/lib/auth/player";
import { periodRange } from "@/lib/format";

export const metadata = { title: "Riwayat Absensi" };

export default async function PlayerHistory({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  const sp = await searchParams;
  const player = await requireActivePlayer();
  const period = periodRange(sp.periode ?? "musim");
  return (
    <>
      <PageHeader icon={ClipboardCheck} title="Riwayat absensi" subtitle="Catatan kehadiranmu di setiap sesi latihan." actions={<PeriodTabs current={period.key} basePath="/pemain/riwayat" />} />
      <PlayerOverview playerId={player.id} from={period.from} to={period.to} periodLabel={period.label} self show={["pattern", "history"]} />
    </>
  );
}
