"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DocumentTypeBreakdown } from '@views/features/documents/types';

type DocumentTypesChartProps = {
  data: DocumentTypeBreakdown[];
};

export function DocumentTypesChart({ data }: DocumentTypesChartProps) {
  const [mounted, setMounted] = useState(false);
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-white rounded-2xl p-10 border border-slate-100 shadow-sm flex flex-col justify-between h-full">
      <div>
        <h3 className="text-lg font-bold text-slate-950">Document Types</h3>
        <p className="text-sm text-slate-400 font-medium">Breakdown of submitted request formats</p>
      </div>

      <div className="my-8 flex items-center justify-center relative h-52">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="85%"
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-32 h-32 rounded-full border-8 border-slate-100 animate-pulse" />
        )}

        <div className="absolute flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black text-slate-900">{total}</span>
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Documents
          </span>
        </div>
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-50">
        {data.map((item, index) => {
          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={index} className="flex items-center justify-between text-sm font-semibold">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate max-w-[150px] sm:max-w-none">{item.name}</span>
              </div>
              <span className="text-slate-800 shrink-0">{percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DocumentTypesChart;
