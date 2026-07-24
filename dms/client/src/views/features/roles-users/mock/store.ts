import type { AdminUser, ConfigUser, RoleRecord } from "../types";
import { SEED_ROLES, SEED_USERS } from "./data";

export let USERS: AdminUser[] = [...SEED_USERS];

export let ROLES: RoleRecord[] = [...SEED_ROLES];

export function formatApproverLabel(user: Pick<AdminUser, "name" | "position">) {
  return `${user.name} — ${user.position}`;
}

export function getApproverUsers(users: AdminUser[] = USERS) {
  return users.filter((u) => u.status === "active");
}

export function toConfigUser(user: AdminUser): ConfigUser {
  return {
    id: user.id,
    fullName: user.name,
    email: user.email,
    department: user.department,
    position: user.position,
    role: user.role,
    isActive: user.status === "active",
    password: user.password,
  };
}

export function fromConfigUser(user: ConfigUser): AdminUser {
  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    department: user.department,
    position: user.position,
    role: user.role as AdminUser["role"],
    status: user.isActive ? "active" : "inactive",
    password: user.password,
  };
}

export function getUsersAsConfig(): ConfigUser[] {
  return USERS.map(toConfigUser);
}

export let MOCK_USERS = getUsersAsConfig();

export function syncMockUsers() {
  MOCK_USERS = getUsersAsConfig();
}

export function prependConfigUser(user: ConfigUser) {
  USERS = [fromConfigUser(user), ...USERS];
  syncMockUsers();
}

export function updateConfigUser(id: string, patch: Partial<ConfigUser>) {
  USERS = USERS.map((u) => {
    if (u.id !== id) return u;
    const merged = { ...toConfigUser(u), ...patch };
    return fromConfigUser(merged);
  });
  syncMockUsers();
}

export function countUsersByRole(roleName: string, users: ConfigUser[] = MOCK_USERS) {
  return users.filter((u) => u.role === roleName).length;
}

export function countUsersInDepartment(departmentName: string): number {
  return USERS.filter((u) => u.department === departmentName && u.status === "active").length;
}

export function countUsersWithPosition(positionName: string): number {
  return USERS.filter(
    (u) =>
      u.status === "active" &&
      (u.position === positionName || u.position.includes(positionName))
  ).length;
}

export function prependRole(role: RoleRecord) {
  ROLES.unshift(role);
}

export function deactivateRole(id: string) {
  ROLES = ROLES.map((r) => (r.id === id ? { ...r, isActive: false } : r));
}

export const MOCK_ROLES = ROLES;
