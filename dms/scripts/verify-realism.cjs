const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
const { registeredSignature } = require("./lib/fixture-signatures.cjs");

function client(file, api) {
  const compiled = ts.transpileModule(
    fs.readFileSync(
      path.join(__dirname, "../client/src/views/features", file),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText;
  const context = {
    exports: {},
    console,
    URLSearchParams,
    require: (id) => {
      assert.equal(id, "@/lib");
      return { api };
    },
  };
  vm.runInNewContext(compiled, context);
  return context.exports;
}
test("dashboard API failure remains an error instead of reporting zero documents", async () => {
  const failure = new Error("Database unavailable");
  const c = client("documents/api.ts", {
    get: async () => {
      throw failure;
    },
  });
  await assert.rejects(c.getDashboardStats(), (e) => e === failure);
});
test("notification fetch failure cannot become an empty successful inbox or zero unread count", async () => {
  const failure = new Error("Network failed");
  const c = client("notifications/api.ts", {
    get: async () => {
      throw failure;
    },
  });
  await assert.rejects(c.getNotifications(), (e) => e === failure);
  await assert.rejects(c.getUnreadCount(), (e) => e === failure);
});
test("notification read actions respect a failed server result", async () => {
  const c = client("notifications/api.ts", {
    patch: async () => ({ data: { success: false } }),
  });
  assert.equal(await c.markNotificationAsRead("notification"), false);
  assert.equal(await c.markAllNotificationsAsRead(), false);
});
test("notification read actions respect success rather than assuming it", async () => {
  const c = client("notifications/api.ts", {
    patch: async () => ({ data: { success: true } }),
  });
  assert.equal(await c.markNotificationAsRead("notification"), true);
});
test("fixture builder refuses to invent a signature for a user without one", async () => {
  await assert.rejects(
    registeredSignature({ id: "missing" }, {}),
    /Missing registered signature/,
  );
});
test("fixture builder rejects unsupported and corrupt registered images", async () => {
  const user = { id: "signer", signature_encrypted: "encrypted" };
  await assert.rejects(
    registeredSignature(user, {
      decrypt: () => "data:image/svg+xml;base64,PHN2Zz4=",
    }),
    /Invalid registered signature/,
  );
  await assert.rejects(
    registeredSignature(user, {
      decrypt: () => "data:image/png;base64,Y29ycnVwdA==",
    }),
  );
});
test("fixture builder uses the registered PNG without drawing a substitute stamp", async () => {
  const bytes = fs.readFileSync(
    path.join(__dirname, "../demo-assets/sample-signature.png"),
  );
  const uri = "data:image/png;base64," + bytes.toString("base64");
  const user = { id: "signer", signature_encrypted: "registered-ciphertext" };
  assert.equal(
    await registeredSignature(user, { decrypt: () => uri }),
    user.signature_encrypted,
  );
});
