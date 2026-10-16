/* PostgreSQL + Nest HTTP integration. Creates ONLY a codex_flow_* scratch schema.
   Never seeds, migrates, or deletes public data. --serve keeps the scratch app for browser QA. */
const path = require("node:path"),
  fs = require("node:fs"),
  crypto = require("node:crypto"),
  assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(root, "server/.env"), quiet: true });
const baseUrl = process.env.DATABASE_URL;
if (!baseUrl) throw new Error("DATABASE_URL missing");
const schema = `codex_flow_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
const url = new URL(baseUrl);
url.searchParams.set("schema", schema);
process.env.DATABASE_URL = url.toString();
process.env.ENCRYPTION_KEY = "isolated-flow-test-key";
process.env.JWT_SECRET = "isolated-flow-test-jwt";
process.env.NODE_ENV = "test";
const { PrismaClient, Prisma } = require("@prisma/client");
const { Test } = require("@nestjs/testing"),
  { ValidationPipe } = require("@nestjs/common");
const { AppModule } = require("../server/dist/src/app.module");
const {
  AllExceptionsFilter,
} = require("../server/dist/src/common/filters/http-exception.filter");
const { PrismaService } = require("../server/dist/src/prisma/prisma.service");
const {
  DocumentsService,
} = require("../server/dist/src/documents/documents.service");
const { PDFDocument } = require("pdf-lib");
const request = require("supertest"),
  bcrypt = require("bcrypt"),
  cookieParser = require("cookie-parser");
const password = "Test#Flow2026!";
const png = fs.existsSync(
  path.join(root, "audit/2026-10-14/verification/test-signature.png"),
)
  ? fs.readFileSync(
      path.join(root, "audit/2026-10-14/verification/test-signature.png"),
    )
  : Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO1cAAAAASUVORK5CYII=",
      "base64",
    );
const results = [],
  artifacts = path.join(root, "audit/2026-10-14/verification");
let app, prisma, baseline, baselineClient, users, types;
const tokens = {};
let lastHTTP = "";
async function check(name, fn) {
  try {
    await fn();
    results.push({ name, status: "PASS" });
  } catch (e) {
    results.push({
      name,
      status: "FAIL",
      detail: e.message + (lastHTTP ? " | " + lastHTTP : ""),
    });
  }
  console.log(`${results.at(-1).status}: ${name}`);
}
const hash = (buffer) =>
  crypto.createHash("sha256").update(buffer).digest("hex");
const api = (method, route, who = "owner") => {
  const q = request(app.getHttpServer())
    [method]("/api" + route)
    .on("response", (r) => {
      if (r.status >= 400)
        lastHTTP = method + " " + route + " " + (r.body?.message ?? r.status);
    });
  return tokens[who] ? q.set("Cookie", tokens[who]) : q;
};
const data = (prefix) => ({
  prefix,
  title: `${prefix} ทดสอบ flow`,
  purpose: "รายละเอียดเอกสารทดสอบ",
  requested_date: "2026-10-15",
  required_date: "2026-10-21",
  vendor_name: prefix === "PO" ? "ผู้ขายทดสอบ" : undefined,
  delivery_date: prefix === "PO" ? "2026-10-25" : undefined,
  items: ["PR", "PO"].includes(prefix)
    ? [
        {
          item_name: "อุปกรณ์ทดสอบ",
          quantity: 2,
          unit_price: 100,
          vat: prefix === "PO" ? 0 : undefined,
        },
      ]
    : undefined,
  visibility: {
    type: "SpecificUsers",
    users: [users.owner.id],
    departments: [],
  },
});
const steps = () => [
  { step_order: 1, approver_id: users.manager.id },
  { step_order: 2, approver_id: users.executive.id },
];
async function create(prefix) {
  if (["PR", "PO", "BK"].includes(prefix))
    return (await api("post", "/documents").send(data(prefix)).expect(201))
      .body;
  const pdf = await PDFDocument.create();
  pdf.addPage([595, 842]);
  pdf.addPage([595, 842]);
  return (
    await api("post", "/documents/upload")
      .field("payload", JSON.stringify(data(prefix)))
      .attach("file", Buffer.from(await pdf.save()), {
        filename: "audit.pdf",
        contentType: "application/pdf",
      })
      .expect(201)
  ).body;
}
async function detail(id, who = "owner") {
  return (await api("get", `/documents/${id}`, who).expect(200)).body;
}
async function submit(doc) {
  return api("post", `/workflows/${doc.real_id}/submit`)
    .send({ workflow_steps: steps() })
    .expect(201);
}
async function approve(id, who) {
  const doc = await detail(id, who);
  return api("post", `/workflows/${id}/approve`, who)
    .send({
      expected_step: doc.workflow.current_step,
      expected_version: doc.versions[0].version_number,
      signature_page: doc.type === "DOC" ? 2 : 1,
      signature_x: who === "manager" ? 36 : 220,
      signature_y: 100,
      date_stamp: true,
      annotation_text: "เห็นควรอนุมัติ",
    })
    .expect(201);
}
async function download(id, number, who = "owner") {
  return api(
    "get",
    `/documents/${id}/download${number ? `?v=${number}&download=true` : "?download=true"}`,
    who,
  )
    .buffer(true)
    .parse((response, cb) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => cb(null, Buffer.concat(chunks)));
    })
    .expect(200);
}
async function primaryCounts() {
  return baselineClient.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    return {
      documents: await tx.document.count(),
      versions: await tx.documentVersion.count(),
      users: await tx.user.count(),
    };
  });
}
async function cleanup() {
  if (app) await app.close();
  if (prisma) await prisma.$disconnect();
  if (baselineClient) {
    if (!/^codex_flow_\d+_[a-f0-9]{6}$/.test(schema))
      throw new Error("Unsafe schema cleanup target");
    await baselineClient.$executeRawUnsafe(
      `DROP SCHEMA IF EXISTS "${schema}" CASCADE`,
    );
    await baselineClient.$disconnect();
  }
}
async function main() {
  fs.mkdirSync(artifacts, { recursive: true });
  baselineClient = new PrismaClient({ datasources: { db: { url: baseUrl } } });
  baseline = await primaryCounts();
  const push = spawnSync(
    process.execPath,
    [
      path.join(root, "node_modules/prisma/build/index.js"),
      "db",
      "push",
      "--skip-generate",
      "--schema",
      path.join(root, "server/prisma/schema.prisma"),
    ],
    { cwd: path.join(root, "server"), env: process.env, encoding: "utf8" },
  );
  if (push.status !== 0)
    throw new Error(
      `Scratch schema setup failed: ${push.stderr.replace(/postgresql:\/\/\S+/g, "[connection redacted]").slice(0, 500)}`,
    );
  if (!push.stdout.includes(schema))
    throw new Error("Prisma did not report the requested scratch schema");
  const runtime = path.join(artifacts, "runtime", schema);
  fs.mkdirSync(runtime, { recursive: true });
  process.chdir(runtime);
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = module.createNestApplication({ logger: false });
  app.use(cookieParser());
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();
  prisma = app.get(PrismaService);
  const department = await prisma.department.create({
    data: { name: "แผนกทดสอบ" },
  });
  const otherDept = await prisma.department.create({
    data: { name: "แผนกภายนอก" },
  });
  const position = await prisma.position.create({
    data: { name: "ตำแหน่งทดสอบ" },
  });
  const ownerPerms = [
    "document.view_list:view",
    "document.view_version_history:view",
    "document.view_detail:view",
    "document.preview_document:view",
    "document.download_document:view",
    "document.edit_document:edit",
    "document.delete_document:delete",
    "document.submit_document:create",
    "submissions.create_document:create",
    "submissions.edit_document:edit",
    "submissions.delete_document:delete",
    "submissions.submit_document:create",
    "submissions.view_list:view",
    "profile.upload_signature:edit",
    "document.view_folders:view",
    "document.manage_folders:create",
    "document.manage_folders:edit",
    "document.manage_folders:delete",
    "document.move_to_folder:edit",
    "dashboard.view_employee:view",
    "notifications.view_notifications:view",
    "notifications.mark_read:edit",
  ];
  const approvalPerms = [
    ...ownerPerms,
    "approvals.view_list:view",
    "approvals.open_doc_detail:view",
    "approvals.approve_document:approve",
    "approvals.reject_document:approve",
    "approvals.return_document:approve",
    "approvals.place_signature:approve",
    "approvals.add_comment:edit",
  ];
  const adminPerms = [
    ...approvalPerms,
    "submissions.view_all:view",
    "masterdata.access:view",
    "masterdata.access:edit",
    "masterdata.access:delete",
    "masterdata.signatures:edit",
    "config.access:view",
    "config.access:edit",
    "config.role_management:view",
    "config.role_management:create",
    "config.role_management:edit",
    "config.role_management:delete",
    "config.user_management:view",
    "config.user_management:create",
    "config.user_management:edit",
    "auditlog.access:view",
    "reports.access:view",
    "reports.view_reports:view",
  ];
  const createRole = async (name, keys) => {
    const role = await prisma.role.create({ data: { name } });
    for (const key of [...new Set(keys)]) {
      const [module, action] = key.split(":");
      const permission = await prisma.permission.upsert({
        where: { module_action: { module, action } },
        create: { module, action },
        update: {},
      });
      await prisma.rolePermission.create({
        data: { role_id: role.id, permission_id: permission.id },
      });
    }
    return role;
  };
  const ownerRole = await createRole("Employee", ownerPerms),
    managerRole = await createRole("Manager", approvalPerms),
    executiveRole = await createRole("Executive", approvalPerms),
    adminRole = await createRole("Administrator", adminPerms),
    emptyRole = await createRole("No permissions", []);
  users = {};
  const passwordHash = await bcrypt.hash(password, 10);
  for (const [name, role, dept] of [
    ["owner", ownerRole, department],
    ["manager", managerRole, department],
    ["manager2", managerRole, department],
    ["executive", executiveRole, department],
    ["outsider", ownerRole, otherDept],
    ["admin", adminRole, department],
    ["empty", emptyRole, otherDept],
  ])
    users[name] = await prisma.user.create({
      data: {
        username: name,
        first_name: "ทดสอบ",
        last_name: name,
        email: `${name}@example.test`,
        password_hash: passwordHash,
        role_id: role.id,
        department_id: dept.id,
        position_id: position.id,
      },
    });
  types = {};
  for (const prefix of ["PR", "PO", "BK", "DOC"]) {
    const t = await prisma.documentType.create({
      data: { prefix, type_name: `${prefix} ทดสอบ` },
    });
    types[prefix] = t;
    await prisma.runningNumber.create({
      data: {
        document_type_id: t.id,
        prefix,
        year_format: "YYYY",
        last_reset_year: new Date().getFullYear(),
      },
    });
    await prisma.approvalMatrix.createMany({
      data: [
        {
          document_type_id: t.id,
          step_order: 1,
          required_role_id: managerRole.id,
        },
        {
          document_type_id: t.id,
          step_order: 2,
          required_role_id: executiveRole.id,
        },
      ],
    });
  }
  for (const name of Object.keys(users)) {
    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ username: name, password })
      .expect(200);
    tokens[name] = login.headers["set-cookie"][0].split(";")[0];
  }
  for (const name of ["owner", "manager", "manager2", "executive"])
    await api("post", "/users/me/signature", name)
      .attach("file", png, {
        filename: "signature.png",
        contentType: "image/png",
      })
      .expect(201);
  await check(
    "HTTP requires authentication for documents/workflow/signature",
    async () => {
      await request(app.getHttpServer())
        .get(`/api/workflows/PR-2026-0001`)
        .expect(401);
      await request(app.getHttpServer())
        .get(`/api/users/${users.manager.id}/signature`)
        .expect(401);
      await request(app.getHttpServer()).get("/api/documents").expect(401);
    },
  );
  await check(
    "Empty-permission user cannot change approval master",
    async () => {
      await api("patch", `/admin/workflows/${types.PR.id}`, "empty")
        .send({ levels: 0, steps: [] })
        .expect(403);
    },
  );
  await check(
    "Signature accepts real PNG; rejects corrupt bytes and SVG",
    async () => {
      await api("post", "/users/me/signature")
        .attach("file", Buffer.from("bad"), {
          filename: "bad.png",
          contentType: "image/png",
        })
        .expect(400);
      await api("post", "/users/me/signature")
        .attach("file", Buffer.from("<svg/>"), {
          filename: "bad.svg",
          contentType: "image/svg+xml",
        })
        .expect(400);
    },
  );
  await check(
    "Creation permission and nested item input enforced",
    async () => {
      await api("post", "/documents", "empty").send(data("PR")).expect(403);
      await api("post", "/documents")
        .send({
          ...data("PR"),
          items: [{ item_name: "bad", quantity: -1, unit_price: 100 }],
        })
        .expect(400);
    },
  );
  await check("Invalid master update preserves previous steps", async () => {
    await api("patch", `/admin/workflows/${types.PR.id}`, "admin")
      .send({ levels: 2, steps: ["Manager", "Missing Role"] })
      .expect(400);
    assert.equal(
      await prisma.approvalMatrix.count({
        where: { document_type_id: types.PR.id },
      }),
      2,
    );
  });
  for (const prefix of ["PR", "PO", "BK", "DOC"])
    await check(
      `${prefix}: Draft, private visibility, named approvals, signed download, immutable versions`,
      async () => {
        const doc = await create(prefix);
        assert.equal(doc.status, "Draft");
        assert.equal(doc.visibility.type, "SpecificUsers");
        assert.equal(doc.versions[0].version_number, 1);
        if (prefix === "PR") {
          assert.equal(Number(doc.pr_form.total_amount), 200);
          assert.equal(doc.pr_form.required_date.slice(0, 10), "2026-10-21");
        }
        if (prefix === "PO") {
          assert.equal(Number(doc.po_form.total_amount), 200);
          assert.equal(Number(doc.po_form.items[0].vat), 0);
          assert.equal(Number(doc.po_form.items[0].total_price), 200);
        }
        if (prefix === "DOC") assert.equal(doc.purpose, data(prefix).purpose);
        await api("get", `/documents/${doc.real_id}`, "outsider").expect(403);
        await api(
          "get",
          `/documents/${doc.real_id}/download?download=true`,
          "outsider",
        ).expect(403);
        await api("get", `/workflows/${doc.real_id}`, "outsider").expect(403);
        await api("post", `/workflows/${doc.real_id}/submit`, "outsider")
          .send({ workflow_steps: steps() })
          .expect(403);
        await api("post", `/workflows/${doc.real_id}/submit`)
          .send({ workflow_steps: [steps()[0]] })
          .expect(400);
        await api("post", `/workflows/${doc.real_id}/submit`)
          .send({
            workflow_steps: [
              { step_order: 1, approver_id: users.owner.id },
              steps()[1],
            ],
          })
          .expect(400);
        await submit(doc);
        let current = await detail(doc.real_id, "manager");
        assert.equal(current.status, "Pending");
        assert.equal(current.workflow.current_step, 1);
        const text = JSON.stringify(current);
        for (const secret of [
          "password_hash",
          "reset_token",
          "signature_encrypted",
        ])
          assert.ok(!text.includes(secret));
        await api("post", `/workflows/${doc.real_id}/approve`, "manager2")
          .send({
            expected_step: 1,
            expected_version: current.versions[0].version_number,
          })
          .expect(403);
        const first = await approve(doc.real_id, "manager");
        assert.equal(first.body.signature_applied, true);
        const signed = await download(doc.real_id, first.body.new_version);
        assert.ok((await PDFDocument.load(signed.body)).getPageCount() >= 1);
        const snapshotHash = hash(signed.body);
        const oldVersion = first.body.new_version;
        const stale = await api(
          "post",
          `/workflows/${doc.real_id}/approve`,
          "manager",
        ).send({ expected_step: 1, expected_version: oldVersion - 1 });
        assert.ok([403, 409].includes(stale.status));
        const final = await approve(doc.real_id, "executive");
        assert.equal(final.body.is_completed, true);
        current = await detail(doc.real_id);
        assert.equal(current.status, "Approved");
        const finalPdf = await download(doc.real_id);
        fs.writeFileSync(
          path.join(artifacts, `${prefix}-approved.pdf`),
          finalPdf.body,
        );
        assert.ok(finalPdf.body.length > 500);
        assert.equal(
          hash((await download(doc.real_id, oldVersion)).body),
          snapshotHash,
        );
        await api("put", `/documents/${doc.real_id}`)
          .send(data(prefix))
          .expect(409);
        await api("post", `/documents/${doc.real_id}/upload-new-version`)
          .attach("file", finalPdf.body, {
            filename: "new.pdf",
            contentType: "application/pdf",
          })
          .expect(409);
        await api("post", `/workflows/${doc.real_id}/reject`, "executive")
          .send({
            comment: "late",
            reject_type: "return",
            expected_step: 2,
            expected_version: final.body.new_version,
          })
          .expect(409);
        await api(
          "get",
          `/documents/${doc.real_id}/download?v=999&download=true`,
        ).expect(404);
        if (prefix === "PR")
          await api(
            "get",
            current.workflow.steps[0].signature_url.replace("/api", ""),
          ).expect(200);
      },
    );
  await check(
    "Return/edit/resubmit preserves previous form and previous workflow history",
    async () => {
      const doc = await create("BK");
      await submit(doc);
      let current = await detail(doc.real_id, "manager");
      await api("post", `/workflows/${doc.real_id}/reject`, "manager")
        .send({
          comment: "กรุณาแก้ไข",
          reject_type: "return",
          expected_step: 1,
          expected_version: current.versions[0].version_number,
        })
        .expect(201);
      current = await detail(doc.real_id);
      const old = current.versions[0];
      const previous = (await download(doc.real_id, old.version_number)).body;
      await api("put", `/documents/${doc.real_id}`, "outsider")
        .send({ ...data("BK"), purpose: "wrong" })
        .expect(403);
      await api("put", `/documents/${doc.real_id}`)
        .send({ ...data("BK"), purpose: "ข้อความที่แก้ไขแล้ว", title: "แก้ไข" })
        .expect(200);
      await submit(doc);
      current = await detail(doc.real_id);
      assert.equal(current.workflow.steps[0].approver_id, users.manager.id);
      assert.equal(
        current.versions[0].form_data._meta.workflow_history.length,
        1,
      );
      assert.equal(
        hash((await download(doc.real_id, old.version_number)).body),
        hash(previous),
      );
      assert.notEqual(
        current.versions[0].form_data.detail,
        old.form_data.detail,
      );
      await approve(doc.real_id, "manager");
      await approve(doc.real_id, "executive");
    },
  );
  await check(
    "DOC edit reuses existing file without uploading a replacement",
    async () => {
      const d = await create("DOC");
      const before = (await download(d.real_id)).body;
      const edit = await api("put", `/documents/${d.real_id}`)
        .send({
          ...data("DOC"),
          title: "แก้เฉพาะข้อมูล",
          purpose: "คำอธิบายใหม่",
        })
        .expect(200);
      assert.equal(edit.body.purpose, "คำอธิบายใหม่");
      assert.equal(edit.body.has_file, true);
      assert.equal(hash((await download(d.real_id)).body), hash(before));
    },
  );
  await check(
    "Cancel stops inbox and prevents approval; soft delete is separate",
    async () => {
      const doc = await create("PR");
      await submit(doc);
      await api("post", `/documents/${doc.real_id}/cancel`)
        .send({ reason: "ยกเลิกทดสอบ" })
        .expect(201);
      const current = await detail(doc.real_id);
      assert.equal(current.status, "Cancelled");
      assert.equal(current.workflow.status, "Rejected");
      await api("post", `/workflows/${doc.real_id}/approve`, "manager")
        .send({
          expected_step: 1,
          expected_version: current.versions[0].version_number,
        })
        .expect(409);
      assert.ok(
        !(await api("get", "/approvals", "manager")).body.some(
          (d) => d.real_id === doc.real_id,
        ),
      );
      await api("delete", `/documents/${doc.real_id}`).expect(200);
      await api("get", `/documents/${doc.real_id}`).expect(404);
    },
  );
  await check(
    "Concurrent creation allocates distinct running numbers",
    async () => {
      const docs = await Promise.all(
        Array.from({ length: 12 }, () => create("BK")),
      );
      assert.equal(new Set(docs.map((d) => d.doc_number)).size, 12);
    },
  );
  await check(
    "Concurrent approvals have one winner and one conflict",
    async () => {
      const doc = await create("BK");
      await submit(doc);
      const d = await detail(doc.real_id, "manager");
      const payload = {
        expected_step: 1,
        expected_version: d.versions[0].version_number,
      };
      const answers = await Promise.all([
        api("post", `/workflows/${doc.real_id}/approve`, "manager").send(
          payload,
        ),
        api("post", `/workflows/${doc.real_id}/approve`, "manager").send(
          payload,
        ),
      ]);
      assert.equal(answers.filter((r) => r.status === 201).length, 1);
      assert.ok(answers.some((r) => [403, 409].includes(r.status)));
      assert.equal((await detail(doc.real_id)).workflow.current_step, 2);
    },
  );
  await check(
    "Signature/PDF failure rolls back step, document and versions",
    async () => {
      const doc = await create("DOC");
      await submit(doc);
      const d = await detail(doc.real_id, "manager");
      const before = await prisma.documentVersion.count({
        where: { document_id: doc.real_id },
      });
      await api("post", `/workflows/${doc.real_id}/approve`, "manager")
        .send({
          expected_step: 1,
          expected_version: d.versions[0].version_number,
          signature_page: 999,
        })
        .expect(400);
      assert.equal((await detail(doc.real_id)).workflow.current_step, 1);
      assert.equal(
        await prisma.documentVersion.count({
          where: { document_id: doc.real_id },
        }),
        before,
      );
    },
  );
  await check(
    "Inactive user and inactive role invalidate existing JWT",
    async () => {
      await prisma.user.update({
        where: { id: users.manager2.id },
        data: { is_active: false },
      });
      await api("get", "/auth/me", "manager2").expect(401);
      await prisma.role.update({
        where: { id: emptyRole.id },
        data: { is_active: false },
      });
      await api("get", "/auth/me", "empty").expect(401);
    },
  );
  await check("Notification read_at and user scope", async () => {
    const note = await prisma.notification.findFirst({
      where: { user_id: users.owner.id },
    });
    assert.ok(note);
    await api("patch", `/notifications/${note.id}/read`, "outsider").expect(
      200,
    );
    assert.equal(
      (await prisma.notification.findUnique({ where: { id: note.id } }))
        .is_read,
      false,
    );
    await api("patch", `/notifications/${note.id}/read`).expect(200);
    assert.ok(
      (await prisma.notification.findUnique({ where: { id: note.id } }))
        .read_at,
    );
  });
  await check(
    "Running settings persist and partial update keeps year valid",
    async () => {
      const r = await prisma.runningNumber.findUnique({
        where: { document_type_id: types.BK.id },
      });
      await api("patch", `/admin/running-numbers/${r.id}`, "admin")
        .send({ padding_length: 5 })
        .expect(200);
      assert.ok(
        Number.isInteger(
          (await prisma.runningNumber.findUnique({ where: { id: r.id } }))
            .last_reset_year,
        ),
      );
      await api("patch", `/admin/running-numbers/${r.id}`, "admin")
        .send({
          yearFormat: "be4",
          resetCycle: "yearly",
          separator: "-",
          runningDigits: 5,
        })
        .expect(200);
      const d = await create("BK");
      assert.match(
        d.doc_number,
        new RegExp(`^BK-${new Date().getFullYear() + 543}-\\d{5}$`),
      );
    },
  );
  await check(
    "Master departments use soft delete and can be restored",
    async () => {
      const r = await api("post", "/admin/departments", "admin")
        .send({ name: "แผนกสำรอง" })
        .expect(201);
      await api("delete", `/admin/departments/${r.body.id}`, "admin").expect(
        200,
      );
      assert.equal(
        (await prisma.department.findUnique({ where: { id: r.body.id } }))
          .is_active,
        false,
      );
      await api("patch", `/admin/departments/${r.body.id}`, "admin")
        .send({ is_active: true })
        .expect(200);
    },
  );
  await check(
    "Folder visibility, document visibility and move permissions are enforced",
    async () => {
      const doc = await create("BK");
      await submit(doc);
      await approve(doc.real_id, "manager");
      await approve(doc.real_id, "executive");
      const f = (
        await api("post", "/folders")
          .send({ name: "ส่วนตัว", visibility: "Private" })
          .expect(201)
      ).body;
      await api("get", `/folders/${f.id}`, "outsider").expect(403);
      await api("post", "/folders/move-doc", "outsider")
        .send({ document_id: doc.real_id, target_folder_id: f.id })
        .expect(403);
      await api("post", "/folders/move-doc")
        .send({ document_id: doc.real_id, target_folder_id: f.id })
        .expect(201);
      assert.equal(
        (await api("get", `/folders/${f.id}`).expect(200)).body.documents
          .length,
        1,
      );
      const publicFolder = (
        await api("post", "/folders")
          .send({ name: "สาธารณะ", visibility: "CompanyWide" })
          .expect(201)
      ).body;
      await api("post", "/folders/move-doc")
        .send({ document_id: doc.real_id, target_folder_id: publicFolder.id })
        .expect(201);
      assert.equal(
        (await api("get", `/folders/${publicFolder.id}`, "outsider")).body
          .documents.length,
        0,
      );
    },
  );
  await check(
    "Signature management persists, clears original only, preserves signed PDF",
    async () => {
      const approved = await prisma.document.findFirst({
        where: { type_id: types.PR.id, status: "Approved" },
      });
      const before = await download(approved.id);
      await api("patch", `/admin/signatures/${users.manager.id}`, "admin")
        .send({ imageUrl: null })
        .expect(200);
      await api(
        "get",
        `/users/${users.manager.id}/signature`,
        "manager",
      ).expect(404);
      assert.equal(hash((await download(approved.id)).body), hash(before.body));
      await api("post", "/users/me/signature", "manager")
        .attach("file", png, { filename: "sig.png", contentType: "image/png" })
        .expect(201);
    },
  );
  await check(
    "Dashboard respects visibility; returns real counts",
    async () => {
      const stats = await api("get", "/dashboard/stats", "outsider").expect(
        200,
      );
      assert.equal(stats.body.total, 0);
      const own = await api("get", "/dashboard/stats").expect(200);
      assert.ok(own.body.total > 0);
      assert.ok(own.body.trend.length === 7);
    },
  );
  await check(
    "Password reset delivers through local SMTP sink, consumes token once and revokes old JWT",
    async () => {
      const net = require("node:net");
      let delivered = "";
      const smtp = net.createServer((socket) => {
        socket.write("220 test.local ESMTP\r\n");
        let pending = "",
          inside = false,
          mail = "";
        socket.on("data", (chunk) => {
          pending += chunk.toString();
          let end;
          while ((end = pending.indexOf("\r\n")) >= 0) {
            const line = pending.slice(0, end);
            pending = pending.slice(end + 2);
            if (inside) {
              if (line === ".") {
                inside = false;
                delivered = mail;
                socket.write("250 queued\r\n");
              } else mail += line + "\r\n";
            } else if (line.startsWith("EHLO") || line.startsWith("HELO"))
              socket.write("250 test.local\r\n");
            else if (line === "DATA") {
              inside = true;
              socket.write("354 send data\r\n");
            } else if (line === "QUIT") {
              socket.write("221 bye\r\n");
              socket.end();
            } else socket.write("250 OK\r\n");
          }
        });
      });
      await new Promise((resolve) => smtp.listen(0, "127.0.0.1", resolve));
      process.env.SMTP_HOST = "127.0.0.1";
      process.env.SMTP_PORT = String(smtp.address().port);
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      try {
        await request(app.getHttpServer())
          .post("/api/auth/forgot-password")
          .send({ email: users.outsider.email })
          .expect(200);
        const message = delivered.replace(/=\r\n/g, "").replace(/=3D/gi, "=");
        const match = message.match(/token=([a-f0-9]{64})/);
        assert.ok(match, "SMTP message must contain reset link");
        const token = match[1];
        const stored = (
          await prisma.user.findUnique({ where: { id: users.outsider.id } })
        ).reset_token;
        assert.notEqual(stored, token);
        await request(app.getHttpServer())
          .post("/api/auth/reset-password")
          .send({ token, password_hash: "New#Flow2026!" })
          .expect(200);
        await api("get", "/auth/me", "outsider").expect(401);
        await request(app.getHttpServer())
          .post("/api/auth/reset-password")
          .send({ token, password_hash: "New#Flow2026!" })
          .expect(401);
        await request(app.getHttpServer())
          .post("/api/auth/login")
          .send({ username: "outsider", password: "New#Flow2026!" })
          .expect(200);
      } finally {
        await new Promise((resolve) => smtp.close(resolve));
        delete process.env.SMTP_HOST;
        delete process.env.SMTP_PORT;
      }
    },
  );
  await check(
    "Legacy current version freezes before editing or approval",
    async () => {
      const doc = await create("BK");
      const first = doc.versions[0];
      await prisma.documentVersion.update({
        where: { id: first.id },
        data: {
          form_data: { subject: "Legacy subject", detail: "Legacy original" },
        },
      });
      await api("put", `/documents/${doc.real_id}`)
        .send({ ...data("BK"), purpose: "New after legacy" })
        .expect(200);
      const archived = await prisma.documentVersion.findUnique({
        where: { id: first.id },
      });
      assert.ok(archived.form_data._meta);
      assert.ok(archived.file_data.length > 100);
      const stable = hash(
        (await download(doc.real_id, first.version_number)).body,
      );
      await submit(doc);
      await approve(doc.real_id, "manager");
      assert.equal(
        hash((await download(doc.real_id, first.version_number)).body),
        stable,
      );
      await prisma.documentVersion.update({
        where: { id: first.id },
        data: { file_data: null, form_data: Prisma.DbNull },
      });
      await api(
        "get",
        `/documents/${doc.real_id}/download?v=${first.version_number}&download=true`,
      ).expect(409);
    },
  );
  await check(
    "Admin creates users with chosen password and inactive status; password reset revokes sessions",
    async () => {
      const ref = {
        username: "newmember",
        email: "newmember@example.test",
        first_name: "สมาชิก",
        last_name: "ใหม่",
        department_id: users.owner.department_id,
        position_id: users.owner.position_id,
        role_id: users.owner.role_id,
        password: "Member#2026!",
        is_active: false,
      };
      const created = await api("post", "/admin/users", "admin")
        .send(ref)
        .expect(201);
      assert.ok(!JSON.stringify(created.body).includes("password_hash"));
      await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ username: ref.username, password: ref.password })
        .expect(401);
      await api("patch", `/admin/users/${created.body.id}`, "admin")
        .send({ is_active: true })
        .expect(200);
      const login = await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ username: ref.username, password: ref.password })
        .expect(200);
      const oldCookie = login.headers["set-cookie"][0].split(";")[0];
      await api(
        "post",
        `/admin/users/${created.body.id}/reset-password`,
        "admin",
      )
        .send({ password_hash: "Member#New2026!" })
        .expect(201);
      await request(app.getHttpServer())
        .get("/api/auth/me")
        .set("Cookie", oldCookie)
        .expect(401);
      await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ username: ref.username, password: "Member#New2026!" })
        .expect(200);
      await api("post", "/admin/users", "admin").send(ref).expect(409);
    },
  );
  await check(
    "Custom master document type uploads and signs a PDF using its own matrix",
    async () => {
      const t = await api("post", "/admin/document-types", "admin")
        .send({ prefix: "EXP", type_name: "เอกสารค่าใช้จ่าย" })
        .expect(201);
      await api("patch", `/admin/workflows/${t.body.id}`, "admin")
        .send({ levels: 2, steps: ["Manager", "Executive"] })
        .expect(200);
      await api("post", "/documents").send(data("EXP")).expect(400);
      const doc = await create("EXP");
      await submit(doc);
      await approve(doc.real_id, "manager");
      await approve(doc.real_id, "executive");
      const done = await detail(doc.real_id);
      assert.equal(done.status, "Approved");
      const bytes = (await download(doc.real_id)).body;
      assert.equal((await PDFDocument.load(bytes)).getPageCount(), 2);
    },
  );
  await check(
    "Company settings persist and previous versions keep their frozen company",
    async () => {
      await api("post", "/admin/settings", "owner")
        .send({ companyName: "Unauthorized" })
        .expect(403);
      await api("post", "/admin/settings", "admin")
        .send({
          companyName: "บริษัททดสอบรุ่นแรก",
          companyAddress: "ที่อยู่ทดสอบ",
        })
        .expect(201);
      const doc = await create("BK");
      assert.equal(doc._meta.company.companyName, "บริษัททดสอบรุ่นแรก");
      const old = hash((await download(doc.real_id, 1)).body);
      await api("post", "/admin/settings", "admin")
        .send({
          companyName: "บริษัททดสอบรุ่นใหม่",
          companyAddress: "ที่อยู่ใหม่",
        })
        .expect(201);
      assert.equal(
        (await api("get", "/admin/settings").expect(200)).body.companyName,
        "บริษัททดสอบรุ่นใหม่",
      );
      await api("put", `/documents/${doc.real_id}`)
        .send({ ...data("BK"), title: "แก้ไขใหม่" })
        .expect(200);
      assert.equal(hash((await download(doc.real_id, 1)).body), old);
      const latest = await detail(doc.real_id);
      assert.equal(
        latest.versions[0].form_data._meta.company.companyName,
        "บริษัททดสอบรุ่นใหม่",
      );
      assert.equal(
        latest.versions.find((v) => v.version_number === 1).form_data._meta
          .company.companyName,
        "บริษัททดสอบรุ่นแรก",
      );
    },
  );
  await check(
    "Version history permission protects history API and historical file reads",
    async () => {
      const doc = await create("BK");
      await submit(doc);
      const p = await prisma.permission.findUnique({
        where: {
          module_action: {
            module: "document.view_version_history",
            action: "view",
          },
        },
      });
      await prisma.rolePermission.deleteMany({
        where: { role_id: users.owner.role_id, permission_id: p.id },
      });
      try {
        const current = await detail(doc.real_id);
        assert.equal(current.versions.length, 1);
        await api("get", `/documents/${doc.real_id}/versions`).expect(403);
        await api(
          "get",
          `/documents/${doc.real_id}/download?v=1&download=true`,
        ).expect(403);
        await download(doc.real_id);
      } finally {
        await prisma.rolePermission.create({
          data: { role_id: users.owner.role_id, permission_id: p.id },
        });
      }
    },
  );
  await check(
    "Later approvals preserve prior signer image and creator image after profile changes",
    async () => {
      const doc = await create("PR");
      await submit(doc);
      await approve(doc.real_id, "manager");
      const signed = await detail(doc.real_id);
      const number = signed.versions[0].version_number;
      const original = await api(
        "get",
        `/documents/${doc.real_id}/versions/${number}/signatures/1`,
      ).expect(200);
      const creator = await api(
        "get",
        `/documents/${doc.real_id}/versions/${number}/signatures/0`,
      ).expect(200);
      const alternate = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO1cAAAAASUVORK5CYII=",
        "base64",
      );
      for (const who of ["manager", "owner"])
        await api("post", "/users/me/signature", who)
          .attach("file", alternate, {
            filename: "changed.png",
            contentType: "image/png",
          })
          .expect(201);
      try {
        await approve(doc.real_id, "executive");
        const done = await detail(doc.real_id);
        const v = done.versions[0].version_number;
        const first = await api(
          "get",
          `/documents/${doc.real_id}/versions/${v}/signatures/1`,
        ).expect(200);
        const maker = await api(
          "get",
          `/documents/${doc.real_id}/versions/${v}/signatures/0`,
        ).expect(200);
        assert.equal(hash(first.body), hash(original.body));
        assert.equal(hash(maker.body), hash(creator.body));
      } finally {
        for (const who of ["manager", "owner"])
          await api("post", "/users/me/signature", who)
            .attach("file", png, {
              filename: "original.png",
              contentType: "image/png",
            })
            .expect(201);
      }
    },
  );
  await check(
    "My Submissions lists 200 documents with a 3 MB signer profile without duplicating binary data",
    async () => {
      const previous = await prisma.user.findUnique({
        where: { id: users.owner.id },
        select: { signature_encrypted: true },
      });
      const largeSignature =
        "large-signature-fixture:" + "x".repeat(3 * 1024 * 1024);
      try {
        await prisma.user.update({
          where: { id: users.owner.id },
          data: { signature_encrypted: largeSignature },
        });
        const ids = Array.from({ length: 200 }, () => crypto.randomUUID());
        await prisma.document.createMany({
          data: ids.map((id, i) => ({
            id,
            doc_number: `LIST-STRESS-${i}`,
            title: `List regression ${i}`,
            type_id: types.DOC.id,
            creator_id: users.owner.id,
            tags: [],
            visibility_type: "CompanyWide",
            visibility_departments: [],
            visibility_users: [],
          })),
        });
        await prisma.documentVersion.create({
          data: {
            document_id: ids[0],
            version_number: 1,
            uploaded_by_id: users.owner.id,
            file_data: Buffer.from("%PDF-1.7 regression fixture"),
            file_size: "27",
            file_extension: "pdf",
            form_data: {
              _meta: { creator: { signature_encrypted: largeSignature } },
            },
          },
        });
        const response = await api("get", "/documents?limit=200&page=1").expect(
          200,
        );
        assert.equal(response.body.data.length, 200);
        assert.ok(
          Buffer.byteLength(response.text) < 2 * 1024 * 1024,
          "List response must contain metadata only",
        );
        assert.ok(!response.text.includes("large-signature-fixture:"));
        assert.ok(!response.text.includes("password_hash"));
        const withFile = response.body.data.find(
          (doc) => doc.real_id === ids[0],
        );
        assert.equal(withFile.has_file, true);
        assert.equal(withFile.versions[0].has_file, true);
        assert.equal(withFile.versions[0].form_data, null);
        assert.equal(
          response.body.data.find((doc) => doc.real_id === ids[1]).has_file,
          false,
        );
      } finally {
        await prisma.user.update({
          where: { id: users.owner.id },
          data: { signature_encrypted: previous.signature_encrypted },
        });
      }
    },
  );
  await check(
    "Retried and concurrent create requests produce one document and one initial version",
    async () => {
      const requestId = crypto.randomUUID();
      const payload = { ...data("PR"), client_request_id: requestId };
      const before = await prisma.document.count();
      const responses = await Promise.all([
        api("post", "/documents").send(payload).expect(201),
        api("post", "/documents").send(payload).expect(201),
      ]);
      assert.equal(responses[0].body.real_id, requestId);
      assert.equal(responses[1].body.real_id, requestId);
      assert.equal(await prisma.document.count(), before + 1);
      assert.equal(
        await prisma.documentVersion.count({
          where: { document_id: requestId },
        }),
        1,
      );
      await api("post", "/documents").send(payload).expect(201);
      assert.equal(
        await prisma.documentVersion.count({
          where: { document_id: requestId },
        }),
        1,
      );
      await api("post", "/documents", "admin").send(payload).expect(409);
      await api("post", "/documents")
        .send({ ...payload, client_request_id: "invalid" })
        .expect(400);
      await submit(responses[0].body);
      const replay = await api("post", "/documents").send(payload).expect(201);
      assert.equal(replay.body.status, "Pending");
      assert.equal(await prisma.document.count(), before + 1);
    },
  );
  await check(
    "Multipart upload retries preserve one PDF document",
    async () => {
      const requestId = crypto.randomUUID(),
        pdf = await PDFDocument.create();
      pdf.addPage();
      const bytes = Buffer.from(await pdf.save());
      const before = await prisma.document.count();
      for (let i = 0; i < 2; i++) {
        const response = await api("post", "/documents/upload")
          .field(
            "payload",
            JSON.stringify({ ...data("DOC"), client_request_id: requestId }),
          )
          .attach("file", bytes, {
            filename: "retry.pdf",
            contentType: "application/pdf",
          })
          .expect(201);
        assert.equal(response.body.real_id, requestId);
      }
      assert.equal(await prisma.document.count(), before + 1);
      assert.equal(
        await prisma.documentVersion.count({
          where: { document_id: requestId },
        }),
        1,
      );
    },
  );
  await check(
    "Legacy dashboard permissions work consistently in login, JWT, statistics and role settings",
    async () => {
      const role = await createRole("Legacy dashboard regression", [
        "dashboard:view_employee",
        "dashboard:view_executive",
        "document.view_list:view",
        "approvals.view_list:view",
      ]);
      await prisma.user.create({
        data: {
          username: "legacy_dashboard",
          email: "legacy_dashboard@example.test",
          password_hash: passwordHash,
          first_name: "Legacy",
          last_name: "Dashboard",
          role_id: role.id,
          department_id: department.id,
        },
      });
      const login = await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ username: "legacy_dashboard", password })
        .expect(200);
      tokens.legacy_dashboard = login.headers["set-cookie"][0].split(";")[0];
      for (const key of [
        "dashboard.view_employee:view",
        "dashboard.employee_stat_cards:view",
        "dashboard.view_executive:view",
        "dashboard.executive_stat_cards:view",
      ])
        assert.ok(login.body.user.permissions.includes(key));
      const profile = await api("get", "/auth/me", "legacy_dashboard").expect(
        200,
      );
      assert.ok(
        profile.body.permissions.includes(
          "dashboard.executive_recent_activity:view",
        ),
      );
      await api("get", "/dashboard/stats", "legacy_dashboard").expect(200);
      const roles = await api("get", "/admin/roles", "admin").expect(200);
      const displayed = roles.body.find((entry) => entry.id === role.id);
      assert.ok(
        displayed.permissions.some(
          (entry) =>
            entry.module === "dashboard.executive_stat_cards" &&
            entry.action === "view",
        ),
      );
      await api("patch", `/admin/roles/${role.id}`, "admin")
        .send({
          permissions: [
            { module: "dashboard.view_employee", action: "view" },
            { module: "dashboard.employee_recent_docs", action: "view" },
          ],
        })
        .expect(200);
      const changed = await api("get", "/auth/me", "legacy_dashboard").expect(
        200,
      );
      assert.ok(
        changed.body.permissions.includes(
          "dashboard.employee_recent_docs:view",
        ),
      );
      assert.ok(
        !changed.body.permissions.includes(
          "dashboard.employee_stat_cards:view",
        ),
      );
      assert.ok(
        !changed.body.permissions.includes("dashboard.view_executive:view"),
      );
    },
  );
  await check(
    "Application uses scratch schema and primary inspection stays read-only",
    async () => {
      const [location] = await prisma.$queryRawUnsafe(
        "SELECT current_schema() AS name",
      );
      assert.equal(location.name, schema);
      await baselineClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
        const [mode] = await tx.$queryRawUnsafe(
          "SELECT current_setting('transaction_read_only') AS mode",
        );
        assert.equal(mode.mode, "on");
      });
    },
  );
  const summary = {
    date: "2026-10-15",
    kind: "PostgreSQL and Nest HTTP integration using isolated scratch schema",
    schema,
    primaryBefore: baseline,
    primaryAfter: await primaryCounts(),
    total: results.length,
    passed: results.filter((r) => r.status === "PASS").length,
    failed: results.filter((r) => r.status === "FAIL").length,
    results,
  };
  fs.writeFileSync(
    path.join(artifacts, "e2e-results.json"),
    JSON.stringify(summary, null, 2),
  );
  console.log(
    `TOTAL ${summary.total} PASS ${summary.passed} FAIL ${summary.failed}`,
  );
  if (process.argv.includes("--serve")) {
    await app.listen(4300, "127.0.0.1");
    console.log(
      "UI_QA_READY http://127.0.0.1:4300 — isolated test users owner / manager / executive / admin",
    );
    process.on("SIGINT", async () => {
      await cleanup();
      process.exit(0);
    });
    process.on("SIGTERM", async () => {
      await cleanup();
      process.exit(0);
    });
    return;
  }
  await cleanup();
  process.exitCode = summary.failed ? 1 : 0;
}
main().catch(async (e) => {
  console.error(e.message);
  await cleanup().catch(() => {});
  process.exitCode = 2;
});
