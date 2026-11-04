const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const departments = [
  {
    id: "master-department-id",
    name: "แผนกที่แอดมินแก้ไขชื่อ",
    is_active: true,
  },
];
const users = [
  {
    id: "manager-a",
    first_name: "ผู้อนุมัติ",
    last_name: "หนึ่ง",
    role: "Manager",
    can_approve: true,
    is_active: true,
    username: "a",
    position: "หัวหน้า",
    department: "อยู่นอกแผนกที่แชร์",
  },
  {
    id: "manager-b",
    first_name: "ผู้อนุมัติ",
    last_name: "สอง",
    role: "Manager",
    can_approve: true,
    is_active: true,
    username: "b",
    position: "หัวหน้า",
    department: "อยู่นอกแผนกที่แชร์",
  },
  {
    id: "executive",
    first_name: "ผู้อนุมัติ",
    last_name: "สาม",
    role: "Executive",
    can_approve: true,
    is_active: true,
    username: "exec",
    position: "ผู้บริหาร",
    department: "อื่น",
  },
  {
    id: "manual-person-id",
    first_name: "ผู้ดู",
    last_name: "จากมาสเตอร์",
    role: "Employee",
    can_approve: false,
    is_active: true,
    username: "viewer",
    position: "เจ้าหน้าที่",
    department: "แผนกที่แชร์",
  },
];
const steps = users
  .slice(0, 3)
  .map((u, i) => ({
    id: String(i + 1),
    stepOrder: i + 1,
    roleName: u.role,
    approverId: u.id,
    approverName: `${u.first_name} ${u.last_name}`,
  }));

function mount(file, options = {}) {
  const cache = new Map(),
    calls = [],
    fetchers = [];
  const adminService = {
    getDepartmentDirectory: async () => {
      calls.push("departments");
      return departments;
    },
    getUserDirectory: async () => {
      calls.push("users");
      return users;
    },
  };
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename);
    const output = { exports: {} };
    cache.set(filename, output.exports);
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
    const context = {
      exports: output.exports,
      require: (id) => {
        if (id === "react")
          return {
            ...React,
            useState: (value) => [
              value === "" ? (options.search ?? "") : value,
              () => {},
            ],
          };
        if (id === "react/jsx-runtime" || id === "lucide-react")
          return require(id);
        if (id === "@/controllers/services/admin.service")
          return { adminService };
        if (id === "swr")
          return {
            __esModule: true,
            default: (key, fetcher) => {
              assert.ok(
                ["/api/lookups/departments", "/api/lookups/users"].includes(
                  key,
                ),
              );
              fetchers.push(fetcher);
              return {
                data: key.endsWith("/departments") ? departments : users,
                isLoading: false,
                error:
                  key === options.errorKey
                    ? Error("Master Data unavailable")
                    : undefined,
                mutate() {},
              };
            },
          };
        if (id.startsWith("./"))
          return load(path.resolve(path.dirname(filename), id + ".tsx"));
        throw Error("Unexpected component import: " + id);
      },
    };
    vm.runInNewContext(code, context);
    return output.exports;
  }
  const exports = load(
    path.resolve(__dirname, "../client/src/views/components/forms", file),
  );
  return {
    component: exports.default ?? exports.AutomaticApproverVisibility,
    fetchers,
    calls,
  };
}
function nodes(element) {
  if (!element || typeof element !== "object") return [];
  return [
    element,
    ...React.Children.toArray(element.props?.children).flatMap(nodes),
  ];
}
const markup = (component, props) =>
  renderToStaticMarkup(React.createElement(component, props));
const visibility = (type) => ({ type, departments: [], users: [] });

test("visibility form fetches actual Master Data directories through lookup services", async () => {
  const mounted = mount("Step2Visibility.tsx");
  mounted.component({ value: visibility("Department") });
  await Promise.all(mounted.fetchers.map((fetcher) => fetcher()));
  assert.deepEqual(mounted.calls.sort(), ["departments", "users"]);
});
test("choosing a department sends the Master Data ID rather than its display name", () => {
  const { component } = mount("Step2Visibility.tsx");
  let selected;
  const tree = component({
    value: visibility("Department"),
    onChange: (value) => {
      selected = value;
    },
  });
  const button = nodes(tree).find(
    (n) => n.type === "button" && n.props.children === departments[0].name,
  );
  assert.ok(button);
  button.props.onClick();
  assert.deepEqual([...selected.departments], [departments[0].id]);
});
test("choosing a person sends the Master Data user ID and displays the real name", () => {
  const { component } = mount("Step2Visibility.tsx", { search: "ผู้ดู" });
  let selected;
  const tree = component({
    value: visibility("SpecificUsers"),
    onChange: (value) => {
      selected = value;
    },
  });
  const person = nodes(tree).find(
    (n) =>
      n.type === "div" &&
      n.props.onClick &&
      renderToStaticMarkup(n).includes("จากมาสเตอร์"),
  );
  assert.ok(person);
  person.props.onClick();
  assert.deepEqual([...selected.users], ["manual-person-id"]);
});
for (const type of ["Department", "SpecificUsers"]) {
  test(`${type} displays all three automatically visible approvers without changing the manual audience`, () => {
    const { component } = mount("Step2Visibility.tsx");
    const value = visibility(type),
      html = markup(component, { value, approvers: steps });
    for (const s of steps) assert.ok(html.includes(s.approverName));
    assert.ok(html.includes("ผู้อนุมัติมองเห็นเอกสารอัตโนมัติ"));
    assert.deepEqual(value.users, []);
  });
}
test("automatic visibility summary follows replacement selections and deduplicates identities", () => {
  const { component } = mount("AutomaticApproverVisibility.tsx");
  const html = markup(component, {
    steps: [
      steps[0],
      steps[0],
      {
        ...steps[1],
        approverId: "replacement",
        approverName: "คนที่เลือกใหม่",
      },
    ],
  });
  assert.equal((html.match(/ผู้อนุมัติ หนึ่ง/g) ?? []).length, 1);
  assert.ok(html.includes("คนที่เลือกใหม่"));
  assert.ok(!html.includes("ผู้อนุมัติ สอง"));
});
test("workflow allows eligible out-of-audience approvers and saves the selected ID", () => {
  const { component } = mount("ApprovalWorkflowSection.tsx");
  let changed;
  const selections = [
    steps[0],
    { ...steps[1], approverId: undefined, approverName: "" },
    steps[2],
  ];
  const tree = component({
    steps: selections,
    visibilityType: "Department",
    onChange: (value) => {
      changed = value;
    },
  });
  const select = nodes(tree).find(
    (n) =>
      n.type === "select" && n.props["aria-label"] === "ผู้อนุมัติขั้นที่ 2",
  );
  assert.ok(renderToStaticMarkup(select).includes("manager-b"));
  select.props.onChange({ target: { value: "manager-b" } });
  assert.equal(changed[1].approverId, "manager-b");
});
test("workflow rejects duplicate and ineligible choices even when handlers receive them directly", () => {
  const { component } = mount("ApprovalWorkflowSection.tsx");
  let changes = 0;
  const tree = component({ steps, onChange: () => changes++ });
  const select = nodes(tree).find(
    (n) =>
      n.type === "select" && n.props["aria-label"] === "ผู้อนุมัติขั้นที่ 2",
  );
  select.props.onChange({ target: { value: "manager-a" } });
  select.props.onChange({ target: { value: "manual-person-id" } });
  assert.equal(changes, 0);
});
for (const [type, errorKey, message] of [
  ["Department", "/api/lookups/departments", "โหลดแผนกไม่สำเร็จ"],
  ["SpecificUsers", "/api/lookups/users", "โหลดรายชื่อไม่สำเร็จ"],
])
  test(`${type} shows a retryable Master Data error`, () => {
    const { component } = mount("Step2Visibility.tsx", { errorKey });
    const html = markup(component, { value: visibility(type) });
    assert.ok(html.includes(message));
    assert.ok(html.includes("ลองใหม่"));
  });
test("workflow prevents selecting stale candidates after directory load failure", () => {
  const { component } = mount("ApprovalWorkflowSection.tsx", {
    errorKey: "/api/lookups/users",
  });
  const tree = component({ steps, onChange() {} });
  for (const select of nodes(tree).filter((n) => n.type === "select"))
    assert.equal(select.props.disabled, true);
  assert.ok(
    renderToStaticMarkup(tree).includes(
      "โหลดรายชื่อผู้อนุมัติจาก Master Data ไม่สำเร็จ",
    ),
  );
});
test("CompanyWide keeps its normal visibility mode without redundant automatic-share controls", () => {
  const { component } = mount("Step2Visibility.tsx");
  assert.ok(
    !markup(component, {
      value: visibility("CompanyWide"),
      approvers: steps,
    }).includes("ผู้อนุมัติมองเห็นเอกสารอัตโนมัติ"),
  );
});
