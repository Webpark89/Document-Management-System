const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { test } = require("node:test");

function load(relativePath, imports = {}, console = global.console) {
  const source = fs.readFileSync(
    path.join(__dirname, "..", relativePath),
    "utf8",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const context = {
    exports: {},
    console,
    encodeURIComponent,
    require: (name) => {
      assert.ok(name in imports, `Unexpected import: ${name}`);
      return imports[name];
    },
  };
  vm.runInNewContext(compiled, context);
  return context.exports;
}
const { canDeleteDocument } = load("client/src/lib/document-permissions.ts");

for (const section of ["document", "submissions"]) {
  for (const own of [false, true]) {
    for (const others of [false, true]) {
      test(`${section}: own=${own}, others=${others} gates each creator independently`, () => {
        const actor = {
          id: "actor",
          permissions: [
            "document.view_all:view",
            ...(own ? [`${section}.delete_document:delete`] : []),
            ...(others ? [`${section}.delete_others_document:delete`] : []),
          ],
        };
        assert.equal(canDeleteDocument(actor, { creator_id: "actor" }), own);
        assert.equal(
          canDeleteDocument(actor, { creator_id: "someone-else" }),
          others,
        );
      });
    }
  }
}
test("missing identity, missing creator, and administrator name grant no implicit delete access", () => {
  assert.equal(canDeleteDocument(null, { creator_id: "actor" }), false);
  assert.equal(
    canDeleteDocument(
      { id: "actor", role: "Administrator" },
      { creator_id: "actor" },
    ),
    false,
  );
  assert.equal(
    canDeleteDocument(
      { id: "actor", permissions: ["document.delete_others_document:delete"] },
      {},
    ),
    false,
  );
});

test("delete rejection keeps status/message for the permission dialog without logging a dev overlay", async () => {
  const forbidden = Object.assign(
    new Error("คุณไม่มีสิทธิ์ลบเอกสารของผู้อื่น"),
    { status: 403 },
  );
  const logs = [];
  const { deleteDocument } = load(
    "client/src/views/features/documents/api.ts",
    {
      "@/lib": {
        api: {
          delete: async () => {
            throw forbidden;
          },
        },
      },
    },
    { error: (...args) => logs.push(args) },
  );
  await assert.rejects(
    deleteDocument("doc-id"),
    (error) => error === forbidden,
  );
  assert.equal(logs.length, 0);
});

test("delete returns actual success and URL-encodes the identifier", async () => {
  let route;
  const { deleteDocument } = load(
    "client/src/views/features/documents/api.ts",
    {
      "@/lib": {
        api: {
          delete: async (value) => {
            route = value;
            return { data: { success: false } };
          },
        },
      },
    },
  );
  assert.equal(await deleteDocument("DOC / 1"), false);
  assert.equal(route, "/api/documents/DOC%20%2F%201");
});
