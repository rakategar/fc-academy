import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, Pencil, RefreshCw, ShieldX } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { getAccount } from "@/lib/auth/roles";
import { btn } from "@/components/ui/Button";
import { ageFrom, fmtDate } from "@/lib/format";
import { POSITIONS } from "@/lib/types";

export const metadata = { title: "Menunggu Verifikasi" };
export const dynamic = "force-dynamic";

export default async function Waiting() {
  const account = await getAccount();
  if (!account.userId) redirect("/");
  if (account.kind === "coach") redirect("/coach/masuk");
  if (account.kind === "none") redirect("/daftar");
  const player = account.player;
  if (player.status === "aktif" || player.status === "cuti") redirect("/pemain");
  const state = player.status; // pending | ditolak | arsip
  const copy = {
    pending: { title: "Pendaftaran terkirim", sub: "Admin akademi akan memeriksa datamu. Setelah disetujui, kamu bisa melihat absensi, nilai, dan peringkat.", head: "Menunggu verifikasi admin" },
    ditolak: { title: "Pendaftaran perlu diperbaiki", sub: "Admin belum bisa menyetujui pendaftaranmu. Periksa catatan di bawah, perbaiki datanya, lalu kirim ulang.", head: "Pendaftaran ditolak" },
    arsip: { title: "Akun tidak aktif", sub: "Akunmu sedang diarsipkan. Hubungi admin atau coach bila menurutmu ini keliru.", head: "Akun diarsipkan" },
  }[state];

  return (
    <AuthLayout rail="accent" badge="Langkah 3 dari 3" title={copy.title} subtitle={copy.sub}>
      <div className="rounded-[10px] border border-line bg-panel p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className={`grid h-11 w-11 place-items-center rounded-full ${state === "pending" ? "bg-gold-soft text-gold-ink" : "bg-alpa-bg text-alpa"}`}>
            {state === "pending" ? <Clock size={22} /> : <ShieldX size={22} />}
          </span>
          <div>
            <p className="font-semibold">{copy.head}</p>
            <p className="caption">Didaftarkan {fmtDate(player.created_at.slice(0, 10))}</p>
          </div>
        </div>
        {state === "ditolak" && player.reject_reason && (
          <p className="mb-4 rounded-[6px] bg-alpa-bg px-3 py-2 text-sm text-alpa-ink"><b>Catatan admin:</b> {player.reject_reason}</p>
        )}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div><dt className="caption">Nama</dt><dd className="font-medium">{player.full_name}</dd></div>
          <div><dt className="caption">Umur</dt><dd className="num">{ageFrom(player.birth_date)} tahun</dd></div>
          <div><dt className="caption">Posisi</dt><dd>{POSITIONS.find((p) => p.value === player.position)?.label}</dd></div>
          <div><dt className="caption">Tim</dt><dd>{player.team}</dd></div>
        </dl>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {state === "ditolak" ? (
          <Link href="/daftar" className={btn("accent", "md", "flex-1")}><Pencil size={16} /> Perbaiki & ajukan ulang</Link>
        ) : (
          <Link href="/menunggu" className={btn("secondary", "md", "flex-1")}><RefreshCw size={16} /> Periksa lagi</Link>
        )}
        <SignOutButton redirectUrl="/"><button className={btn("ghost", "md", "flex-1")}>Keluar</button></SignOutButton>
      </div>
    </AuthLayout>
  );
}
