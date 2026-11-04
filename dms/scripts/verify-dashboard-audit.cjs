const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
function load(relative, imports = {}) {
  const exports = {};
  const code = ts.transpileModule(
    fs.readFileSync(path.join(root, relative), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    },
  ).outputText;
  vm.runInNewContext(code, {
    exports,
    console,
    URLSearchParams,
    require: (name) => {
      assert.ok(name in imports, "Unexpected import: " + name);
      return imports[name];
    },
  });
  return exports;
}
const metrics = load("client/src/lib/dashboard-metrics.ts");
const { auditDateKey, auditCsv } = load("client/src/lib/audit-log-data.ts");
const now = new Date("2026-11-04T12:00:00Z");
test("monthly approval uses completion date for an old document approved this month", () => {
  assert.equal(
    metrics.isApprovedThisMonth(
      {
        status: "Approved",
        created_at: "2026-09-01",
        approved_at: "2026-11-04T10:00Z",
      },
      now,
    ),
    true,
  );
});
test("a document created this month but approved previously is not a monthly completion", () => {
  assert.equal(
    metrics.isApprovedThisMonth(
      { status: "Approved", date: "2026-11-04", approved_at: "2026-10-15" },
      now,
    ),
    false,
  );
});
test("approval month follows Bangkok boundaries", () => {
  assert.equal(
    metrics.isApprovedThisMonth(
      { status: "Approved", approved_at: "2026-10-31T16:59:59Z" },
      now,
    ),
    false,
  );
  assert.equal(
    metrics.isApprovedThisMonth(
      { status: "Approved", approved_at: "2026-10-31T17:00:00Z" },
      now,
    ),
    true,
  );
});
test("missing evidence and incomplete approvals cannot become monthly successes", () => {
  assert.equal(metrics.isApprovedThisMonth({ status: "Approved" }, now), false);
  assert.equal(
    metrics.isApprovedThisMonth(
      { status: "Pending", approved_at: now.toISOString() },
      now,
    ),
    false,
  );
});
test("same or overlapping display names do not change document ownership", () => {
  assert.equal(
    metrics.isOwnedDocument(
      { creator_id: "other", submittedBy: "same name" },
      "owner",
    ),
    false,
  );
  assert.equal(metrics.isOwnedDocument({ creator_id: "owner" }, "owner"), true);
});
test("status charts account for every record and separate returns from rejection", () => {
  const docs = Object.entries({
    Draft: 8,
    Pending: 17,
    Returned: 8,
    Rejected: 4,
    Approved: 24,
    Cancelled: 5,
  }).flatMap(([status, number]) =>
    Array.from({ length: number }, () => ({ status })),
  );
  const chart = metrics.documentStatusData(docs);
  assert.equal(
    chart.reduce((sum, row) => sum + row.value, 0),
    66,
  );
  assert.equal(chart.find((row) => row.status === "Returned").value, 8);
  assert.equal(chart.find((row) => row.status === "Rejected").value, 4);
});
test("pending age starts on submission instead of initial creation", () => {
  assert.equal(
    metrics.pendingLongerThanSevenDays(
      { status: "Pending", date: "2026-01-01", submitted_at: "2026-11-04" },
      now.getTime(),
    ),
    false,
  );
  assert.equal(
    metrics.pendingLongerThanSevenDays(
      { status: "Pending", submitted_at: "2026-10-01" },
      now.getTime(),
    ),
    true,
  );
});
test("calendar filters include Thai midnight and the entire selected day", () => {
  assert.equal(
    metrics.inBangkokDateRange("2026-10-31T17:00Z", "2026-11-01", "2026-11-01"),
    true,
  );
  assert.equal(
    metrics.inBangkokDateRange(
      "2026-11-01T16:59:59Z",
      "2026-11-01",
      "2026-11-01",
    ),
    true,
  );
  assert.equal(
    metrics.inBangkokDateRange("2026-11-01T17:00Z", "2026-11-01", "2026-11-01"),
    false,
  );
  assert.equal(auditDateKey("2026-10-31T17:30Z"), "2026-11-01");
});
test("dashboard mapping preserves approval, submission and department IDs", async () => {
  const { loadDashboardData } = load("client/src/lib/dashboard-data.ts");
  const result = await loadDashboardData({
    documents: async () => [
      {
        id: "PR",
        type: "PR",
        status: "Approved",
        approved_at: now.toISOString(),
        submittedDate: "2026-10-15",
        creator: { id: "owner", department: { id: "dept", name: "Name" } },
      },
    ],
    stats: async () => ({}),
  });
  assert.equal(result.documents[0].approved_at, now.toISOString());
  assert.equal(result.documents[0].submitted_at, "2026-10-15");
  assert.equal(result.documents[0].department_id, "dept");
});
test("audit client loads all pages beyond the old 100-row cutoff", async () => {
  const calls = [];
  const { adminService } = load(
    "client/src/controllers/services/admin.service.ts",
    {
      "@/lib": {
        api: {
          get: async (url) => {
            calls.push(url);
            const page = Number(
              new URLSearchParams(url.split("?")[1]).get("page"),
            );
            return {
              data: Array.from({ length: page < 3 ? 500 : 200 }, (_, i) => ({
                id: String((page - 1) * 500 + i),
              })),
            };
          },
        },
      },
    },
  );
  assert.equal((await adminService.getAuditLogs()).length, 1200);
  assert.equal(calls.length, 3);
});
test("audit CSV quotes every field and handles commas, quotes, newlines and formula-like values", () => {
  const csv = auditCsv([
    {
      timestamp: now.toISOString(),
      userName: 'Name, "quoted"',
      action: "View",
      module: "Document",
      targetId: "id",
      targetLabel: "=1+1",
      ipAddress: "-",
      comment: "line1\nline2",
    },
  ]);
  assert.ok(csv.includes('"Name, ""quoted"""'));
  assert.ok(csv.includes('"\'=1+1"'));
  assert.ok(csv.includes("line1\nline2"));
});
test("Audit Logs table has seven columns, no Details controls, and retains unknown IP as unknown", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const row = {
    id: "event",
    timestamp: "2026-10-31T17:30Z",
    userId: "owner",
    username: "owner",
    userName: "Actor",
    action: "View",
    module: "Documents",
    targetId: "doc",
    targetLabel: "PR-2026-0001",
    targetType: "document",
    ipAddress: "-",
    comment: "HIDDEN_INTERNAL_DETAILS",
  };
  const fakeReact = {
    ...React,
    useState: (initial) =>
      React.useState(
        Array.isArray(initial) ? [row] : initial === true ? false : initial,
      ),
  };
  const box = ({ children }) => React.createElement("div", null, children);
  const { AuditLogsContent } = load(
    "client/src/app/(main)/admin/audit-logs/page.tsx",
    {
      react: fakeReact,
      "react/jsx-runtime": require("react/jsx-runtime"),
      "lucide-react": require("lucide-react"),
      "next/link": {
        __esModule: true,
        default: ({ children, href }) =>
          React.createElement("a", { href }, children),
      },
      "next/navigation": { useSearchParams: () => new URLSearchParams() },
      "next/dynamic": { __esModule: true, default: () => () => null },
      "@views/components/shared/Pagination": { Pagination: () => null },
      "@views/components/ui/DataTableHeader": {
        __esModule: true,
        default: ({ title }) => React.createElement("th", null, title),
      },
      "@views/components/ui/design-system": {
        APP_PAGE_CONTENT: "",
        APP_PAGE_SHELL: "",
        APP_TABLE_CARD: "",
      },
      "@/app/(main)/admin/master-data/master-data-ui": { AdminPageHeader: box },
      "@/controllers/services/admin.service": { adminService: {} },
      "@views/components/providers/AuthProvider": {
        useAuth: () => ({ user: { permissions: ["auditlog.access:view"] } }),
      },
      "@/lib/audit-log-data": { auditDateKey, auditCsv },
    },
  );
  const html = renderToStaticMarkup(React.createElement(AuditLogsContent));
  assert.equal((html.match(/<th(?:\s|>)/g) ?? []).length, 7);
  assert.ok(!html.includes("Details"));
  assert.ok(!html.includes("HIDDEN_INTERNAL_DETAILS"));
  assert.ok(!html.includes("127.0.0.1"));
  assert.ok(html.includes("00:30:00"));
});
