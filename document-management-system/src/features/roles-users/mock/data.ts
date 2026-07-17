import type { AdminUser, RoleRecord } from "../types";

export const SEED_USERS: AdminUser[] = [
  {
    id: "1",
    name: "สมชาย ใจดี",
    position: "ผู้จัดการแผนกจัดซื้อ",
    department: "แผนกจัดซื้อ",
    email: "somchai@company.com",
    role: "Manager",
    status: "active",
  },
  {
    id: "2",
    name: "สุดา วงศ์ศรี",
    position: "หัวหน้าแผนกบัญชี",
    department: "แผนกบัญชี",
    email: "suda@company.com",
    role: "Employee",
    status: "active",
  },
  {
    id: "3",
    name: "วิภา รักดี",
    position: "หัวหน้าแผนกบัญชี",
    department: "แผนกคลังสินค้า",
    email: "wipa@company.com",
    role: "Manager",
    status: "active",
  },
  {
    id: "4",
    name: "ประเสริฐ มีสุข",
    position: "ผู้อำนวยการ",
    department: "แผนก IT",
    email: "prasert@company.com",
    role: "Executive",
    status: "active",
  },
  {
    id: "5",
    name: "นภา สุขใจ",
    position: "เจ้าหน้าที่แผนก IT",
    department: "แผนกบัญชี",
    email: "napja@company.com",
    role: "Employee",
    status: "inactive",
  },
];

export const SEED_ROLES: RoleRecord[] = [
  { id: "1", name: "Administrator", permissionSummary: "Full access", isActive: true },
  { id: "2", name: "Executive", permissionSummary: "View, Create, Approve", isActive: true },
  { id: "3", name: "Manager", permissionSummary: "View, Create, Edit, Approve", isActive: true },
  { id: "4", name: "Employee", permissionSummary: "View, Create", isActive: true },
  { id: "5", name: "Senior manager", permissionSummary: "View, Create, Edit", isActive: false },
];
