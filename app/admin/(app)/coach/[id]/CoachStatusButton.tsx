"use client";
import { useTransition } from "react";
import { Power, RotateCcw } from "lucide-react";
import { setCoachStatus } from "../actions";
import { Button } from "@/components/ui/Button";

export function CoachStatusButton({ id, status }: { id: string; status: "aktif" | "nonaktif" }) {
  const [busy, start] = useTransition();
  if (status === "nonaktif") return <Button variant="secondary" disabled={busy} onClick={() => start(async () => { await setCoachStatus(id, "aktif"); })}><RotateCcw size={17} /> Aktifkan lagi</Button>;
  return (
    <Button variant="danger" disabled={busy} onClick={() => { if (window.confirm("Nonaktifkan coach ini? Ia tidak bisa masuk dashboard dan skuad otomatisnya dikosongkan. Data absensi & penilaian tetap tersimpan.")) start(async () => { await setCoachStatus(id, "nonaktif"); }); }}>
      <Power size={17} /> Nonaktifkan
    </Button>
  );
}
