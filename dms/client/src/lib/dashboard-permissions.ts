// Kept in sync with server/common/dashboard-permissions by regression tests.
export const dashboardWidgets = {
  employee: [
    "employee_stat_cards",
    "employee_pending_approvals",
    "employee_submissions_status",
    "employee_recent_docs",
    "employee_docs_status_chart",
  ],
  executive: [
    "executive_stat_cards",
    "executive_docs_type_chart",
    "executive_docs_status_chart",
    "executive_pending_dept_chart",
    "executive_recent_activity",
    "executive_bottlenecks",
    "executive_view_scope",
  ],
} as const;

export function normalizeDashboardPermissions(
  input: readonly string[],
): string[] {
  const result = new Set(
    input.filter(
      (key) =>
        !["dashboard:view_employee", "dashboard:view_executive"].includes(key),
    ),
  );
  for (const view of ["employee", "executive"] as const) {
    const page = `dashboard.view_${view}:view`;
    const hasModern = input.some(
      (key) => key === page || key.startsWith(`dashboard.${view}_`),
    );
    if (!hasModern && input.includes(`dashboard:view_${view}`)) {
      result.add(page);
      for (const widget of dashboardWidgets[view]) {
        if (
          widget === "employee_pending_approvals" &&
          !input.includes("approvals.view_list:view")
        )
          continue;
        result.add(`dashboard.${widget}:view`);
      }
    }
  }
  return [...result];
}

export function hasDashboardPermission(
  input: readonly string[],
  key: string,
): boolean {
  const permissions = normalizeDashboardPermissions(input);
  const view = key.startsWith("executive_")
    ? "executive"
    : key.startsWith("employee_")
      ? "employee"
      : null;
  return (
    permissions.includes(`dashboard.${key}:view`) &&
    (!view || permissions.includes(`dashboard.view_${view}:view`))
  );
}
