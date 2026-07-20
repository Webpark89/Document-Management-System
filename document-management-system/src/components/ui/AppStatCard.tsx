"use client";

import type { ElementType, ReactNode } from "react";
import {
  APP_STAT_CARD,
  APP_STAT_GRID_3,
  APP_STAT_GRID_4,
  APP_STAT_GRID_5,
  APP_STAT_LABEL,
  APP_STAT_VALUE,
} from "./design-system";

export type AppStatCardProps = {
  label: string;
  value: ReactNode;
  icon: ElementType;
  iconBg?: string;
  iconColor?: string;
};

export function AppStatCard({
  label,
  value,
  icon: Icon,
  iconBg = "bg-blue-50",
  iconColor = "text-blue-600",
}: AppStatCardProps) {
  return (
    <div className={APP_STAT_CARD}>
      <div
        className={`mb-3 flex size-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
      >
        <Icon className={`size-5 ${iconColor}`} />
      </div>
      <span className={APP_STAT_LABEL}>{label}</span>
      <span className={APP_STAT_VALUE}>{value}</span>
    </div>
  );
}

type StatCardGridProps = {
  children: ReactNode;
  columns?: 3 | 4 | 5;
};

export function StatCardGrid({ children, columns = 3 }: StatCardGridProps) {
  const gridCls =
    columns === 5
      ? APP_STAT_GRID_5
      : columns === 4
        ? APP_STAT_GRID_4
        : APP_STAT_GRID_3;
  return <div className={gridCls}>{children}</div>;
}
