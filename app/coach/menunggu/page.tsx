import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, Pencil, RefreshCw, ShieldX } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { getAccount } from "@/lib/auth/roles";
import { getAgeGroups } from "@/lib/data";
import { btn } from "@/components/ui/Button";
import { fmtDate } from "@/lib/format";
import { FOCUS_LABEL } from "@/lib/types";

export const metadata = { title: "Menunggu Verifikasi" };
export const dynamic = "force-dynamic";

export default async function CoachWaiting() {
  const a = await getAccount();
  if (!a.userId) redirect("/coach");
  if (a.kind !== "coach") redirect("/coach/masuk");
  const c = a.coach;
  if (c.status === "aktif") redirect("/coach/dashboard");
  const groups = await getAgeGroups();
  const copy = {
    pending: { title: "Pendaftaran terkirim", sub: "Admin akademi akan memeriksa datamu dan menetapkan skuad yang kamu pegang.", head: "Menunggu verifikasi admin" },
    ditolak: { title: "Pendaftaran perlu diperbaiki", sub: "Periksa catatan admin, perbaiki datanya, lalu kirim ulang.", head: "Pendaftaran ditolak" },
    nonaktif: { title: "Akun coach nonaktif", sub: "Akses ke skuad sedang dinonaktifkan admin. Hubungi admin bila menurutmu ini keliru.", head: "Akun dinonaktifkan" },
  }[c.status as "pending" | "ditolak" | "nonaktif"];

  return (
    <AuthLayout badge="Area Coach" title={copy.title} subtitle={copy.sub}>
      <div className="rounded-[10px] border border-line bg-panel p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className={`grid h-11 w-11 place-items-center rounded-full ${c.status === "pending" ? "bg-gold-soft text-gold-ink" : "bg-alpa-bg text-alpa"}`}>
            {c.status === "pending" ? <Clock size={22} /> : <ShieldX size={22} />}
          </span>
          <div>
            <p className="font-semibold">{copy.head}</p>
            <p className="caption">Didaftarkan {fmtDate(c.created_at.slice(0, 10))}</p>
          </div>
        </div>
        {c.status === "ditolak" && c.reject_reason && <p className="mb-4 rounded-[6px] bg-alpa-bg px-3 py-2 text-sm text-alpa-ink"><b>Catatan admin:</b> {c.reject_reason}</p>}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div><dt className="caption">Nama</dt><dd className="font-medium">{c.full_name}</dd></div>
          <div><dt className="caption">No. HP</dt><dd className="num">{c.phone ?? "—"}</dd></div>
          <div><dt className="caption">Kelompok usia</dt><dd>{groups.filter((g) => c.age_group_ids.includes(g.id)).map((g) => g.name).join(", ") || "—"}</dd></div>
          <div><dt className="caption">Fokus</dt><dd>{FOCUS_LABEL[c.focus]}</dd></div>
        </dl>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {c.status === "ditolak" ? (
          <Link href="/coach/daftar" className={btn("accent", "md", "flex-1")}><Pencil size={16} /> Perbaiki & ajukan ulang</Link>
        ) : (
          <Link href="/coach/menunggu" className={btn("secondary", "md", "flex-1")}><RefreshCw size={16} /> Periksa lagi</Link>
        )}
        <SignOutButton redirectUrl="/coach"><button className={btn("ghost", "md", "flex-1")}>Keluar</button></SignOutButton>
      </div>
    </AuthLayout>
  );
}
