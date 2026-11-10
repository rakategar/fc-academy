"use client";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePerformance } from "./actions";

export function DeleteReview({ id }: { id: string }) {
  const [busy, start] = useTransition();
  return (
    <button
      disabled={busy}
      onClick={() => { if (window.confirm("Hapus penilaian ini? Skor pemain akan dihitung ulang.")) start(() => deletePerformance(id)); }}
      className="grid h-9 w-9 place-items-center rounded-[6px] text-ink-faint hover:bg-alpa-bg hover:text-alpa"
      aria-label="Hapus penilaian"
    >
      <Trash2 size={16} />
    </button>
  );
}
