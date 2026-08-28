import { useAuth } from "@views/components/providers/AuthProvider";
import { useCallback } from "react";

/**
 * Permission key format: "section.item:action"
 * e.g. "document.create_document:create"
 *      "config.role_management:view"
 *      "approval.approve_document:approve"
 */
export function usePermission() {
  const { user } = useAuth();

  const can = useCallback(
    (permissionKey: string): boolean => {
      if (!user) return false;
      if (!user.permissions || user.permissions.length === 0) return false;
      return user.permissions.includes(permissionKey);
    },
    [user]
  );

  /** Check if user has ANY of the given permissions */
  const canAny = useCallback(
    (keys: string[]): boolean => {
      if (!user) return false;
      return keys.some((k) => can(k));
    },
    [user, can]
  );

  /** Check if user has ALL of the given permissions */
  const canAll = useCallback(
    (keys: string[]): boolean => {
      if (!user) return false;
      return keys.every((k) => can(k));
    },
    [user, can]
  );

  return { can, canAny, canAll };
}
