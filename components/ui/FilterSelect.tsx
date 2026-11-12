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
      className={`${inputCls.replace("w-full", "")} h-11 w-full sm:w-auto sm:max-w-[240px] md:h-11 ${className}`}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
