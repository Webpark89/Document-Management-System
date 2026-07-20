import type { AdminUser, RoleRecord } from "../types";

export const SEED_USERS: AdminUser[] = [
  {
    id: "1",
    name: "สมชาย ใจดี",
    position: "ผู้จัดการฝ่ายจัดซื้อ",
    department: "แผนกจัดซื้อ",
    email: "somchai@company.com",
    role: "Manager",
    status: "active",
  },
  {
    id: "2",
    name: "สุดา วงศ์ศรี",
    position: "เจ้าหน้าที่บัญชี",
    department: "แผนกบัญชีและการเงิน",
    email: "suda@company.com",
    role: "Employee",
    status: "active",
  },
  {
    id: "3",
    name: "วิภา รักดี",
    position: "หัวหน้าคลังสินค้า",
    department: "แผนกคลังสินค้าและจัดส่ง",
    email: "wipa@company.com",
    role: "Manager",
    status: "active",
  },
  {
    id: "4",
    name: "ประเสริฐ มีสุข",
    position: "ผู้ดูแลระบบ IT",
    department: "แผนกเทคโนโลยีสารสนเทศ",
    email: "prasert@company.com",
    role: "Executive",
    status: "active",
  },
  {
    id: "5",
    name: "นภา สุขใจ",
    position: "เจ้าหน้าที่ HR",
    department: "แผนกทรัพยากรบุคคล",
    email: "napa@company.com",
    role: "Employee",
    status: "active",
  },
  {
    id: "6",
    name: "กิตติศักดิ์ พรหมมา",
    position: "ผู้อำนวยการฝ่ายผลิต",
    department: "แผนกผลิต",
    email: "kittisak@company.com",
    role: "Executive",
    status: "active",
  },
];

export const SEED_ROLES: RoleRecord[] = [
  { id: "1", name: "Administrator", permissionSummary: "Full access", isActive: true },
  { id: "2", name: "Executive", permissionSummary: "View, Create, Approve", isActive: true },
  { id: "3", name: "Manager", permissionSummary: "View, Create, Edit, Approve", isActive: true },
  { id: "4", name: "Employee", permissionSummary: "View, Create", isActive: true },
  { id: "5", name: "Senior manager", permissionSummary: "View, Create, Edit", isActive: false },
];
