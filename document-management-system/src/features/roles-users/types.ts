export type UserStatus = "active" | "inactive";

export interface AdminUser {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  role: "Employee" | "Manager" | "Executive" | "Administrator";
  status: UserStatus;
  password?: string;
}

export interface RoleRecord {
  id: string;
  name: string;
  permissionSummary: string;
  isActive: boolean;
}

export type ConfigUser = {
  id: string;
  fullName: string;
  email: string;
  department: string;
  position: string;
  role: string;
  isActive: boolean;
  password?: string;
};

export const LEVEL_OPTIONS = ["L1", "L2", "L3", "L4", "Executive"] as const;

export const USER_ROLE_OPTIONS = [
  "Employee",
  "Manager",
  "Executive",
  "Administrator",
] as const;
