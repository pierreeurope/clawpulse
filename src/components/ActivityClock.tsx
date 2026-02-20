"use client";

import React, { useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ClawPulseStats } from "@/types/stats";

interface Props {
  stats: ClawPulseStats;
}

const HOUR_LABELS = [
  "12am", "1am", "2am", "3am", "4am", "5am",
  "6am", "7am", "8am", "9am", "10am", "11am",
  "12pm", "1pm", "2pm", "3pm", "4pm", "5pm",
  "6pm", "7pm", "8pm", "9pm", "10pm", "11pm",
];

export default function ActivityClock({ stats }: Props) {
  const data = useMemo(() => {
    const hourly = new Array(24).fill(0);

    for (const day of Object.values(stats.days)) {
      if (day.hourly) {
        for (let h = 0; h < 24; h++) {
          hourly[h] += day.hourly[h] || 0;
        }
      }
    }

    return hourly.map((count, h) => ({
      hour: HOUR_LABELS[h],
      messages: count,
    }));
  }, [stats]);

  const peakHour = data.reduce(
    (max, d, i) => (d.messages > max.messages ? { ...d, index: i } : max),
    { hour: "", messages: 0, index: 0 }
  );

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Activity Clock</h3>
          <p className="text-sm text-[#8b949e]">
            Messages by hour (UTC)
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#8b949e] uppercase tracking-wider">
            Peak hour
          </div>
          <div className="text-lg font-bold text-[#39d353]">
            {peakHour.hour}
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="#21262d" />
            <PolarAngleAxis
              dataKey="hour"
              stroke="#8b949e"
              fontSize={10}
              tickLine={false}
            />
            <Radar
              dataKey="messages"
              stroke="#a371f7"
              fill="#a371f7"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1b1f23",
                border: "1px solid #30363d",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "13px",
              }}
              formatter={(value: number | undefined) => [
                `${(value ?? 0).toLocaleString()} messages`,
                "Activity",
              ]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
