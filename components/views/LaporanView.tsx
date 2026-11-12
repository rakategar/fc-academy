import { FileText } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { getAgeGroups, getPeriod, getPlayers } from "@/lib/data";
import { addDays, todayISO } from "@/lib/format";
import type { Scope } from "@/lib/scope";
import { ReportBuilder } from "./ReportBuilder";

export async function LaporanView({ scope }: { scope: Scope }) {
  const [groupsAll, players, season] = await Promise.all([getAgeGroups(), getPlayers({ status: "aktif", ids: scope.ids }), getPeriod("musim")]);
  const groups = scope.role === "admin" ? groupsAll : groupsAll.filter((g) => players.some((p) => p.age_group_id === g.id));
  const today = todayISO();
  const monthStart = today.slice(0, 8) + "01";
  const prevMonthEnd = addDays(monthStart, -1);
  const prevMonthStart = prevMonthEnd.slice(0, 8) + "01";
  return (
    <>
      <PageHeader icon={FileText} title="Laporan" subtitle={`Ekspor rekap ${scope.role === "coach" ? "skuadmu " : ""}ke PDF (siap cetak, ber-kop akademi) atau Excel (bisa diolah lagi).`} />
      <Panel>
        <ReportBuilder
          role={scope.role}
          groups={groups.map((g) => ({ id: g.id, name: g.name }))}
          defaults={{
            from: prevMonthStart,
            to: prevMonthEnd,
            presets: [
              { label: "Bulan ini", from: monthStart, to: today },
              { label: "Bulan lalu", from: prevMonthStart, to: prevMonthEnd },
              { label: "30 hari", from: addDays(today, -29), to: today },
              { label: season.label, from: season.from, to: season.to },
            ],
          }}
        />
      </Panel>
    </>
  );
}
