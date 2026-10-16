const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
const assert = require("node:assert/strict"),
  { test } = require("node:test");
const ts = require("typescript"),
  React = require("react"),
  { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
function loader(user = null, authLoading = false) {
  const cache = new Map();
  const container = ({ children }) =>
    React.createElement(
      "div",
      null,
      typeof children === "function" ? null : children,
    );
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const module = { exports: {} };
    cache.set(file, module.exports);
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
    const requireModule = (id) => {
      if (id.includes("providers/AuthProvider"))
        return { useAuth: () => ({ user, loading: authLoading }) };
      if (id.includes("shared/PageHeader"))
        return {
          __esModule: true,
          default: ({ title, actions }) =>
            React.createElement("header", null, title, actions),
        };
      if (id === "next/navigation") return { useRouter: () => ({ push() {} }) };
      if (id === "next/link")
        return {
          __esModule: true,
          default: ({ href, children, ...props }) =>
            React.createElement("a", { ...props, href }, children),
        };
      if (id === "recharts") return new Proxy({}, { get: () => container });
      if (id === "@/lib")
        return {
          api: {
            get() {
              throw new Error("Unexpected API call during render");
            },
          },
        };
      let target;
      if (id.startsWith("@views/"))
        target = path.join(root, "client/src/views", id.slice(7));
      else if (id.startsWith("@/"))
        target = path.join(root, "client/src", id.slice(2));
      else if (id.startsWith("."))
        target = path.resolve(path.dirname(file), id);
      else return require(id);
      const resolved = [
        target,
        target + ".ts",
        target + ".tsx",
        path.join(target, "index.ts"),
      ].find(
        (candidate) =>
          fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
      );
      assert.ok(resolved, `Unresolved module ${id}`);
      return load(resolved);
    };
    vm.runInNewContext(
      code,
      {
        exports: module.exports,
        module,
        require: requireModule,
        console,
        setTimeout,
        clearTimeout,
      },
      { filename: file },
    );
    cache.set(file, module.exports);
    return module.exports;
  }
  return load;
}
const load = loader();
const client = load(path.join(root, "client/src/lib/dashboard-permissions.ts"));
const server = load(
  path.join(root, "server/src/common/dashboard-permissions.ts"),
);
const legacy = [
  "dashboard:view_employee",
  "dashboard:view_executive",
  "approvals.view_list:view",
];
test("legacy Manager/Executive grants resolve to visible dashboard widgets", () => {
  for (const view of ["employee", "executive"]) {
    assert.ok(client.hasDashboardPermission(legacy, `view_${view}`));
    for (const key of client.dashboardWidgets[view])
      assert.ok(client.hasDashboardPermission(legacy, key));
  }
});
test("modern widget exclusions take precedence over a leftover legacy grant", () => {
  const permissions = [
    ...legacy,
    "dashboard.view_employee:view",
    "dashboard.employee_recent_docs:view",
  ];
  assert.ok(client.hasDashboardPermission(permissions, "employee_recent_docs"));
  assert.equal(
    client.hasDashboardPermission(permissions, "employee_stat_cards"),
    false,
  );
  assert.ok(client.hasDashboardPermission(permissions, "executive_stat_cards"));
});
test("no permission, disabled parent and page-only grants never bypass widget restrictions", () => {
  for (const permissions of [
    [],
    ["dashboard.view_employee:view"],
    ["dashboard.employee_stat_cards:view"],
  ])
    assert.equal(
      client.hasDashboardPermission(permissions, "employee_stat_cards"),
      false,
    );
});
test("client/server interpretation matches and normalization is idempotent", () => {
  for (const permissions of [
    [],
    legacy,
    ["dashboard:view_employee"],
    [...legacy, "dashboard.view_executive:view"],
    [...legacy, "dashboard.employee_recent_docs:view"],
  ]) {
    const normalized = Array.from(
      client.normalizeDashboardPermissions(permissions),
    );
    assert.deepEqual(
      normalized,
      Array.from(server.normalizeDashboardPermissions(permissions)),
    );
    assert.deepEqual(
      normalized,
      Array.from(client.normalizeDashboardPermissions(normalized)),
    );
  }
});
test("legacy Employee without approval-list access gets no approval shortcut", () => {
  assert.equal(
    client.hasDashboardPermission(
      ["dashboard:view_employee"],
      "employee_pending_approvals",
    ),
    false,
  );
});
const data = load(path.join(root, "client/src/lib/dashboard-data.ts"));
test("API failures propagate instead of silently producing empty dashboard data", async () => {
  for (const failed of ["documents", "stats"]) {
    const failure = new Error(`${failed} unavailable`);
    await assert.rejects(
      data.loadDashboardData({
        documents: async () => {
          if (failed === "documents") throw failure;
          return [];
        },
        stats: async () => {
          if (failed === "stats") throw failure;
          return { total: 0 };
        },
      }),
      (error) => error === failure,
    );
  }
});
test("successful empty data remains a real empty dashboard", async () => {
  const result = await data.loadDashboardData({
    documents: async () => [],
    stats: async () => ({ total: 0 }),
  });
  assert.equal(result.documents.length, 0);
  assert.equal(result.stats.total, 0);
});
test("dashboard mapping preserves ownership, zero prices and visible department filters", async () => {
  const result = await data.loadDashboardData({
    documents: async () => [
      {
        id: "PR-1",
        real_id: "uuid",
        type: "PR",
        status: "Draft",
        creator_id: "owner",
        department: "Dept",
        pr_form: { total_amount: "0" },
      },
    ],
    stats: async () => ({ total: 1 }),
  });
  assert.equal(result.documents[0].creator_id, "owner");
  assert.equal(result.documents[0].value, 0);
  assert.deepEqual(Array.from(result.departments), ["Dept"]);
});
function pageMarkup(user, authLoading = false) {
  const page = loader(
    user,
    authLoading,
  )(path.join(root, "client/src/app/(main)/dashboard/page.tsx")).default;
  return renderToStaticMarkup(React.createElement(page));
}
test("initial unauthenticated render has a loading state and does not crash", () => {
  assert.match(pageMarkup(null, true), /กำลังโหลดข้อมูลแดชบอร์ด/);
});
test("no-dashboard and page-only users receive an explanation instead of a blank screen", () => {
  assert.match(
    pageMarkup({ id: "user", permissions: [] }),
    /ไม่มีสิทธิ์เข้าถึงแดชบอร์ด/,
  );
  assert.match(
    pageMarkup({ id: "user", permissions: ["dashboard.view_employee:view"] }),
    /ยังไม่ได้กำหนดส่วนแสดงผลแดชบอร์ด/,
  );
});
for (const name of ["EmployeeDashboard", "ExecutiveDashboard"]) {
  test(`${name} renders real content for legacy grants and an empty document list`, () => {
    const component = loader({
      id: "user",
      full_name: "Test",
      username: "test",
      permissions: legacy,
    })(path.join(root, `client/src/views/components/dashboard/${name}.tsx`))[
      name
    ];
    const markup = renderToStaticMarkup(
      React.createElement(component, {
        documents: [],
        stats: { actionRequired: 0 },
        departments: [],
      }),
    );
    assert.ok(markup.length > 1000);
    assert.match(
      markup,
      name === "EmployeeDashboard"
        ? /เอกสารที่ฉันสร้าง/
        : /เอกสารทั้งหมด|เอกสารรวม|เอกสาร/,
    );
  });
}
