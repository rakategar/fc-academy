import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, RefreshCw, ShieldX } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { getPlayerForUser } from "@/lib/auth/player";
import { btn } from "@/components/ui/Button";
import { ageFrom, fmtDate } from "@/lib/format";
import { POSITIONS } from "@/lib/types";

export const metadata = { title: "Menunggu Verifikasi" };
export const dynamic = "force-dynamic";

export default async function Waiting() {
  const { userId, player } = await getPlayerForUser();
  if (!userId) redirect("/login");
  if (!player) redirect("/lengkapi-data");
  if (player.status === "aktif") redirect("/pemain");
  const archived = player.status === "arsip";

  return (
    <AuthLayout badge="Langkah 3 dari 3" title={archived ? "Akun tidak aktif" : "Pendaftaran terkirim"} subtitle={archived ? "Hubungi coach bila menurutmu ini keliru." : "Coach akan memeriksa datamu. Setelah disetujui, kamu bisa melihat absensi dan skor."}>
      <div className="rounded-[10px] border border-line bg-panel p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className={`grid h-11 w-11 place-items-center rounded-full ${archived ? "bg-alpa-bg text-alpa" : "bg-gold-soft text-gold-ink"}`}>
            {archived ? <ShieldX size={22} /> : <Clock size={22} />}
          </span>
          <div>
            <p className="font-semibold">{archived ? "Akun diarsipkan" : "Menunggu verifikasi coach"}</p>
            <p className="caption">Didaftarkan {fmtDate(player.created_at.slice(0, 10))}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div><dt className="caption">Nama</dt><dd className="font-medium">{player.full_name}</dd></div>
          <div><dt className="caption">Umur</dt><dd className="num">{ageFrom(player.birth_date)} tahun</dd></div>
          <div><dt className="caption">Posisi</dt><dd>{POSITIONS.find((p) => p.value === player.position)?.label}</dd></div>
          <div><dt className="caption">Tim</dt><dd>{player.team}</dd></div>
        </dl>
      </div>
      <div className="mt-4 flex gap-2">
        <Link href="/menunggu" className={btn("secondary", "md", "flex-1")}><RefreshCw size={16} /> Periksa lagi</Link>
        <SignOutButton redirectUrl="/"><button className={btn("ghost", "md", "flex-1")}>Keluar</button></SignOutButton>
      </div>
    </AuthLayout>
  );
}
