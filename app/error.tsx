"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-[60dvh] place-items-center px-6 text-center">
      <div>
        <h1 className="h1">Ada yang tidak beres</h1>
        <p className="mt-1 text-ink-muted">Data gagal dimuat. Periksa koneksi internet lalu coba lagi.</p>
        <button onClick={reset} className="mt-5 inline-flex h-11 items-center rounded-[6px] bg-brand px-5 font-semibold text-white">Coba lagi</button>
      </div>
    </div>
  );
}
