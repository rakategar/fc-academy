"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { inputCls } from "./Field";

/** Select yang langsung memperbarui query string. */
export function FilterSelect({ name, options, label, className = "" }: { name: string; options: { value: string; label: string }[]; label: string; className?: string }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  return (
    <select
      aria-label={label}
      value={sp.get(name) ?? ""}
      onChange={(e) => {
        const next = new URLSearchParams(sp);
        if (e.target.value) next.set(name, e.target.value); else next.delete(name);
        router.push(`${path}?${next}`);
      }}
      className={`${inputCls} h-11 w-auto md:h-11 ${className}`}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
