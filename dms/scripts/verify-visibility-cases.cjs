const assert = require("node:assert/strict");
const { PDFDocument } = require("pdf-lib");

module.exports = async function verifyVisibility({
  check,
  api,
  prisma,
  users,
  types,
  data,
  detail,
  approve,
  tokens,
  password,
  png,
}) {
  let inactiveDepartment;
  await check(
    "Master Data lookups reflect live department/user edits and exclude disabled records",
    async () => {
      // Earlier regression cases intentionally disable manager2. Restore only the
      // scratch fixture and obtain a fresh session before testing three steps.
      await api("patch", `/admin/users/${users.manager2.id}`, "admin")
        .send({ is_active: true })
        .expect(200);
      const secondLogin = await api("post", "/auth/login", "manager2")
        .send({ username: users.manager2.username, password })
        .expect(200);
      tokens.manager2 = secondLogin.headers["set-cookie"][0].split(";")[0];
      // Password-reset regression cases revoke the old outsider session too.
      await api("post", `/admin/users/${users.outsider.id}/reset-password`, "admin")
        .send({ password_hash: password })
        .expect(201);
      const viewerLogin = await api("post", "/auth/login", "outsider")
        .send({ username: users.outsider.username, password })
        .expect(200);
      tokens.outsider = viewerLogin.headers["set-cookie"][0].split(";")[0];
      const department = (
        await api("post", "/admin/departments", "admin")
          .send({ name: "แผนกตรวจสิทธิ์" })
          .expect(201)
      ).body;
      await api("patch", `/admin/departments/${department.id}`, "admin")
        .send({ name: "แผนกตรวจสิทธิ์ฉบับแก้ไข" })
        .expect(200);
      let departments = (await api("get", "/lookups/departments").expect(200))
        .body;
      assert.equal(
        departments.find((d) => d.id === department.id).name,
        "แผนกตรวจสิทธิ์ฉบับแก้ไข",
      );
      await api("patch", `/admin/departments/${department.id}`, "admin")
        .send({ is_active: false })
        .expect(200);
      departments = (await api("get", "/lookups/departments").expect(200)).body;
      assert.ok(!departments.some((d) => d.id === department.id));
      inactiveDepartment = department.id;
      const alternate = (
        await api("post", "/admin/users", "admin")
          .send({
            username: "alternate-approver",
            email: "alternate@example.test",
            password,
            first_name: "ผู้อนุมัติ",
            last_name: "สำรอง",
            role_id: users.manager.role_id,
            department_id: users.owner.department_id,
            position_id: users.owner.position_id,
          })
          .expect(201)
      ).body;
      users.alternate = await prisma.user.findUniqueOrThrow({
        where: { id: alternate.id },
      });
      await api("patch", `/admin/users/${alternate.id}`, "admin")
        .send({ first_name: "ผู้อนุมัติแก้ไขชื่อ" })
        .expect(200);
      const login = await api("post", "/auth/login", "alternate")
        .send({ username: "alternate-approver", password })
        .expect(200);
      tokens.alternate = login.headers["set-cookie"][0].split(";")[0];
      await api("post", "/users/me/signature", "alternate")
        .attach("file", png, {
          filename: "signature.png",
          contentType: "image/png",
        })
        .expect(201);
      let directory = (await api("get", "/lookups/users").expect(200)).body;
      assert.equal(
        directory.find((u) => u.id === alternate.id).first_name,
        "ผู้อนุมัติแก้ไขชื่อ",
      );
      assert.equal(
        directory.find((u) => u.id === alternate.id).can_approve,
        true,
      );
      assert.ok(!JSON.stringify(directory).includes("signature_encrypted"));
      assert.ok(!JSON.stringify(directory).includes("password_hash"));
      await api("patch", `/admin/users/${alternate.id}`, "admin")
        .send({ is_active: false })
        .expect(200);
      directory = (await api("get", "/lookups/users").expect(200)).body;
      assert.ok(!directory.some((u) => u.id === alternate.id));
      await api("patch", `/admin/users/${alternate.id}`, "admin")
        .send({ is_active: true })
        .expect(200);
      const freshLogin = await api("post", "/auth/login", "alternate")
        .send({ username: "alternate-approver", password })
        .expect(200);
      tokens.alternate = freshLogin.headers["set-cookie"][0].split(";")[0];
    },
  );
  const threeSteps = (second = "manager2") => [
    { step_order: 1, approver_id: users.manager.id },
    { step_order: 2, approver_id: users[second].id },
    { step_order: 3, approver_id: users.executive.id },
  ];
  const make = async (prefix, visibility) => {
    const payload = { ...data(prefix), visibility };
    if (prefix !== "DOC")
      return (await api("post", "/documents").send(payload).expect(201)).body;
    const pdf = await PDFDocument.create();
    pdf.addPage();
    pdf.addPage();
    return (
      await api("post", "/documents/upload")
        .field("payload", JSON.stringify(payload))
        .attach("file", Buffer.from(await pdf.save()), {
          filename: "visibility.pdf",
          contentType: "application/pdf",
        })
        .expect(201)
    ).body;
  };
  const submit = (doc, second) =>
    api("post", `/workflows/${doc.real_id}/submit`)
      .send({ workflow_steps: threeSteps(second) })
      .expect(201);
  const audience = (type) => ({
    type,
    departments: type === "Department" ? [users.outsider.department_id] : [],
    users: type === "SpecificUsers" ? [users.outsider.id] : [],
  });
  const assertListed = async (doc, who, expected) => {
    const list = (await api("get", "/documents?limit=1000", who).expect(200))
      .body.data;
    assert.equal(
      list.some((d) => d.real_id === doc.real_id),
      expected,
      `${who} list visibility`,
    );
  };
  // Change only scratch-schema matrices through the same admin API used by Master Data.
  for (const prefix of ["PR", "PO", "BK", "DOC"]) {
    await api("patch", `/admin/workflows/${types[prefix].id}`, "admin")
      .send({ levels: 3, steps: ["Manager", "Manager", "Executive"] })
      .expect(200);
    for (const mode of ["Department", "SpecificUsers"]) {
      await check(
        `${prefix} ${mode}: three approvers gain access outside manual audience; unrelated colleagues remain denied`,
        async () => {
          assert.ok(users.alternate, "Master Data scenario must succeed");
          const doc = await make(prefix, audience(mode));
          await api("get", `/documents/${doc.real_id}`, "manager").expect(403);
          await submit(doc);
          const current = await detail(doc.real_id);
          assert.equal(current.workflow.total_steps, 3);
          assert.deepEqual(
            [...current.visibility.automatic_users].sort(),
            threeSteps()
              .map((s) => s.approver_id)
              .sort(),
          );
          assert.deepEqual(
            [...current._meta.visibility.automatic_users].sort(),
            threeSteps()
              .map((s) => s.approver_id)
              .sort(),
          );
          assert.deepEqual(
            current.visibility.departments,
            audience(mode).departments,
          );
          assert.deepEqual(
            [...current.visibility.users].sort(),
            mode === "Department"
              ? []
              : [users.outsider.id, users.owner.id].sort(),
          );
          for (const who of ["manager", "manager2", "executive"]) {
            assert.ok(!audience(mode).users.includes(users[who].id));
            assert.ok(
              !audience(mode).departments.includes(users[who].department_id),
            );
            await api("get", `/documents/${doc.real_id}`, who).expect(200);
            await api("get", `/documents/${doc.real_id}/download`, who).expect(
              200,
            );
            await api(
              "get",
              `/documents/${doc.real_id}/download?download=true`,
              who,
            ).expect(200);
            await api("get", `/workflows/${doc.real_id}`, who).expect(200);
            await assertListed(doc, who, true);
          }
          await api("get", `/documents/${doc.real_id}`, "outsider").expect(200);
          await api("get", `/documents/${doc.real_id}`, "alternate").expect(
            403,
          );
          await api(
            "get",
            `/documents/${doc.real_id}/download`,
            "alternate",
          ).expect(403);
          await api(
            "get",
            `/documents/${doc.real_id}/versions`,
            "alternate",
          ).expect(403);
          await assertListed(doc, "alternate", false);
          const nextInbox = (
            await api("get", "/approvals", "manager2").expect(200)
          ).body;
          assert.ok(
            !nextInbox.some((d) => d.real_id === doc.real_id),
            "Future approver sees document but cannot act yet",
          );
          await api("post", `/workflows/${doc.real_id}/approve`, "executive")
            .send({
              expected_step: 1,
              expected_version: current.versions[0].version_number,
            })
            .expect(403);
          for (const who of ["manager", "manager2", "executive"])
            await approve(doc.real_id, who);
          assert.equal((await detail(doc.real_id)).status, "Approved");
          for (const who of ["manager", "manager2", "executive"])
            await api("get", `/documents/${doc.real_id}`, who).expect(200);
        },
      );
    }
  }
  await check(
    "Replacing a returned three-step approver revokes only derived access and preserves explicit viewers",
    async () => {
      const doc = await make("PR", audience("SpecificUsers"));
      await submit(doc);
      const before = await detail(doc.real_id);
      await api("post", `/workflows/${doc.real_id}/reject`, "manager")
        .send({
          comment: "ปรับผู้รับผิดชอบ",
          reject_type: "return",
          expected_step: 1,
          expected_version: before.versions[0].version_number,
        })
        .expect(201);
      await submit(doc, "alternate");
      const current = await detail(doc.real_id);
      assert.ok(
        current.visibility.automatic_users.includes(users.alternate.id),
      );
      assert.ok(
        !current.visibility.automatic_users.includes(users.manager2.id),
      );
      await api("get", `/documents/${doc.real_id}`, "manager2").expect(403);
      await api("get", `/documents/${doc.real_id}/download`, "manager2").expect(
        403,
      );
      await assertListed(doc, "manager2", false);
      await api("get", `/documents/${doc.real_id}`, "alternate").expect(200);
      await api("get", `/documents/${doc.real_id}`, "outsider").expect(200);
    },
  );
  await check(
    "Visibility rejects inactive master IDs and ignores stale selections belonging to another mode",
    async () => {
      assert.ok(inactiveDepartment);
      await api("post", "/documents")
        .send({
          ...data("PR"),
          visibility: {
            type: "Department",
            departments: [inactiveDepartment],
            users: [],
          },
        })
        .expect(400);
      const doc = await make("PR", {
        type: "Department",
        departments: [users.outsider.department_id],
        users: [users.empty.id],
      });
      assert.deepEqual((await detail(doc.real_id)).visibility.users, []);
      const fakeId = "00000000-0000-4000-8000-000000000000";
      await api("post", "/documents")
        .send({
          ...data("PR"),
          visibility: {
            type: "SpecificUsers",
            departments: [],
            users: [fakeId],
          },
        })
        .expect(400);
      await api("post", "/documents")
        .send({
          ...data("PR"),
          visibility: { type: "SpecificUsers", departments: [], users: [] },
        })
        .expect(400);
      await api("post", "/documents")
        .send({
          ...data("PR"),
          visibility: { type: "Department", departments: [], users: [] },
        })
        .expect(400);
    },
  );
};
