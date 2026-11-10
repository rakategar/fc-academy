"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search, Users } from "lucide-react";
import { inputCls } from "@/components/ui/Field";
import { PositionTag, ScoreBadge, PlayerStatusBadge } from "@/components/ui/Badge";
import { Avatar, EmptyState } from "@/components/ui/Panel";
import { Bar } from "@/components/motion/Reveal";
import type { PlayerStatus, Position } from "@/lib/types";

export interface PlayerRow {
  id: string;
  name: string;
  age: number;
  position: Position;
  group: string;
  jersey: number | null;
  status: PlayerStatus;
  linked: boolean;
  attendance: number | null;
  perf: number | null;
  score: number | null;
}

type SortKey = "name" | "age" | "attendance" | "perf" | "score";

export function PlayersTable({ rows, groups }: { rows: PlayerRow[]; groups: string[] }) {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const [pos, setPos] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "name", dir: 1 });

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows
      .filter((r) => (!term || r.name.toLowerCase().includes(term)) && (!group || r.group === group) && (!pos || r.position === pos))
      .sort((a, b) => {
        const va = a[sort.key], vb = b[sort.key];
        if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb) * sort.dir;
        return (((va as number | null) ?? -1) - ((vb as number | null) ?? -1)) * sort.dir;
      });
  }, [rows, q, group, pos, sort]);

  const th = (key: SortKey, label: string, right = false) => (
    <th scope="col" className={`px-3 py-2.5 font-medium ${right ? "text-right" : "text-left"}`}>
      <button
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === "name" ? 1 : -1 }))}
        className="inline-flex items-center gap-1 hover:text-ink"
      >
        {label}
        {sort.key === key && (sort.dir === 1 ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
      </button>
    </th>
  );

  return (
    <div>
      <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center md:px-5">
        <div className="relative flex-1">
          <Search size={17} className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama pemain…" className={`${inputCls} pl-9`} aria-label="Cari pemain" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select value={group} onChange={(e) => setGroup(e.target.value)} className={`${inputCls} sm:w-40`} aria-label="Kelompok usia">
            <option value="">Semua kelompok</option>
            {groups.map((g) => <option key={g}>{g}</option>)}
          </select>
          <select value={pos} onChange={(e) => setPos(e.target.value)} className={`${inputCls} sm:w-36`} aria-label="Posisi">
            <option value="">Semua posisi</option>
            {["GK", "DF", "MF", "FW"].map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <p className="caption num sm:ml-2">{list.length} pemain</p>
      </div>

      {list.length === 0 ? (
        <div className="px-4 pb-5 md:px-5"><EmptyState icon={Users} title="Tidak ada pemain yang cocok">Ubah kata kunci atau filter untuk melihat pemain lain.</EmptyState></div>
      ) : (
        <>
          {/* Mobile: daftar kartu */}
          <ul className="divide-y divide-line border-t border-line md:hidden">
            {list.map((r) => (
              <li key={r.id}>
                <Link href={`/coach/pemain/${r.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-sunken">
                  <Avatar name={r.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-medium"><span className="truncate">{r.name}</span></p>
                    <p className="caption mt-0.5 flex items-center gap-1.5"><PositionTag position={r.position} /> {r.group} · {r.age} th</p>
                    {r.status === "aktif" && <Bar value={r.attendance ?? 0} className="mt-2 h-1.5" color={(r.attendance ?? 0) >= 75 ? "var(--hadir)" : "var(--alpa)"} />}
                  </div>
                  <div className="text-right">
                    {r.status === "aktif" ? (
                      <>
                        <p className="num text-lg font-semibold">{r.score === null ? "—" : r.score.toLocaleString("id-ID", { maximumFractionDigits: 1 })}</p>
                        <p className="caption num">{r.attendance === null ? "—" : `${Math.round(r.attendance)}% hadir`}</p>
                      </>
                    ) : <PlayerStatusBadge status={r.status} />}
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: tabel */}
          <div className="hidden max-h-[70vh] overflow-auto border-t border-line md:block">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 z-10 bg-sunken text-ink-muted">
                <tr>
                  {th("name", "Nama pemain")}
                  <th scope="col" className="px-3 py-2.5 text-left font-medium">Posisi</th>
                  <th scope="col" className="px-3 py-2.5 text-left font-medium">Kelompok</th>
                  {th("age", "Umur", true)}
                  {th("attendance", "Kehadiran", true)}
                  {th("perf", "Performa", true)}
                  {th("score", "Skor", true)}
                  <th scope="col" className="px-3 py-2.5 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="h-11 border-b border-line hover:bg-sunken">
                    <td className="px-3">
                      <Link href={`/coach/pemain/${r.id}`} className="flex items-center gap-2.5 font-medium hover:text-accent">
                        <Avatar name={r.name} size={28} />
                        {r.name}
                        {r.jersey && <span className="num text-ink-faint">#{r.jersey}</span>}
                      </Link>
                    </td>
                    <td className="px-3"><PositionTag position={r.position} /></td>
                    <td className="px-3">{r.group}</td>
                    <td className="num px-3 text-right">{r.age}</td>
                    <td className="px-3 text-right">
                      <div className="ml-auto flex w-32 items-center gap-2">
                        <Bar value={r.attendance ?? 0} className="h-1.5" color={(r.attendance ?? 0) >= 75 ? "var(--hadir)" : "var(--alpa)"} />
                        <span className="num w-10 text-right">{r.attendance === null ? "—" : `${Math.round(r.attendance)}%`}</span>
                      </div>
                    </td>
                    <td className="num px-3 text-right">{r.perf === null ? "—" : r.perf.toLocaleString("id-ID", { maximumFractionDigits: 1 })}</td>
                    <td className="num px-3 text-right font-semibold">{r.score === null ? "—" : r.score.toLocaleString("id-ID", { maximumFractionDigits: 1 })}</td>
                    <td className="px-3">{r.status === "aktif" ? <ScoreBadge score={r.score} /> : <PlayerStatusBadge status={r.status} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
