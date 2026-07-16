export type ConfigUser = {
  id: string;
  fullName: string;
  email: string;
  department: string;
  position: string;
  role: string;
  isActive: boolean;
};

export type ConfigRole = {
  id: string;
  name: string;
  permissionSummary: string;
  isActive: boolean;
};

export let MOCK_USERS: ConfigUser[] = [
  {
    id: "1",
    fullName: "สมชาย ใจดี",
    email: "somchai@company.com",
    department: "Purchasing",
    position: "Manager",
    role: "Manager",
    isActive: true,
  },
  {
    id: "2",
    fullName: "สุดา วงศ์ศรี",
    email: "suda@company.com",
    department: "Finance",
    position: "Supervisor",
    role: "Employee",
    isActive: true,
  },
  {
    id: "3",
    fullName: "วิภา รักดี",
    email: "wipa@company.com",
    department: "Warehouse",
    position: "Manager",
    role: "Manager",
    isActive: true,
  },
  {
    id: "4",
    fullName: "ประเสริฐ มีสุข",
    email: "prasert@company.com",
    department: "IT",
    position: "Executive",
    role: "Executive",
    isActive: true,
  },
  {
    id: "5",
    fullName: "นภา สุขใจ",
    email: "napja@company.com",
    department: "Finance",
    position: "Employee",
    role: "Employee",
    isActive: false,
  },
];

export const MOCK_ROLES: ConfigRole[] = [
  { id: "1", name: "Administrator", permissionSummary: "Full access", isActive: true },
  { id: "2", name: "Executive", permissionSummary: "View, Create, Approve", isActive: true },
  { id: "3", name: "Manager", permissionSummary: "View, Create, Edit, Approve", isActive: true },
  { id: "4", name: "Employee", permissionSummary: "View, Create", isActive: true },
  { id: "5", name: "Senior manager", permissionSummary: "View, Create, Edit", isActive: false },
];

export function countUsersByRole(roleName: string, users = MOCK_USERS) {
  return users.filter((u) => u.role === roleName).length;
}

export function prependConfigUser(user: ConfigUser) {
  MOCK_USERS = [user, ...MOCK_USERS];
}
