import React from "react";

interface FolderIconRendererProps {
  iconName?: string;
  className?: string;
  color?: string;
}

export function FolderIconRenderer({ className = "w-6 h-6", color }: FolderIconRendererProps) {
  return (
    <svg
      viewBox="0 0 64 56"
      fill="none"
      className={className}
      style={color ? { color } : undefined}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2 12a6 6 0 0 1 6-6h15a6 6 0 0 1 4.3 1.8l3.4 3.4a4 4 0 0 0 2.8 1.2H56a6 6 0 0 1 6 6V44a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6V12Z"
        fill="currentColor"
      />
      <path d="M9 20a3 3 0 0 1 3-3h40a3 3 0 0 1 3 3v23H9V20Z" fill="white" fillOpacity=".85" />
      <path
        d="M2 30a5 5 0 0 1 5-5h26a5 5 0 0 0 4-2l2-2.7a5 5 0 0 1 4-2H57a5 5 0 0 1 5 5V49a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V30Z"
        fill="currentColor"
      />
      <path
        d="M2 30a5 5 0 0 1 5-5h26a5 5 0 0 0 4-2l2-2.7a5 5 0 0 1 4-2H57a5 5 0 0 1 5 5V49a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V30Z"
        fill="white"
        fillOpacity=".28"
      />
    </svg>
  );
}
