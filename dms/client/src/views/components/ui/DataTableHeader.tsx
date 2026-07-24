"use client";

import React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableHeaderProps {
  title: string;
  sortKey: string;
  currentSortKey: string | null;
  currentDirection: "asc" | "desc" | null;
  onSort: (key: string) => void;
  className?: string;
}

export default function DataTableHeader({
  title,
  sortKey,
  currentSortKey,
  currentDirection,
  onSort,
  className,
}: DataTableHeaderProps) {
  const isSorted = currentSortKey === sortKey;
  const isCentered = className?.includes("text-center");

  return (
    <th className={cn("py-4 text-xs font-bold text-slate-500 uppercase tracking-wider select-none", className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "flex items-center gap-1 hover:text-slate-900 transition-colors focus:outline-none font-bold",
          isCentered && "mx-auto justify-center"
        )}
      >
        <span>{title}</span>
        {isSorted ? (
          currentDirection === "desc" ? (
            <ArrowDown className="w-3.5 h-3.5 text-blue-600 animate-in fade-in" />
          ) : (
            <ArrowUp className="w-3.5 h-3.5 text-blue-600 animate-in fade-in" />
          )
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 opacity-60 hover:opacity-100" />
        )}
      </button>
    </th>
  );
}
