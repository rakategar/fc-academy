"use client";
import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { inputCls } from "./Field";

/** "2026-11-03" → "03/11/2026" */
export function toDMY(iso: string | null | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** "03/11/2026" → "2026-11-03" (atau "" bila tidak valid) */
export function parseDMY(text: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!m) return "";
  const [, d, mo, y] = m;
  const dt = new Date(Date.UTC(+y, +mo - 1, +d));
  if (dt.getUTCFullYear() !== +y || dt.getUTCMonth() !== +mo - 1 || dt.getUTCDate() !== +d) return "";
  return `${y}-${mo}-${d}`;
}

function mask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

interface DateInputProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (iso: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * Input tanggal berformat Indonesia (hh/bb/tttt), tidak bergantung pada bahasa browser.
 * Nilai yang dikirim ke form tetap ISO (YYYY-MM-DD) lewat input tersembunyi.
 */
export function DateInput({ name, value, defaultValue, onChange, min, max, required, className = "", ...rest }: DateInputProps) {
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue ?? "");
  const iso = controlled ? value : inner;
  const [text, setText] = useState(toDMY(iso));
  const [seen, setSeen] = useState(iso);
  if (iso !== seen) {
    setSeen(iso);
    if (parseDMY(text) !== iso) setText(toDMY(iso));
  }
  const textRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);

  const commit = (next: string) => {
    if (!controlled) setInner(next);
    if (next !== iso) onChange?.(next);
  };

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const parsed = parseDMY(text);
    let msg = "";
    if (text && !parsed) msg = "Format tanggal: hh/bb/tttt, mis. 03/11/2026";
    else if (parsed && min && parsed < min) msg = `Tanggal paling awal ${toDMY(min)}`;
    else if (parsed && max && parsed > max) msg = `Tanggal paling akhir ${toDMY(max)}`;
    el.setCustomValidity(msg);
  }, [text, min, max]);

  return (
    <div className={`relative ${className}`}>
      <input
        ref={textRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="hh/bb/tttt"
        value={text}
        required={required}
        aria-label={rest["aria-label"]}
        onChange={(e) => {
          const t = mask(e.target.value);
          setText(t);
          commit(parseDMY(t));
        }}
        className={`${inputCls} num pr-11`}
      />
      {name && <input type="hidden" name={name} value={iso} />}
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={iso}
        min={min}
        max={max}
        onChange={(e) => { setText(toDMY(e.target.value)); commit(e.target.value); }}
        className="pointer-events-none absolute right-0 bottom-0 h-full w-10 opacity-0"
      />
      <button
        type="button"
        aria-label="Pilih dari kalender"
        onClick={() => {
          const p = pickerRef.current;
          if (!p) return;
          try { p.showPicker(); } catch { p.focus(); p.click(); }
        }}
        className="absolute top-1/2 right-1 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-[6px] text-ink-muted hover:bg-sunken hover:text-ink"
      >
        <CalendarDays size={18} />
      </button>
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

/** Input jam 24 jam (00–23 : 00–55), tanpa AM/PM. Nilai form: "HH:MM". */
export function TimeInput({ name, defaultValue = "15:30", className = "", "aria-label": label }: { name: string; defaultValue?: string; className?: string; "aria-label"?: string }) {
  const [h0, m0] = defaultValue.slice(0, 5).split(":");
  const [h, setH] = useState(h0 ?? "15");
  const [m, setM] = useState(m0 ?? "30");
  const minutes = MINUTES.includes(m) ? MINUTES : [...MINUTES, m].sort();
  const sel = "h-full appearance-none bg-transparent px-1 text-center focus:outline-none num";
  return (
    <div role="group" aria-label={label} className={`${inputCls} flex items-center gap-0.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 ${className}`}>
      <select aria-label={`${label ?? "Jam"} (jam)`} value={h} onChange={(e) => setH(e.target.value)} className={sel}>
        {HOURS.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
      <span className="text-ink-muted">:</span>
      <select aria-label={`${label ?? "Jam"} (menit)`} value={m} onChange={(e) => setM(e.target.value)} className={sel}>
        {minutes.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
      <span className="caption ml-auto pl-1">WIB</span>
      <input type="hidden" name={name} value={`${h}:${m}`} />
    </div>
  );
}
