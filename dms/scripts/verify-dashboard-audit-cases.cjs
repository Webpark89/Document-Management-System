const assert = require("node:assert/strict");

module.exports = async function verifyDashboardAudit({
  check,
  api,
  prisma,
  users,
  data,
  detail,
  approve,
}) {
  let document;
  const stats = (who) =>
    api("get", "/dashboard/stats", who)
      .expect(200)
      .then((response) => response.body);
  await check(
    "Dashboard audit: old document approved now increases the actual monthly completion count",
    async () => {
      const before = await stats("admin");
      document = (await api("post", "/documents").send(data("PR")).expect(201))
        .body;
      const oldDate = new Date(Date.now() - 40 * 86400000);
      await prisma.document.update({
        where: { id: document.real_id },
        data: { created_at: oldDate },
      });
      await api("post", `/workflows/${document.real_id}/submit`)
        .send({
          workflow_steps: [
            { step_order: 1, approver_id: users.manager.id },
            { step_order: 2, approver_id: users.manager2.id },
            { step_order: 3, approver_id: users.executive.id },
          ],
        })
        .expect(201);
      for (const who of ["manager", "manager2", "executive"])
        await approve(document.real_id, who);
      const after = await stats("admin");
      const current = await detail(document.real_id);
      assert.equal(current.status, "Approved");
      assert.ok(current.approved_at);
      assert.equal(after.approvedThisMonth, before.approvedThisMonth + 1);
      assert.equal(after.approved, before.approved + 1);
      assert.equal(after.timeZone, "Asia/Bangkok");
    },
  );
  await check(
    "Dashboard audit: successful actions have correct actor, IP, preview/download type and frozen identity",
    async () => {
      assert.ok(document);
      const count = (action) =>
        prisma.auditLog.count({
          where: { target_id: document.real_id, action },
        });
      const views = await count("View"),
        downloads = await count("Download");
      await api("get", `/documents/${document.real_id}`).expect(200);
      await api("get", `/documents/${document.real_id}/download`).expect(200);
      await api(
        "get",
        `/documents/${document.real_id}/download?download=true`,
      ).expect(200);
      assert.equal(await count("View"), views + 2);
      assert.equal(await count("Download"), downloads + 1);
      const event = await prisma.auditLog.findFirstOrThrow({
        where: { target_id: document.real_id, action: "Download" },
        orderBy: { created_at: "desc" },
      });
      assert.equal(event.user_id, users.owner.id);
      assert.match(event.ip_address, /^(127\.0\.0\.1|::1)$/);
      assert.equal(event.details.extra.actor.id, users.owner.id);
    const creation = await prisma.auditLog.findFirstOrThrow({ where: { target_id: document.real_id, action: 'Upload' } });
    assert.match(creation.ip_address, /^(127\.0\.0\.1|::1)$/);
    assert.equal(creation.details.extra.actor.id, users.owner.id);
      const owner = await prisma.user.findUniqueOrThrow({
        where: { id: users.owner.id },
      });
      try {
        await api("patch", `/admin/users/${owner.id}`, "admin")
          .send({ first_name: "เปลี่ยนชื่อภายหลัง" })
          .expect(200);
        const rows = (
          await api(
            "get",
            `/admin/audit-logs?search=${encodeURIComponent(owner.first_name + " " + owner.last_name)}&action=Download`,
            "admin",
          ).expect(200)
        ).body;
        const saved = rows.find((row) => row.id === event.id);
        assert.ok(
          saved,
          "Historical actor name must remain searchable after renaming",
        );
        assert.equal(
          saved.user_fullname,
          owner.first_name + " " + owner.last_name,
        );
        assert.equal(saved.target_label, document.doc_number);
      } finally {
        await api("patch", `/admin/users/${owner.id}`, "admin")
          .send({ first_name: owner.first_name })
          .expect(200);
      }
      const edits = await count("Edit");
      await api("put", `/documents/${document.real_id}`, "outsider")
        .send(data("PR"))
        .expect(403);
      assert.equal(
        await count("Edit"),
        edits,
        "Rejected request must not create a successful edit event",
      );
      const approvalEvents = await prisma.auditLog.findMany({
        where: {
          target_id: document.real_id,
          action: { in: ["Approve", "Signature"] },
        },
      });
      assert.equal(
        approvalEvents.filter((e) => e.action === "Approve").length,
        3,
      );
      assert.equal(
        approvalEvents.filter((e) => e.action === "Signature").length,
        3,
      );
    assert.ok(approvalEvents.every(event => event.ip_address && event.details.extra.actor.id === event.user_id));
    },
  );
  await check(
    "Dashboard audit: paged history retrieves every real view beyond 100 records",
    async () => {
      assert.ok(document);
      for (let i = 0; i < 105; i++)
        await api("get", `/documents/${document.real_id}`).expect(200);
      const expected = await prisma.auditLog.findMany({
        where: { target_id: document.real_id, action: "View" },
      });
      assert.ok(expected.length > 100);
      const rows = [];
      for (let page = 1; ; page++) {
        const next = (
          await api(
            "get",
            `/admin/audit-logs?search=${document.real_id}&action=View&limit=40&page=${page}`,
            "admin",
          ).expect(200)
        ).body;
        rows.push(...next);
        if (next.length < 40) break;
      }
      assert.deepEqual(
        rows.map((row) => row.id).sort(),
        expected.map((row) => row.id).sort(),
      );
      assert.ok(rows.every((row) => row.target_label === document.doc_number));
    },
  );
  await check(
    "Dashboard audit: date filters use whole Thai days and unknown historical IP remains null",
    async () => {
      const target = "calendar-fixture-" + document.real_id;
      const times = [
        "2026-10-31T16:59:59Z",
        "2026-10-31T17:00:00Z",
        "2026-11-01T16:59:59Z",
        "2026-11-01T17:00:00Z",
      ];
      await prisma.auditLog.createMany({
        data: times.map((time) => ({
          action: "View",
          module: "Document",
          target_id: target,
          created_at: new Date(time),
        })),
      });
      const rows = (
        await api(
          "get",
          `/admin/audit-logs?search=${target}&dateFrom=2026-11-01&dateTo=2026-11-01`,
          "admin",
        ).expect(200)
      ).body;
      assert.deepEqual(
        rows.map((row) => new Date(row.created_at).toISOString()).sort(),
        times
          .slice(1, 3)
          .map((time) => new Date(time).toISOString())
          .sort(),
      );
      assert.ok(rows.every((row) => row.ip_address === null));
      for (const query of [
        "dateFrom=not-a-date",
        "dateFrom=2026-11-02&dateTo=2026-11-01",
        "page=0",
        "limit=1001",
        "action=MadeUp",
      ])
        await api("get", "/admin/audit-logs?" + query, "admin").expect(400);
    },
  );
  await check(
    "Dashboard audit: role scopes and current-step approval queue match database records",
    async () => {
      const admin = await stats("admin");
      assert.equal(
        admin.total,
        await prisma.document.count({ where: { is_deleted: false } }),
      );
      for (const who of ["owner", "manager"]) {
        const user = users[who];
        const visible = {
          is_deleted: false,
          OR: [
            { creator_id: user.id },
            { visibility_type: "CompanyWide" },
            {
              visibility_type: "SpecificUsers",
              visibility_users: { has: user.id },
            },
            {
              visibility_type: "Department",
              visibility_departments: { has: user.department_id },
            },
            { workflow: { steps: { some: { approver_id: user.id } } } },
          ],
        };
        const result = await stats(who);
        assert.equal(
          result.total,
          await prisma.document.count({ where: visible }),
        );
        const queue = await prisma.workflowStep.findMany({
          where: {
            approver_id: user.id,
            status: "Pending",
            workflow: {
              status: "Pending",
              document: { is_deleted: false, status: "Pending" },
            },
          },
          include: { workflow: true },
        });
        assert.equal(
          result.actionRequired,
          queue.filter((step) => step.step_order === step.workflow.current_step)
            .length,
        );
      }
    },
  );
  await check('Dashboard audit: imported histories are identified instead of presenting sample IP as captured evidence', async () => {
    const event = await prisma.auditLog.create({ data: {
      action: 'Approve', module: 'Workflow', target_id: 'imported-history-' + document.real_id,
      ip_address: '192.0.2.10', details: { extra: { is_demo: true, seed_batch: 'fixture-import' } },
    } });
    const rows = (await api('get', `/admin/audit-logs?search=${event.target_id}`, 'admin').expect(200)).body;
    assert.equal(rows[0].origin, 'imported');
    assert.equal(rows[0].ip_address, null);
    assert.equal((await prisma.auditLog.findUniqueOrThrow({ where: { id: event.id } })).ip_address, '192.0.2.10', 'Historical source record stays unchanged');
  });
  await check(
    "Dashboard audit: deletion remains auditable with its document number and requires audit permission",
    async () => {
      await api("delete", `/documents/${document.real_id}`).expect(200);
      const rows = (
        await api(
          "get",
          `/admin/audit-logs?search=${document.real_id}&action=Delete`,
          "admin",
        ).expect(200)
      ).body;
      assert.ok(
        rows.some(
          (row) =>
            row.target_label === document.doc_number &&
            row.target_deleted === true,
        ),
      );
      await api("get", "/admin/audit-logs", "owner").expect(403);
      const last = await stats("admin");
      assert.equal(
        last.total,
        await prisma.document.count({ where: { is_deleted: false } }),
      );
    },
  );
};
