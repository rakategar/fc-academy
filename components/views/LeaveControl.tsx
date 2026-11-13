"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarOff, PlayCircle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, inputCls } from "@/components/ui/Field";
import { DateInput } from "@/components/ui/DateTimeInputs";
import { endLeave, startLeave } from "@/lib/actions/leave";
import type { PlayerStatus } from "@/lib/types";

const PRESETS = ["Cedera", "Sakit", "Ujian / kegiatan sekolah", "Urusan keluarga"];

/** Tombol cutikan / akhiri cuti — dipakai admin & coach di detail pemain. */
export function LeaveControl({ role, playerId, name, status, today }: { role: "admin" | "coach"; playerId: string; name: string; status: PlayerStatus; today: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState(PRESETS[0]);
  const [other, setOther] = useState("");
  const [until, setUntil] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (status !== "aktif" && status !== "cuti") return null;

  if (status === "cuti")
    return (
      <div className="flex flex-col items-start gap-1">
        <Button variant="accent" disabled={busy} onClick={() => {
          if (!window.confirm(`Akhiri cuti ${name}? Ia kembali masuk daftar absensi, penilaian, dan peringkat mulai sekarang.`)) return;
          setError(null);
          start(async () => { const r = await endLeave(role, playerId); if (r.error) setError(r.error); else router.refresh(); });
        }}>
          <PlayCircle size={17} /> Akhiri cuti
        </Button>
        {error && <p role="alert" className="text-xs text-alpa-ink">⚠ {error}</p>}
      </div>
    );

  const reason = preset === "Lainnya" ? other : preset;
  return (
    <>
      <Button variant="secondary" onClick={() => { setOpen(true); setError(null); }}><CalendarOff size={17} /> Cutikan</Button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4" onClick={() => !busy && setOpen(false)}>
          <form
            role="dialog" aria-modal aria-labelledby="leave-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              start(async () => {
                const r = await startLeave(role, playerId, { reason, until: until || null });
                if (r.error) setError(r.error);
                else { setOpen(false); router.refresh(); }
              });
            }}
            className="w-full max-w-md rounded-t-[14px] bg-panel p-5 shadow-xl md:rounded-[12px]"
          >
            <div className="mb-3 flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sakit-bg text-sakit-ink"><CalendarOff size={20} /></span>
              <div className="flex-1">
                <h2 id="leave-title" className="font-semibold">Cutikan {name}</h2>
                <p className="caption">Selama cuti, pemain tidak masuk daftar absensi, tidak bisa absen mandiri, tidak dinilai, dan tidak ikut peringkat. Riwayat lamanya tetap tersimpan.</p>
              </div>
              <button type="button" aria-label="Tutup" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-[6px] text-ink-muted hover:bg-sunken"><X size={18} /></button>
            </div>
            <Field label="Alasan" required>
              <select value={preset} onChange={(e) => setPreset(e.target.value)} className={inputCls}>
                {[...PRESETS, "Lainnya"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            {preset === "Lainnya" && (
              <input value={other} onChange={(e) => setOther(e.target.value)} maxLength={200} required minLength={3} placeholder="Tulis alasannya" aria-label="Alasan lainnya" className={`${inputCls} mt-2`} />
            )}
            <Field label="Perkiraan kembali" help="Opsional. Cuti tidak berakhir otomatis — tekan “Akhiri cuti” saat pemain kembali." className="mt-3">
              <DateInput value={until} onChange={setUntil} min={today} aria-label="Perkiraan kembali" />
            </Field>
            {error && <p role="alert" className="mt-3 text-sm text-alpa-ink">⚠ {error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Batal</Button>
              <Button type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Simpan cuti"}</Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
