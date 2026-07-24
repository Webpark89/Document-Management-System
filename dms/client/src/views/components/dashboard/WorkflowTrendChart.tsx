"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@views/components/ui/card';
import { DocumentTrendPoint } from '@views/features/documents/types';

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-lg">
      <div className="text-sm font-semibold text-slate-400">{label}</div>
      <div className="mt-1 space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-sm font-semibold">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}</span>
            </div>
            <span className="text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type WorkflowTrendChartProps = {
  data: DocumentTrendPoint[];
};

export function WorkflowTrendChart({ data }: WorkflowTrendChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card className="border-slate-100 shadow-sm rounded-2xl bg-white p-10">
      <CardHeader className="p-0 pb-8">
        <CardTitle className="text-lg font-bold text-slate-900">Workflow Volume Trend</CardTitle>
        <CardDescription className="text-sm text-slate-400 font-medium">
          Weekly document submissions and approval rates
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-72 w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendDocuments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="trendApprovals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 500 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  ticks={[0, 8, 16, 24, 32]}
                  domain={[0, 32]}
                  tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 500 }}
                />
                <Tooltip content={<TrendTooltip />} cursor={{ stroke: "#E2E8F0", strokeDasharray: "3 3" }} />
                <Area
                  type="monotone"
                  dataKey="approvals"
                  name="Approvals"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#trendApprovals)"
                  dot={false}
                  activeDot={{ r: 3.5, strokeWidth: 2, fill: "#ffffff" }}
                />
                <Area
                  type="monotone"
                  dataKey="documents"
                  name="Documents"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#trendDocuments)"
                  dot={false}
                  activeDot={{ r: 3.5, strokeWidth: 2, fill: "#ffffff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full bg-slate-50 rounded-xl animate-pulse" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default WorkflowTrendChart;
