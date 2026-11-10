"use client";
import { useTransition } from "react";
import { Archive, RotateCcw } from "lucide-react";
import { setPlayerStatus } from "../actions";
import { Button } from "@/components/ui/Button";
import type { PlayerStatus } from "@/lib/types";

export function PlayerStatusButton({ id, status }: { id: string; status: PlayerStatus }) {
  const [busy, start] = useTransition();
  if (status === "arsip")
    return <Button variant="secondary" disabled={busy} onClick={() => start(() => setPlayerStatus(id, "aktif"))}><RotateCcw size={17} /> Aktifkan lagi</Button>;
  return (
    <Button
      variant="danger"
      disabled={busy}
      onClick={() => { if (window.confirm("Arsipkan pemain ini? Riwayat absensinya tetap tersimpan dan ia tidak muncul di daftar absensi.")) start(() => setPlayerStatus(id, "arsip")); }}
    >
      <Archive size={17} /> Arsipkan
    </Button>
  );
}
