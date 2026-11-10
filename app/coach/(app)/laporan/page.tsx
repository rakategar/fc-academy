import { FileText } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { getAgeGroups } from "@/lib/data";
import { addDays, periodRange, todayISO } from "@/lib/format";
import { ReportBuilder } from "./ReportBuilder";

export const metadata = { title: "Laporan" };

export default async function ReportsPage() {
  const groups = await getAgeGroups();
  const today = todayISO();
  const monthStart = today.slice(0, 8) + "01";
  const prevMonthEnd = addDays(monthStart, -1);
  const prevMonthStart = prevMonthEnd.slice(0, 8) + "01";
  const season = periodRange("musim");
  return (
    <>
      <PageHeader icon={FileText} title="Laporan" subtitle="Ekspor rekap ke PDF (siap cetak, ber-kop akademi) atau Excel (bisa diolah lagi)." />
      <Panel>
        <ReportBuilder
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
