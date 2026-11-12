"use client";
import { CartesianGrid, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { ChartFrame, axisProps } from "./ChartFrame";

export function ScatterPlot({
  points,
  xLabel,
  yLabel,
  height = 260,
}: {
  points: { x: number; y: number; name: string }[];
  xLabel: string;
  yLabel: string;
  height?: number;
}) {
  return (
    <ChartFrame height={height}>
        <ScatterChart responsive style={{ width: "100%", height: "100%" }} margin={{ top: 8, right: 12, left: 8, bottom: 16 }}>
          <CartesianGrid stroke="var(--line)" />
          <XAxis type="number" dataKey="x" name={xLabel} unit="%" {...axisProps}
            domain={[(min: number) => Math.max(0, Math.floor((min - 5) / 10) * 10), 100]}
            tickFormatter={(v: number) => String(Math.round(v))}
            label={{ value: xLabel, position: "insideBottom", offset: -10, fontSize: 11, fill: "var(--ink-muted)" }} />
          <YAxis type="number" dataKey="y" name={yLabel} {...axisProps} width={40}
            domain={[(min: number) => Math.floor((min - 3) / 5) * 5, (max: number) => Math.min(100, Math.ceil((max + 2) / 5) * 5)]}
            tickFormatter={(v: number) => String(Math.round(v))}
            label={{ value: yLabel, angle: -90, position: "insideLeft", offset: -2, fontSize: 11, fill: "var(--ink-muted)" }} />
          <ZAxis range={[46, 46]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as { x: number; y: number; name: string };
              return (
                <div className="rounded-[8px] border border-line bg-panel px-3 py-2 text-xs shadow-[var(--shadow-dropdown)]">
                  <p className="font-semibold">{p.name}</p>
                  <p className="num">Kehadiran {p.x.toLocaleString("id-ID")}% · Nilai {(p.y / 10).toLocaleString("id-ID", { maximumFractionDigits: 1 })}</p>
                </div>
              );
            }}
          />
          <Scatter data={points} fill="var(--accent)" fillOpacity={0.75} animationDuration={900} />
        </ScatterChart>
    </ChartFrame>
  );
}
