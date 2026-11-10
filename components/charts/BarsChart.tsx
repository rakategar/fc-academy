"use client";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, Legend, TooltipBox, axisProps } from "./ChartFrame";
import type { Series } from "./TrendChart";

/** Batang tunggal berwarna per kategori, dengan label nilai di atasnya. */
export function BarsChart({
  data,
  height = 240,
  unit = "",
  max,
}: {
  data: { label: string; value: number; color: string; sub?: string }[];
  height?: number;
  unit?: string;
  max?: number;
}) {
  return (
    <ChartFrame height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 22, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="label" {...axisProps} interval={0} />
          <YAxis {...axisProps} domain={[0, max ?? "auto"]} width={44} />
          <Tooltip content={<TooltipBox unit={unit} />} cursor={{ fill: "var(--panel-sunken)" }} />
          <Bar dataKey="value" name="Nilai" radius={[6, 6, 0, 0]} maxBarSize={56} animationDuration={900} animationEasing="ease-out">
            {data.map((d) => (
              <Cell key={d.label} fill={d.color} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v: unknown) => `${Number(v).toLocaleString("id-ID", { maximumFractionDigits: 1 })}${unit}`}
              style={{ fontSize: 12, fontWeight: 600, fill: "var(--ink)", fontFamily: "var(--font-mono)" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/** Batang bertumpuk (mis. hadir/izin/sakit/alpa per sesi). */
export function StackedBars({
  data,
  series,
  height = 260,
  xKey = "label",
}: {
  data: Record<string, string | number>[];
  series: Series[];
  height?: number;
  xKey?: string;
}) {
  return (
    <div>
      <Legend items={series.map((s) => ({ name: s.name, color: s.color }))} />
      <ChartFrame height={height}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey={xKey} {...axisProps} minTickGap={8} />
            <YAxis {...axisProps} width={44} allowDecimals={false} />
            <Tooltip content={<TooltipBox />} cursor={{ fill: "var(--panel-sunken)" }} />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                stackId="a"
                fill={s.color}
                maxBarSize={28}
                radius={i === series.length - 1 ? [4, 4, 0, 0] : 0}
                animationDuration={700}
                animationBegin={i * 120}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}
