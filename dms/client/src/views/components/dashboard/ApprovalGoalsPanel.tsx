"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@views/components/ui/card';
import { GoalMetric } from '@views/features/documents/types';

type ApprovalGoalsPanelProps = {
  goals: GoalMetric[];
};

export function ApprovalGoalsPanel({ goals }: ApprovalGoalsPanelProps) {
  return (
    <Card className="border-slate-100 shadow-sm rounded-2xl bg-white p-10 h-full">
      <CardHeader className="p-0 pb-8">
        <CardTitle className="text-lg font-bold text-slate-900">Monthly Targets &amp; Goals</CardTitle>
        <CardDescription className="text-sm text-slate-400 font-medium">Compliance and system performance metrics</CardDescription>
      </CardHeader>
      <CardContent className="p-0 space-y-5">
        {goals.map((goal, idx) => {
          const percentage = (goal.current / goal.target) * 100;
          return (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span className="text-slate-600">{goal.name}</span>
                <span className="text-slate-900">
                  {goal.current}
                  {goal.unit}
                </span>
              </div>

              {/* Custom Progress Bar */}
              <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${goal.colorClass}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm text-slate-400 font-bold uppercase tracking-wider">
                <span>Current: {goal.current}%</span>
                <span>Target: {goal.target}%</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default ApprovalGoalsPanel;
