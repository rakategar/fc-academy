"use client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, Legend, TooltipBox, axisProps } from "./ChartFrame";

export interface Series { key: string; name: string; color: string }

/** Garis + area tipis, tergambar dari kiri. */
export function TrendChart({
  data,
  series,
  xKey = "label",
  height = 260,
  domain = ["auto", "auto"],
  unit = "",
  showLegend = true,
}: {
  data: Record<string, string | number | null>[];
  series: Series[];
  xKey?: string;
  height?: number;
  domain?: [number | string, number | string];
  unit?: string;
  showLegend?: boolean;
}) {
  return (
    <div>
      {showLegend && series.length > 1 && <Legend items={series.map((s) => ({ name: s.name, color: s.color }))} />}
      <ChartFrame height={height}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey={xKey} {...axisProps} minTickGap={16} />
            <YAxis {...axisProps} domain={domain} width={44} />
            <Tooltip content={<TooltipBox unit={unit} />} cursor={{ stroke: "var(--line-strong)" }} />
            {series.map((s, i) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2.25}
                fill={`url(#g-${s.key})`}
                dot={{ r: 2.5, strokeWidth: 0, fill: s.color }}
                activeDot={{ r: 4.5 }}
                connectNulls
                animationDuration={900}
                animationBegin={i * 150}
                animationEasing="ease-out"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}
