import { KeyRound, Layers, Settings, Smartphone, Calculator, CalendarRange, ListChecks } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { requireAdmin } from "@/lib/auth/admin";
import { getAgeGroups, getAssessmentItems, getSeasons } from "@/lib/data";
import { ATTENDANCE_POINTS, SCORE_WEIGHTS, SELECTION_MIN_ATTENDANCE } from "@/lib/scoring";
import { GroupsForm, ItemsForm, PasswordForm, SeasonsForm } from "./SettingsForms";

export const metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const [admin, groups, seasons, items] = await Promise.all([requireAdmin(), getAgeGroups(), getSeasons(), getAssessmentItems(true)]);
  return (
    <>
      <PageHeader icon={Settings} title="Pengaturan" subtitle={`Masuk sebagai ${admin.name} (${admin.username}). Pengaturan berlaku untuk seluruh akademi.`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel icon={CalendarRange} title="Musim" subtitle="Menentukan periode “Musim ini”"><SeasonsForm seasons={seasons} /></Panel>
        <Panel icon={Layers} title="Kelompok usia"><GroupsForm groups={groups} /></Panel>
        <Panel className="lg:col-span-2" icon={ListChecks} title="Kriteria penilaian 1–10" subtitle="Item tes untuk fisik, teknik, dan taktik"><ItemsForm items={items} /></Panel>
        <Panel icon={Calculator} title="Cara skor dihitung">
          <ul className="space-y-2 text-sm">
            <li><b>Skor kehadiran</b> = rata-rata poin tiap sesi: hadir <span className="num">{ATTENDANCE_POINTS.hadir}</span>, izin/sakit <span className="num">{ATTENDANCE_POINTS.izin}</span>, tanpa keterangan <span className="num">{ATTENDANCE_POINTS.alpa}</span> (×100).</li>
            <li><b>Nilai coach</b> = tiap tes diberi poin 1–10. Rata-rata per kategori (fisik, teknik, taktik), lalu rata-rata ketiganya.</li>
            <li><b>Skor total</b> = <span className="num">{SCORE_WEIGHTS.attendance * 100}%</span> kehadiran + <span className="num">{SCORE_WEIGHTS.performance * 100}%</span> (nilai coach × 10).</li>
            <li>Kategori: Unggul ≥ 85 · Baik 75–84 · Cukup 65–74 · Perlu perhatian &lt; 65.</li>
            <li>Kandidat turnamen di halaman Peringkat: kehadiran minimal <span className="num">{SELECTION_MIN_ATTENDANCE}%</span>.</li>
          </ul>
        </Panel>
        <Panel icon={KeyRound} title="Ganti password admin"><PasswordForm /></Panel>
        <Panel icon={Smartphone} title="Aplikasi di HP">
          <p className="mb-3 text-sm text-ink-muted">Pasang dashboard ini di layar utama HP agar bisa dibuka seperti aplikasi saat di lapangan.</p>
          <InstallPrompt />
        </Panel>
      </div>
    </>
  );
}
