"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const KEY = "ufa-install-dismissed";

/** Kartu "Pasang aplikasi" — muncul bila browser mendukung instalasi PWA. */
export function InstallPrompt({ className = "" }: { className?: string }) {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem(KEY) === "1"; } catch {}
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (dismissed || standalone) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos) { setIos(true); setHidden(false); }
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); setHidden(false); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden || (!evt && !ios)) return null;

  const dismiss = () => { setHidden(true); try { localStorage.setItem(KEY, "1"); } catch {} };

  return (
    <div className={`flex items-center gap-3 rounded-[10px] border border-line bg-panel p-3 ${className}`}>
      <img src="/icon-192.png" alt="" className="h-10 w-10 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Pasang aplikasi UNESA FC</p>
        <p className="caption">
          {ios ? "Ketuk tombol Bagikan lalu “Tambah ke Layar Utama”." : "Buka lebih cepat langsung dari layar utama."}
        </p>
      </div>
      {evt && (
        <button
          onClick={async () => { await evt.prompt(); await evt.userChoice; setEvt(null); setHidden(true); }}
          className="inline-flex h-10 items-center gap-1.5 rounded-[6px] bg-accent px-3 text-sm font-semibold text-white"
        >
          <Download size={16} /> Pasang
        </button>
      )}
      <button onClick={dismiss} aria-label="Tutup" className="grid h-10 w-10 place-items-center rounded-[6px] text-ink-muted hover:bg-sunken">
        <X size={18} />
      </button>
    </div>
  );
}
