import type { LucideIcon } from "lucide-react";
import { CountUp } from "@/components/motion/CountUp";

type Tint = "blue" | "green" | "purple" | "orange" | "sky";
const tint: Record<Tint, { bg: string; icon: string }> = {
  blue: { bg: "bg-tint-blue", icon: "text-[#1e6bff]" },
  green: { bg: "bg-tint-green", icon: "text-[#1f9d55]" },
  purple: { bg: "bg-tint-purple", icon: "text-[#7c4ddb]" },
  orange: { bg: "bg-tint-orange", icon: "text-[#ea8a0c]" },
  sky: { bg: "bg-tint-sky", icon: "text-[#0b84c6]" },
};

export function KpiCard({
  icon: Icon,
  tone = "blue",
  value,
  decimals = 0,
  suffix,
  label,
  delta,
  caption,
}: {
  icon: LucideIcon;
  tone?: Tint;
  value: number | null;
  decimals?: number;
  suffix?: string;
  label: string;
  delta?: { value: number; unit?: string; goodWhenUp?: boolean } | null;
  caption?: React.ReactNode;
}) {
  const t = tint[tone];
  const up = delta ? delta.value >= 0 : true;
  const good = delta ? (delta.goodWhenUp ?? true) === up : true;
  return (
    <div className={`flex items-start gap-3 rounded-[10px] p-3.5 md:p-4 ${t.bg}`}>
      <Icon className={`mt-0.5 shrink-0 ${t.icon}`} size={30} strokeWidth={2.2} />
      <div className="min-w-0">
        <p className="num text-[24px] leading-[30px] font-semibold md:text-[28px] md:leading-[34px]">
          {value === null ? "—" : <CountUp value={value} decimals={decimals} />}
          {suffix && value !== null && <span className="ml-0.5 text-[0.6em] font-medium text-ink-muted">{suffix}</span>}
        </p>
        <p className="text-sm leading-5 font-medium">{label}</p>
        {delta && (
          <p className={`num mt-0.5 text-xs font-medium ${good ? "text-gain" : "text-loss"}`}>
            {up ? "↑" : "↓"} {Math.abs(delta.value).toLocaleString("id-ID", { maximumFractionDigits: 1 })}
            {delta.unit ?? ""}
          </p>
        )}
        {caption && <p className="caption mt-0.5">{caption}</p>}
      </div>
    </div>
  );
}
