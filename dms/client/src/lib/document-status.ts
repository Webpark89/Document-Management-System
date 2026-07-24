// ============================================================
// document-status.ts — compat layer for friend's @/lib/document-status
// Maps document status strings to badge variant names
// ============================================================

import type { DocumentStatus } from '@views/features/documents/types';

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "green" | "amber";

export function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "Approved":
      return "green";
    case "Pending":
      return "amber";
    case "Returned for Revision":
      return "destructive";
    case "Draft":
      return "secondary";
    case "Cancelled":
      return "outline";
    default:
      return "secondary";
  }
}
