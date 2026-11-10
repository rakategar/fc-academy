"use client";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { ChartFrame, TooltipBox } from "./ChartFrame";
import { CountUp } from "@/components/motion/CountUp";

export function DonutChart({
  data,
  centerValue,
  centerLabel,
  size = 200,
}: {
  data: { name: string; value: number; color: string; note?: string }[];
  centerValue: number;
  centerLabel: string;
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ChartFrame height={size}>
            <PieChart responsive style={{ width: "100%", height: "100%" }}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="68%"
                outerRadius="100%"
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
                stroke="none"
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip content={<TooltipBox />} />
            </PieChart>
        </ChartFrame>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="num text-[28px] leading-8 font-semibold"><CountUp value={centerValue} /></p>
            <p className="text-xs text-ink-muted">{centerLabel}</p>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-3">
        {data.map((d) => (
          <li key={d.name} className="flex items-start gap-2.5">
            <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: d.color }} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{d.name}</p>
              {d.note && <p className="caption">{d.note}</p>}
            </div>
            <p className="num text-sm">
              {d.value} <span className="text-ink-muted">({Math.round((d.value / total) * 1000) / 10}%)</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
