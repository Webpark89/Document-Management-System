"use client";

import React from "react";
import { usePermission } from "@controllers/hooks/usePermission";

interface PermissionGateProps {
  /** Permission key: "section.item:action" */
  permission?: string;
  /** Any of these permissions */
  anyOf?: string[];
  /** All of these permissions */
  allOf?: string[];
  /** What to render when permission is denied (default: null) */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Wraps children with permission check.
 * Renders nothing (or fallback) if user lacks the required permission.
 *
 * Usage:
 *   <PermissionGate permission="document.create_document:create">
 *     <CreateButton />
 *   </PermissionGate>
 */
export function PermissionGate({
  permission,
  anyOf,
  allOf,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can, canAny, canAll } = usePermission();

  let allowed = true;
  if (permission) allowed = can(permission);
  else if (anyOf) allowed = canAny(anyOf);
  else if (allOf) allowed = canAll(allOf);

  return <>{allowed ? children : fallback}</>;
}
