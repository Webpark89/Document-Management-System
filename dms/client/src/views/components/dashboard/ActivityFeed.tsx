"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@views/components/ui/card';
import { ActivityItem } from '@views/features/documents/types';

type ActivityFeedProps = {
  items: ActivityItem[];
};

export default function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <Card className="border-slate-100 shadow-sm rounded-2xl bg-white p-10 h-full">
      <CardHeader className="p-0 pb-6">
        <CardTitle className="text-lg font-bold text-slate-900">Activity Feed</CardTitle>
        <CardDescription className="text-sm text-slate-400 font-medium">
          Latest document actions
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm font-semibold">
            <div className="space-y-1">
              <p className="text-slate-700">{item.id}</p>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">
                {item.timestamp}
              </p>
            </div>
            <span
              className={`text-base font-bold ${
                item.delta.startsWith("+")
                  ? "text-emerald-600"
                  : item.delta.startsWith("-")
                  ? "text-rose-600"
                  : "text-slate-400"
              }`}
            >
              {item.delta}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
