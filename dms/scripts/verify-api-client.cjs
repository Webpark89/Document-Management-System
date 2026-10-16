const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { test } = require("node:test");

const source = fs.readFileSync(
  path.join(__dirname, "../client/src/lib/index.ts"),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

function client(responses, pathname = "/documents") {
  const calls = [],
    delays = [];
  const context = {
    exports: {},
    FormData,
    window: { location: { pathname, href: "" } },
    require: (id) => {
      if (id === "./api-client") return { apiClient: {}, API_BASE_URL: "/api" };
      if (id === "./utils") return { cn: () => "" };
      throw new Error(`Unexpected import: ${id}`);
    },
    setTimeout: (callback, delay) => {
      delays.push(delay);
      queueMicrotask(callback);
    },
    fetch: async (...args) => {
      calls.push(args);
      const response = responses.shift();
      if (response instanceof Error) throw response;
      assert.ok(response, "Unexpected repeated request");
      return response;
    },
  };
  vm.runInNewContext(compiled, context);
  return {
    ...context.exports,
    calls,
    delays,
    location: context.window.location,
  };
}
const json = (status, data) => Response.json(data, { status });

test("GET recovers after network failure and a restarting proxy", async () => {
  const c = client([
    new TypeError("Failed to fetch"),
    new Response("Internal Server Error", { status: 500 }),
    json(200, { total: 3 }),
  ]);
  assert.equal((await c.api.get("/api/documents")).data.total, 3);
  assert.equal(c.calls.length, 3);
  assert.deepEqual(c.delays, [500, 1000]);
  assert.equal(c.calls[0][0], "/api/documents");
  assert.equal(c.calls[0][1].credentials, "include");
});
test("real server errors retain their message, status and endpoint", async () => {
  const c = client([json(500, { message: "ไม่สามารถสร้างเอกสารได้" })]);
  await assert.rejects(c.api.get("/api/documents"), (e) => {
    assert.ok(e instanceof c.ApiError);
    assert.equal(e.message, "ไม่สามารถสร้างเอกสารได้");
    assert.equal(e.status, 500);
    assert.equal(e.method, "GET");
    assert.equal(e.path, "/api/documents");
    return true;
  });
  assert.equal(c.calls.length, 1);
});
test("503 preserves SMTP configuration errors without repeating POST", async () => {
  const c = client([json(503, { message: "ระบบส่งอีเมลยังไม่ได้ตั้งค่า" })]);
  await assert.rejects(
    c.api.post("/api/auth/forgot-password", { email: "test@example.invalid" }),
    /ระบบส่งอีเมลยังไม่ได้ตั้งค่า/,
  );
  assert.equal(c.calls.length, 1);
});
for (const method of ["post", "put", "patch", "delete"]) {
  test(`${method.toUpperCase()} is never repeated after a lost connection`, async () => {
    const c = client([new TypeError("Failed to fetch")]);
    await assert.rejects(
      c.api[method]("/api/documents"),
      (e) => e.status === 0,
    );
    assert.equal(c.calls.length, 1);
    assert.equal(c.delays.length, 0);
  });
}
test("persistent gateway outage stops after five GET attempts", async () => {
  const c = client(
    Array.from(
      { length: 5 },
      () => new Response("Bad Gateway", { status: 502 }),
    ),
  );
  await assert.rejects(
    c.api.get("/api/documents"),
    (e) => e.status === 502 && e.message.includes("ยังไม่พร้อมใช้งาน"),
  );
  assert.equal(c.calls.length, 5);
});
test("expired session redirects to login without retries", async () => {
  const c = client([json(401, { message: "กรุณาเข้าสู่ระบบใหม่" })]);
  await assert.rejects(c.api.get("/api/auth/me"), /กรุณาเข้าสู่ระบบใหม่/);
  assert.equal(c.location.href, "/login");
  assert.equal(c.calls.length, 1);
});
test("invalid login stays on the login form", async () => {
  const c = client([json(401, { message: "รหัสผ่านไม่ถูกต้อง" })], "/login");
  await assert.rejects(c.api.post("/api/auth/login", {}), /รหัสผ่านไม่ถูกต้อง/);
  assert.equal(c.location.href, "");
});
test("validation messages remain readable and are not retried", async () => {
  const c = client([
    json(400, { message: ["title is required", "invalid type"] }),
  ]);
  await assert.rejects(
    c.api.post("/api/documents", {}),
    /title is required, invalid type/,
  );
  assert.equal(c.calls.length, 1);
});
test("204 response needs no JSON body", async () => {
  const c = client([new Response(null, { status: 204 })]);
  assert.equal((await c.api.delete("/api/documents/example")).data, undefined);
});
test("multipart upload retains browser-generated content boundary", async () => {
  const form = new FormData();
  form.append("payload", "{}");
  const c = client([json(201, { id: "example" })]);
  await c.api.post("/api/documents/upload", form);
  assert.equal(c.calls[0][1].body, form);
  assert.equal(c.calls[0][1].headers["Content-Type"], undefined);
});
test("invalid success response is not mistaken for a connection failure", async () => {
  const c = client([new Response("not JSON", { status: 200 })]);
  await assert.rejects(
    c.api.get("/api/documents"),
    (e) => e.name === "SyntaxError",
  );
  assert.equal(c.calls.length, 1);
});

function persistence() {
  const base = client([]);
  const code = ts.transpileModule(
    fs.readFileSync(
      path.join(__dirname, "../client/src/lib/submission-persistence.ts"),
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
    crypto: {
      getRandomValues: require("node:crypto").webcrypto.getRandomValues.bind(
        require("node:crypto").webcrypto,
      ),
    },
    require: () => ({ ApiError: base.ApiError }),
  };
  vm.runInNewContext(code, context);
  return { ...context.exports, ApiError: base.ApiError };
}
test("request IDs work on LAN without crypto.randomUUID", () => {
  const p = persistence();
  const a = p.newSubmissionSaveState();
  assert.match(
    a.requestId,
    /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
  );
  assert.notEqual(a.requestId, p.newSubmissionSaveState().requestId);
});
test("lost create response recovers the committed draft instead of creating another", async () => {
  const p = persistence(),
    state = p.newSubmissionSaveState();
  let record = null,
    creates = 0,
    updates = 0;
  const operations = {
    load: async (id) => {
      assert.equal(id, state.requestId);
      return record;
    },
    create: async (id) => {
      creates++;
      record = { real_id: id, status: "Draft" };
      throw new p.ApiError("lost response", 0, "POST", "/api/documents", true);
    },
    update: async (id) => {
      updates++;
      assert.equal(id, record.real_id);
      return record;
    },
  };
  await assert.rejects(p.saveSubmissionDraft(state, operations));
  assert.equal(
    (await p.saveSubmissionDraft(state, operations)).real_id,
    record.real_id,
  );
  assert.equal(creates, 1);
  assert.equal(updates, 1);
});
test("failed create can retry the same request ID after a confirmed 404", async () => {
  const p = persistence(),
    state = p.newSubmissionSaveState();
  let attempts = 0;
  const operations = {
    load: async () => {
      throw new p.ApiError("not found", 404, "GET", "/api/documents");
    },
    create: async (id) => {
      assert.equal(id, state.requestId);
      if (++attempts === 1) throw new Error("rollback");
      return { real_id: id, status: "Draft" };
    },
    update: async () => {
      throw new Error("Unexpected update");
    },
  };
  await assert.rejects(p.saveSubmissionDraft(state, operations));
  assert.equal(
    (await p.saveSubmissionDraft(state, operations)).real_id,
    state.requestId,
  );
  assert.equal(attempts, 2);
});
test("lost submit response does not update or resubmit an already Pending document", async () => {
  const p = persistence(),
    state = p.newSubmissionSaveState("existing");
  const result = await p.saveSubmissionDraft(state, {
    load: async () => ({ real_id: "existing", status: "Pending" }),
    create: async () => {
      throw new Error("Duplicate create");
    },
    update: async () => {
      throw new Error("Pending document must not be edited");
    },
  });
  assert.equal(result.status, "Pending");
});
test("failed submission retains the saved ID for a retry on the same draft", async () => {
  const p = persistence(),
    state = p.newSubmissionSaveState();
  let creates = 0,
    updates = 0;
  const record = { real_id: state.requestId, status: "Draft" };
  const operations = {
    load: async () => record,
    create: async () => {
      creates++;
      return record;
    },
    update: async () => {
      updates++;
      return record;
    },
  };
  await p.saveSubmissionDraft(state, operations);
  // The caller's separate submit fails; the next manual attempt uses savedId.
  await p.saveSubmissionDraft(state, operations);
  assert.equal(state.savedId, record.real_id);
  assert.equal(creates, 1);
  assert.equal(updates, 1);
});
test("unavailable recovery lookup never starts another create", async () => {
  const p = persistence(),
    state = p.newSubmissionSaveState();
  state.attempted = true;
  let writes = 0;
  await assert.rejects(
    p.saveSubmissionDraft(state, {
      load: async () => {
        throw new p.ApiError("unavailable", 503, "GET", "/api/documents");
      },
      create: async () => {
        writes++;
      },
      update: async () => {
        writes++;
      },
    }),
    (e) => e.status === 503,
  );
  assert.equal(writes, 0);
});
test("deleted saved draft is not silently replaced by a new document", async () => {
  const p = persistence(),
    state = p.newSubmissionSaveState("deleted");
  await assert.rejects(
    p.saveSubmissionDraft(state, {
      load: async () => {
        throw new p.ApiError("not found", 404, "GET", "/api/documents");
      },
      create: async () => {
        throw new Error("Unexpected create");
      },
      update: async () => {
        throw new Error("Unexpected update");
      },
    }),
    (e) => e.status === 404,
  );
});
test("document workflow maps nested approver names and roles without a second request", () => {
  const code = ts.transpileModule(
    fs.readFileSync(
      path.join(__dirname, "../client/src/views/features/workflow/api.ts"),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText;
  const context = { exports: {}, require: () => ({}) };
  vm.runInNewContext(code, context);
  const workflow = context.exports.mapWorkflow(
    {
      status: "Pending",
      current_step: 1,
      total_steps: 1,
      steps: [
        {
          id: "step",
          step_order: 1,
          status: "Pending",
          approver: {
            first_name: "Test",
            last_name: "Approver",
            role: { name: "Manager" },
          },
        },
      ],
    },
    "doc",
  );
  assert.equal(workflow.steps[0].approverName, "Test Approver");
  assert.equal(workflow.steps[0].roleName, "Manager");
  assert.equal(context.exports.mapWorkflow(null, "draft"), null);
});
