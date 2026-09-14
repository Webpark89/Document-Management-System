export function countUsersInDepartment(deptName: string, users: unknown[] = []) {
  return users.filter(u => u.department === deptName).length;
}

export function countUsersWithPosition(posName: string, users: unknown[] = []) {
  return users.filter(u => u.position === posName).length;
}

export function formatApproverLabel(user: unknown) {
  if (!user) return "-";
  return `${user.first_name} ${user.last_name} (${user.position || "-"})`;
}

export function getApproverUsers(users: unknown[]) {
  return users.filter(u => u.is_active);
}

export function countUsersByRole(roleName: string, users: unknown[] = []) {
  if (!users || users.length === 0) return 0;
  return users.filter((u) => {
    const rName = u.role?.name || u.role_name || u.role || "";
    return rName.toLowerCase() === roleName.toLowerCase();
  }).length;
}
