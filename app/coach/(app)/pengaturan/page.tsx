import { KeyRound, Layers, Settings, Smartphone, Calculator } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { requireCoach } from "@/lib/auth/coach";
import { getAgeGroups } from "@/lib/data";
import { ATTENDANCE_POINTS, SCORE_WEIGHTS, SELECTION_MIN_ATTENDANCE } from "@/lib/scoring";
import { GroupsForm, PasswordForm } from "./SettingsForms";

export const metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const [coach, groups] = await Promise.all([requireCoach(), getAgeGroups()]);
  return (
    <>
      <PageHeader icon={Settings} title="Pengaturan" subtitle={`Masuk sebagai ${coach.name} (${coach.username}).`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel icon={KeyRound} title="Ganti password coach"><PasswordForm /></Panel>
        <Panel icon={Layers} title="Kelompok usia"><GroupsForm groups={groups} /></Panel>
        <Panel icon={Calculator} title="Cara skor dihitung">
          <ul className="space-y-2 text-sm">
            <li><b>Skor kehadiran</b> = rata-rata poin tiap sesi: hadir <span className="num">{ATTENDANCE_POINTS.hadir}</span>, izin/sakit <span className="num">{ATTENDANCE_POINTS.izin}</span>, tanpa keterangan <span className="num">{ATTENDANCE_POINTS.alpa}</span> (×100).</li>
            <li><b>Skor performa</b> = rata-rata nilai teknik, fisik, taktik, mental, disiplin dari penilaian coach.</li>
            <li><b>Skor total</b> = <span className="num">{SCORE_WEIGHTS.attendance * 100}%</span> kehadiran + <span className="num">{SCORE_WEIGHTS.performance * 100}%</span> performa.</li>
            <li>Kategori: Unggul ≥ 85 · Baik 75–84 · Cukup 65–74 · Perlu perhatian &lt; 65.</li>
            <li>Seleksi turnamen: kehadiran minimal <span className="num">{SELECTION_MIN_ATTENDANCE}%</span> (bisa diubah di halaman Seleksi).</li>
          </ul>
        </Panel>
        <Panel icon={Smartphone} title="Aplikasi di HP">
          <p className="mb-3 text-sm text-ink-muted">Pasang dashboard ini di layar utama HP agar bisa dibuka seperti aplikasi saat di lapangan.</p>
          <InstallPrompt />
        </Panel>
      </div>
    </>
  );
}
