"use client";

import React, { useMemo, useState } from "react";
import { ClawPulseStats } from "@/types/stats";
import { formatTokens, formatDate, formatCost } from "@/lib/format";

interface Props {
  stats: ClawPulseStats;
}

const CELL_SIZE = 13;
const CELL_GAP = 3;
const TOTAL = CELL_SIZE + CELL_GAP;

const COLORS = [
  "#161b22", // level 0 - no activity
  "#0e4429", // level 1
  "#006d32", // level 2
  "#26a641", // level 3
  "#39d353", // level 4
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

function getLevel(tokens: number, max: number): number {
  if (tokens === 0) return 0;
  const ratio = tokens / max;
  if (ratio < 0.15) return 1;
  if (ratio < 0.4) return 2;
  if (ratio < 0.7) return 3;
  return 4;
}

export default function ContributionHeatmap({ stats }: Props) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    date: string;
    tokens: number;
    messages: number;
    cost: number;
  } | null>(null);

  const { cells, weeks, monthLabels, maxTokens } = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const cells: Array<{
      date: string;
      week: number;
      day: number;
      tokens: number;
      messages: number;
      cost: number;
    }> = [];

    let maxTokens = 0;

    // First pass: compute max
    for (const [, dayData] of Object.entries(stats.days)) {
      if (dayData.totalTokens > maxTokens) maxTokens = dayData.totalTokens;
    }

    const current = new Date(startDate);
    let week = 0;

    const monthLabels: Array<{ label: string; week: number }> = [];
    let lastMonth = -1;

    while (current <= today) {
      const dateStr = current.toISOString().slice(0, 10);
      const dayOfWeek = current.getDay();

      if (dayOfWeek === 0 && current > startDate) week++;

      const month = current.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ label: MONTHS[month], week });
        lastMonth = month;
      }

      const dayData = stats.days[dateStr];

      cells.push({
        date: dateStr,
        week,
        day: dayOfWeek,
        tokens: dayData?.totalTokens || 0,
        messages: dayData?.messages || 0,
        cost: dayData?.cost || 0,
      });

      current.setDate(current.getDate() + 1);
    }

    return { cells, weeks: week + 1, monthLabels, maxTokens };
  }, [stats]);

  const svgWidth = weeks * TOTAL + 40;
  const svgHeight = 7 * TOTAL + 30;

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin">
        <svg
          width={svgWidth}
          height={svgHeight}
          className="min-w-fit"
          role="img"
          aria-label="Contribution heatmap"
        >
          {/* Month labels */}
          {monthLabels.map((m, i) => (
            <text
              key={i}
              x={m.week * TOTAL + 40}
              y={10}
              fill="#8b949e"
              fontSize={11}
              fontFamily="system-ui, sans-serif"
            >
              {m.label}
            </text>
          ))}

          {/* Day labels */}
          {DAYS.map((label, i) => (
            <text
              key={i}
              x={0}
              y={i * TOTAL + 30 + 10}
              fill="#8b949e"
              fontSize={10}
              fontFamily="system-ui, sans-serif"
            >
              {label}
            </text>
          ))}

          {/* Cells */}
          {cells.map((cell, i) => (
            <rect
              key={i}
              x={cell.week * TOTAL + 40}
              y={cell.day * TOTAL + 20}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              ry={2}
              fill={COLORS[getLevel(cell.tokens, maxTokens)]}
              className="transition-all duration-150 hover:stroke-[#58a6ff] hover:stroke-1 cursor-pointer"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                  date: cell.date,
                  tokens: cell.tokens,
                  messages: cell.messages,
                  cost: cell.cost,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-2 text-xs text-[#8b949e]">
        <span>
          Learn how we count contributions
        </span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          {COLORS.map((color, i) => (
            <div
              key={i}
              className="w-[13px] h-[13px] rounded-sm"
              style={{ backgroundColor: color }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 10,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="bg-[#1b1f23] border border-[#30363d] rounded-lg px-3 py-2 shadow-xl text-sm">
            <div className="font-semibold text-white">
              {formatDate(tooltip.date)}
            </div>
            {tooltip.tokens > 0 ? (
              <div className="text-[#8b949e] space-y-0.5 mt-1">
                <div>
                  <span className="text-[#39d353]">{formatTokens(tooltip.tokens)}</span> tokens
                </div>
                <div>{tooltip.messages} messages</div>
                <div>{formatCost(tooltip.cost)}</div>
              </div>
            ) : (
              <div className="text-[#8b949e]">No activity</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
