import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-nav px-6 text-center text-white">
      <div>
        <img src="/brand/logo-256.png" alt="" className="mx-auto mb-6 h-28 w-auto" />
        <p className="num text-5xl font-semibold text-gold">404</p>
        <h1 className="mt-2 text-xl font-bold">Halaman tidak ditemukan</h1>
        <p className="mt-1 text-nav-ink">Mungkin tautannya sudah berubah atau datanya dihapus.</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-[6px] bg-accent px-5 font-semibold">Kembali ke beranda</Link>
      </div>
    </div>
  );
}
