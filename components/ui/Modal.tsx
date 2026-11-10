"use client";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useEffect } from "react";

/** Dialog: lembar bawah di HP, modal di tengah di layar lebar. */
export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button className="absolute inset-0 bg-ink/45" aria-label="Tutup" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[14px] bg-panel shadow-[var(--shadow-modal)] md:rounded-[14px] ${wide ? "md:max-w-[760px]" : "md:max-w-[540px]"}`}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          >
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-panel px-5 py-3.5">
              <h2 className="h2">{title}</h2>
              <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-[6px] hover:bg-sunken" aria-label="Tutup"><X size={20} /></button>
            </header>
            <div className="p-5" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)" }}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
