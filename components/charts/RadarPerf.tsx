"use client";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, Tooltip } from "recharts";
import { ChartFrame, Legend, TooltipBox } from "./ChartFrame";

export function RadarPerf({
  data,
  height = 280,
  compareLabel,
}: {
  data: { aspect: string; value: number; compare?: number }[];
  height?: number;
  compareLabel?: string;
}) {
  const hasCompare = data.some((d) => d.compare !== undefined);
  return (
    <div>
      {hasCompare && <Legend items={[{ name: "Pemain", color: "var(--accent)" }, { name: compareLabel ?? "Rata-rata tim", color: "var(--gold)" }]} />}
      <ChartFrame height={height}>
          <RadarChart responsive style={{ width: "100%", height: "100%" }} data={data} outerRadius="72%">
            <PolarGrid stroke="var(--line)" />
            <PolarAngleAxis dataKey="aspect" tick={{ fontSize: 12, fill: "var(--ink)" }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            {hasCompare && (
              <Radar name={compareLabel ?? "Rata-rata tim"} dataKey="compare" stroke="var(--gold)" fill="var(--gold)" fillOpacity={0.12} strokeWidth={1.5} animationDuration={900} />
            )}
            <Radar name="Pemain" dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.25} strokeWidth={2} animationDuration={1000} />
            <Tooltip content={<TooltipBox />} />
          </RadarChart>
      </ChartFrame>
    </div>
  );
}
