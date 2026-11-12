import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { btn } from "@/components/ui/Button";

/** Ditampilkan bila akun Google sudah dipakai untuk peran lain. 1 akun = 1 peran. */
export function RoleConflict({ registeredAs, email, here }: { registeredAs: "coach" | "pemain"; email?: string | null; here: string }) {
  const other = registeredAs === "coach" ? { label: "coach", href: "/coach/masuk", area: "Area Coach" } : { label: "pemain", href: "/pemain", area: "Area Pemain" };
  return (
    <div className="rounded-[10px] border border-sakit/40 bg-sakit-bg p-5">
      <div className="flex items-start gap-3">
        <ShieldAlert size={22} className="mt-0.5 shrink-0 text-sakit-ink" />
        <div>
          <p className="font-semibold text-sakit-ink">Akun ini terdaftar sebagai {other.label}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {email ? <><b>{email}</b> sudah </> : "Akun Google ini sudah "}dipakai sebagai {other.label}. Satu akun Google hanya bisa punya satu peran.
            Untuk masuk sebagai {here}, keluar lalu gunakan akun Google lain.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Link href={other.href} className={btn("secondary", "md")}>Buka {other.area}</Link>
        <SignOutButton redirectUrl={here === "coach" ? "/coach" : "/"}><button className={btn("primary", "md")}>Keluar & ganti akun</button></SignOutButton>
      </div>
    </div>
  );
}
