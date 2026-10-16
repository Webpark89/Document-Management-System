/* Database-only document fixture replacement. Accounts/roles/permissions are protected.
   prepare: builds and validates an isolated schema; apply <manifest>: backs up and swaps atomically.
   verify <manifest>: resumes post-import checks without replacing data again. */
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  zlib = require("node:zlib"),
  assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(root, "server/.env"), quiet: true });
const { PrismaClient, Prisma } = require("@prisma/client");
const { ConfigService } = require("@nestjs/config");
const {
  EncryptionService,
} = require("../server/dist/src/common/encryption/encryption.service");
const {
  DocumentsService,
} = require("../server/dist/src/documents/documents.service");
const puppeteer = require("puppeteer-core"),
  sharp = require("sharp");
const { PDFDocument } = require("pdf-lib");
const targetUrl = new URL(process.env.DATABASE_URL);
if (!["localhost", "127.0.0.1"].includes(targetUrl.hostname))
  throw Error("Only the configured local database is supported");
const db = new PrismaClient(),
  uuid = () => crypto.randomUUID(),
  clone = (x) => JSON.parse(JSON.stringify(x));
const protectedTables = [
  "users",
  "roles",
  "permissions",
  "role_permissions",
  "departments",
  "positions",
  "document_types",
  "approval_matrix",
];
const models = [
  "folder",
  "folderPermission",
  "document",
  "pRForm",
  "pRFormItem",
  "pOForm",
  "pOFormItem",
  "bKForm",
  "workflow",
  "workflowStep",
  "documentVersion",
  "notification",
  "auditLog",
];
const baseModels = [
  "department",
  "position",
  "role",
  "permission",
  "rolePermission",
  "user",
  "documentType",
  "approvalMatrix",
  "runningNumber",
];
const jsonFields = { documentVersion: ["form_data"], auditLog: ["details"] };
function encoded(value) {
  if (Prisma.Decimal.isDecimal(value)) return value.toString();
  if (Buffer.isBuffer(value) || value instanceof Uint8Array)
    return { $bytes: Buffer.from(value).toString("base64") };
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(encoded);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, encoded(v)]),
    );
  return value;
}
function decoded(value) {
  if (value && typeof value === "object" && value.$bytes)
    return Buffer.from(value.$bytes, "base64");
  if (Array.isArray(value)) return value.map(decoded);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, decoded(v)]),
    );
  return value;
}
function dbRow(model, row) {
  const result = { ...row };
  for (const key of jsonFields[model] || [])
    if (result[key] === null) result[key] = Prisma.DbNull;
  return result;
}
async function fingerprints(client, tables) {
  const result = {};
  for (const table of tables) {
    assert.ok(
      [
        ...protectedTables,
        "documents",
        "document_versions",
        "folders",
        "running_numbers",
      ].includes(table),
    );
    const [row] = await client.$queryRawUnsafe(
      `SELECT count(*)::int AS count, md5(COALESCE(string_agg(hash, '' ORDER BY hash),'')) AS hash FROM (SELECT md5(row_to_json(t)::text) AS hash FROM "${table}" t) hashes`,
    );
    result[table] = row;
  }
  return result;
}
function manifestPath(value) {
  const file = path.resolve(value),
    allowed = path.join(root, "server/.local/demo-seed") + path.sep;
  if (!file.startsWith(allowed) || path.basename(file) !== "manifest.json")
    throw Error("Invalid manifest location");
  return file;
}
const esc = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

async function prepare() {
  const batch = `dms_demo_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const directory = path.join(root, "server/.local/demo-seed", batch);
  fs.mkdirSync(directory, { recursive: true });
  const baseline = await fingerprints(db, [
    ...protectedTables,
    "documents",
    "document_versions",
    "folders",
    "running_numbers",
  ]);
  const stageUrl = new URL(targetUrl);
  stageUrl.searchParams.set("schema", batch);
  const pushed = spawnSync(
    process.execPath,
    [
      path.join(root, "node_modules/prisma/build/index.js"),
      "db",
      "push",
      "--skip-generate",
      "--schema",
      path.join(root, "server/prisma/schema.prisma"),
    ],
    {
      cwd: path.join(root, "server"),
      env: { ...process.env, DATABASE_URL: stageUrl.toString() },
      encoding: "utf8",
    },
  );
  if (pushed.status || !pushed.stdout.includes(batch))
    throw Error("Could not create the isolated staging schema");
  const stage = new PrismaClient({
    datasources: { db: { url: stageUrl.toString() } },
  });
  let browser;
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        department_id: true,
        position_id: true,
        role_id: true,
        is_active: true,
        is_deleted: true,
        created_at: true,
        updated_at: true,
      },
    });
    for (const model of baseModels) {
      const rows =
        model === "user"
          ? users.map((u) => ({
              ...u,
              password_hash: "DEMO-STAGING-NO-LOGIN",
              signature_encrypted: null,
              reset_token: null,
              reset_token_expiry: null,
            }))
          : await db[model].findMany();
      if (rows.length) await stage[model].createMany({ data: rows });
    }
    const active = await stage.user.findMany({
      where: { is_active: true, is_deleted: false, role: { is_active: true } },
      include: {
        department: true,
        position: true,
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });
    const types = await stage.documentType.findMany({
      where: { is_active: true },
      orderBy: { prefix: "asc" },
    });
    const matrices = await stage.approvalMatrix.findMany({
      orderBy: { step_order: "asc" },
    });
    const activeDepartments = await stage.department.findMany({
      where: { is_active: true },
    });
    const creators = active.filter(
      (u) =>
        u.department_id &&
        u.role.name !== "Administrator" &&
        u.role.permissions.some(
          (p) =>
            p.permission.module === "submissions.create_document" &&
            p.permission.action === "create",
        ),
    );
    assert.ok(
      creators.length && types.length === 4,
      "Expected current four document types and active creators",
    );
    const admin =
      active.find((u) => u.role.name === "Administrator") || creators[0];
    const end = new Date(Date.now() - 60 * 60 * 1000);
    process.chdir(path.join(root, "server"));
    const encryption = new EncryptionService(new ConfigService(process.env));
    const service = new DocumentsService(stage, encryption);
    const signerImages = new Map();
    for (const user of active) {
      const png = await sharp(
        Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="120"><rect x="3" y="3" width="474" height="114" rx="12" fill="#eff6ff" stroke="#3157a1" stroke-width="3"/><path d="M26 57l17 17 29-36" fill="none" stroke="#3157a1" stroke-width="5"/><text x="92" y="53" font-family="Arial" font-size="26" fill="#1e3a8a">${esc(user.username)}</text><text x="92" y="88" font-family="Arial" font-size="18" fill="#526a91">DEMO APPROVAL / SAMPLE</text></svg>`,
        ),
      )
        .png()
        .toBuffer();
      signerImages.set(
        user.id,
        encryption.encrypt("data:image/png;base64," + png.toString("base64")),
      );
    }
    const stampUser = (u) => ({
      id: u.id,
      username: u.username,
      first_name: u.first_name,
      last_name: u.last_name,
      department: u.department,
      position: u.position,
      role: { id: u.role.id, name: u.role.name },
      signature_encrypted: signerImages.get(u.id),
    });
    const dataset = Object.fromEntries(models.map((model) => [model, []]));
    const folders = new Map();
    const folder = (
      key,
      name,
      visibility,
      parent_id = null,
      department_id = null,
      creator_id = admin.id,
    ) => {
      const row = {
        id: uuid(),
        name,
        description: "แฟ้มข้อมูลจำลองสำหรับสาธิตระบบ " + batch,
        color: "#4f46e5",
        icon: "Folder",
        visibility,
        parent_id,
        department_id,
        creator_id,
        is_deleted: false,
        created_at: new Date("2026-09-11T01:00:00Z"),
        updated_at: end,
      };
      dataset.folder.push(row);
      folders.set(key, row);
      return row;
    };
    const company = folder("company", "เอกสารส่วนกลาง", "CompanyWide");
    folder("year", "ประจำปี 2569", "CompanyWide", company.id);
    for (const dept of activeDepartments) {
      const parent = folder(dept.id, dept.name, "Department", null, dept.id);
      folder(
        dept.id + "-approved",
        "เอกสารที่อนุมัติแล้ว",
        "Department",
        parent.id,
        dept.id,
      );
    }
    const shared = folder("shared", "โครงการปรับปรุงระบบงาน 2569", "Shared");
    for (const user of active.filter((u) => u.role.name !== "Administrator"))
      dataset.folderPermission.push({
        id: uuid(),
        folder_id: shared.id,
        user_id: user.id,
        department_id: null,
        can_view: true,
        can_edit: user.role.name === "Manager",
        created_at: end,
      });
    const scenarios = [
      "Draft",
      "Draft",
      "Pending",
      "Pending",
      "Partial",
      "Partial",
      "Approved",
      "Approved",
      "Approved",
      "Approved",
      "Approved",
      "Approved",
      "Returned",
      "Returned",
      "Rejected",
      "Cancelled",
    ];
    const topics = {
      PR: [
        "อุปกรณ์สำนักงานประจำเดือน",
        "เครื่องคอมพิวเตอร์สำหรับพนักงานใหม่",
        "วัสดุซ่อมบำรุงคลังสินค้า",
        "อุปกรณ์เครือข่ายสำนักงาน",
        "เก้าอี้และโต๊ะทำงาน",
        "วัสดุสิ้นเปลืองฝ่ายปฏิบัติการ",
        "เครื่องพิมพ์เอกสารแผนก",
        "อุปกรณ์ความปลอดภัยประจำคลัง",
      ],
      PO: [
        "จัดซื้ออุปกรณ์ตามแผนงบประมาณ",
        "จ้างบำรุงรักษาเครื่องปรับอากาศ",
        "จัดซื้อวัสดุสำนักงาน",
        "สั่งซื้ออุปกรณ์เครือข่าย",
        "จ้างตรวจสอบระบบไฟฟ้า",
        "ต่ออายุซอฟต์แวร์สำนักงาน",
        "จัดซื้อบรรจุภัณฑ์",
        "จ้างอบรมความปลอดภัย",
      ],
      BK: [
        "ขออนุมัติแผนอบรมพนักงาน",
        "แจ้งแนวทางควบคุมเอกสารภายใน",
        "ขออนุมัติปรับปรุงพื้นที่ทำงาน",
        "สรุปผลการตรวจนับสินค้าคงคลัง",
        "ขออนุมัติประชุมทบทวนแผนงาน",
        "แจ้งกำหนดบำรุงรักษาระบบ",
        "เสนอแผนพัฒนาบุคลากร",
        "รายงานการตรวจประเมินภายใน",
      ],
      DOC: [
        "คู่มือปฏิบัติงานควบคุมเอกสาร",
        "รายงานผลการทดสอบระบบงาน",
        "แผนดำเนินโครงการปรับปรุงงาน",
        "แนวปฏิบัติการรับสินค้าเข้าคลัง",
        "แบบประเมินผู้ให้บริการภายนอก",
        "รายงานสรุปการประชุมโครงการ",
        "แผนตรวจสอบอุปกรณ์ประจำปี",
        "ขั้นตอนการจัดเก็บเอกสารองค์กร",
      ],
    };
    const executablePath = [
      process.env.PDF_BROWSER_PATH,
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    ]
      .filter(Boolean)
      .find((p) => fs.existsSync(p));
    if (!executablePath) throw Error("PDF renderer not installed");
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--disable-gpu"],
    });
    let ordinal = 0;
    for (const type of types) {
      let number = 0;
      const matrix = matrices.filter((m) => m.document_type_id === type.id);
      assert.ok(matrix.length, "Approval matrix missing for " + type.prefix);
      for (let i = 0; i < 16; i++) {
        const creatorPool = ["PR", "PO"].includes(type.prefix)
          ? creators.filter((user) => user.role.name === "Employee")
          : creators;
        assert.ok(creatorPool.length);
        const scenario = scenarios[i],
          creator = creatorPool[i % creatorPool.length];
        const chosen = [],
          used = new Set();
        for (const m of matrix) {
          const candidates = active.filter(
            (u) =>
              u.role_id === m.required_role_id &&
              u.role.permissions.some(
                (p) =>
                  p.permission.module === "approvals.approve_document" &&
                  p.permission.action === "approve",
              ),
          );
          const selected =
            candidates.find((u) => !used.has(u.id) && u.id !== creator.id) ||
            candidates.find((u) => !used.has(u.id)) ||
            candidates[0];
          assert.ok(selected, "No active approver");
          chosen.push(selected);
          used.add(selected.id);
        }
        const earliest =
          Math.max(
            new Date(creator.created_at).getTime(),
            ...chosen.map((u) => new Date(u.created_at).getTime()),
          ) + 3600000;
        assert.ok(
          earliest < end.getTime() - 3600000,
          "Not enough historical time after participant creation",
        );
        const span = Math.max(3600000, end.getTime() - earliest - 86400000);
        const created = new Date(
          earliest + (span * ((i * 7 + ordinal * 3) % 31)) / 32,
        );
        const duration = Math.min(
          2 * 86400000,
          Math.max(1800000, (end - created) * 0.75),
        );
        let tick = 0;
        const at = () =>
          new Date(created.getTime() + (Math.min(++tick, 20) * duration) / 22);
        const id = uuid(),
          docNumber = `${type.prefix}-2026-${String(++number).padStart(4, "0")}`;
        const title =
          topics[type.prefix][i % 8] + ` — ${creator.department.name}`;
        const visibility =
          i % 5 === 0
            ? "SpecificUsers"
            : i % 3 === 0
              ? "Department"
              : "CompanyWide";
        const doc = {
          id,
          doc_number: docNumber,
          title,
          type_id: type.id,
          creator_id: creator.id,
          status: "Draft",
          search_text: `${title} ตามแผนดำเนินงานประจำปี 2569`,
          tags: ["ข้อมูลจำลอง", type.prefix, "2569"],
          folder_id: null,
          is_deleted: false,
          visibility_type: visibility,
          visibility_departments:
            visibility === "Department" ? [creator.department_id] : [],
          visibility_users:
            visibility === "SpecificUsers"
              ? [...new Set([creator.id, ...chosen.map((u) => u.id)])]
              : [],
          approved_at: null,
          created_at: created,
          updated_at: created,
        };
        const items = [
          {
            id: uuid(),
            item_name:
              type.prefix === "PO"
                ? "ค่าบริการและวัสดุตามใบเสนอราคา"
                : "อุปกรณ์และวัสดุสำหรับหน่วยงาน",
            quantity: 2 + (i % 4),
            unit: "ชุด",
            unit_price: new Prisma.Decimal(1450 + i * 275),
            remark: "ตรวจรับตามคุณลักษณะที่กำหนด",
            created_at: created,
            updated_at: created,
          },
          {
            id: uuid(),
            item_name: "อุปกรณ์ประกอบและค่าดำเนินการ",
            quantity: 1,
            unit: "รายการ",
            unit_price: new Prisma.Decimal(350 + i * 45),
            remark: "",
            created_at: created,
            updated_at: created,
          },
        ];
        let revision = 0,
          workflow = null,
          history = [],
          lastStatus = "Draft";
        const formFor = () => {
          const computed = items.map((item) => ({
            ...item,
            unit_price: Number(item.unit_price) + (revision ? 125 : 0),
            vat: type.prefix === "PO" ? 7 : undefined,
            total_price:
              Math.round(
                (Number(item.unit_price) + (revision ? 125 : 0)) *
                  item.quantity *
                  (type.prefix === "PO" ? 1.07 : 1) *
                  100,
              ) / 100,
          }));
          const total = computed.reduce(
            (sum, item) => sum + item.total_price,
            0,
          );
          if (type.prefix === "PR")
            return {
              id: uuid(),
              document_id: id,
              requester_id: creator.id,
              department_id: creator.department_id,
              purpose: doc.search_text,
              remark: revision
                ? "ปรับรายละเอียดตามข้อเสนอแนะแล้ว"
                : "ตรวจสอบงบประมาณและความจำเป็นก่อนจัดซื้อ",
              requested_date: created,
              required_date: new Date(created.getTime() + 10 * 86400000),
              total_amount: total,
              items: computed,
              created_at: created,
              updated_at: doc.updated_at,
            };
          if (type.prefix === "PO")
            return {
              id: uuid(),
              document_id: id,
              vendor_name: [
                "บริษัท สยามออฟฟิศซัพพลาย (ตัวอย่าง) จำกัด",
                "บริษัท เอเชียเทคโซลูชัน (ตัวอย่าง) จำกัด",
                "บริษัท โปรเซอร์วิส (ตัวอย่าง) จำกัด",
              ][i % 3],
              vendor_contact: "ผู้ประสานงานฝ่ายบริการ / sales@example.test",
              delivery_date: new Date(created.getTime() + 14 * 86400000),
              payment_terms: "เครดิต 30 วัน หลังส่งมอบและตรวจรับครบถ้วน",
              remark: revision
                ? "ปรับเงื่อนไขส่งมอบตามที่อนุมัติ"
                : "อ้างอิงใบเสนอราคาตามรายการ",
              total_amount: total,
              items: computed,
              created_at: created,
              updated_at: doc.updated_at,
            };
          if (type.prefix === "BK")
            return {
              id: uuid(),
              document_id: id,
              subject: title,
              detail:
                doc.search_text +
                "\n\nวัตถุประสงค์: เพื่อให้การดำเนินงานของหน่วยงานเป็นไปตามแผนและตรวจสอบย้อนหลังได้\nขอบเขตงาน: จัดเตรียมข้อมูล ตรวจสอบรายละเอียด และสรุปผลต่อผู้เกี่ยวข้อง\nผลที่คาดหวัง: ลดระยะเวลาการทำงานและเพิ่มความครบถ้วนของข้อมูล" +
                (revision
                  ? "\n\nปรับปรุง: เพิ่มผู้รับผิดชอบและกำหนดเวลาตามข้อเสนอแนะ"
                  : ""),
              department_id: creator.department_id,
              created_at: created,
              updated_at: doc.updated_at,
            };
          return { description: doc.search_text, revision: revision + 1 };
        };
        const audit = (action, module, user_id, date, comment, version) =>
          dataset.auditLog.push({
            id: uuid(),
            user_id,
            action,
            module,
            target_id: id,
            created_at: date,
            ip_address: `192.0.2.${10 + active.indexOf(active.find((u) => u.id === user_id))}`,
            details: {
              oldState: { status: lastStatus },
              newState: { status: doc.status },
              extra: {
                is_demo: true,
                seed_batch: batch,
                doc_number: docNumber,
                version,
                comment,
              },
            },
          });
        const notify = (user_id, message, date, unread = false) =>
          dataset.notification.push({
            id: uuid(),
            user_id,
            document_id: id,
            message,
            is_read: !unread,
            read_at: unread ? null : new Date(date.getTime() + 300000),
            created_at: date,
            updated_at: date,
          });
        const events = [];
        const append = (
          comment,
          user_id = creator.id,
          action = "Edit",
          module = "Document",
        ) => {
          const date = at();
          doc.updated_at = date;
          const number = events.length + 1;
          const form = formFor();
          const frozenWorkflow = workflow
            ? {
                ...clone(workflow),
                steps: workflow.steps.map((s) => ({
                  ...clone(s),
                  approver: stampUser(chosen[s.step_order - 1]),
                })),
              }
            : null;
          const snapshot = {
            ...clone(form),
            _meta: {
              id,
              doc_number: docNumber,
              title,
              created_at: created,
              updated_at: date,
              approved_at: doc.approved_at,
              status: doc.status,
              type: clone(type),
              creator_id: creator.id,
              creator: stampUser(creator),
              workflow: frozenWorkflow,
              workflow_history: clone(history),
              company: {
                companyName: "บริษัท นิสซุย (ประเทศไทย) จำกัด",
                companyAddress: "ข้อมูลจำลองสำหรับสาธิตระบบ",
              },
              description: doc.search_text,
              visibility: {
                type: visibility,
                departments: doc.visibility_departments,
                users: doc.visibility_users,
              },
              annotations: [],
              seed: {
                is_demo: true,
                batch,
                notice: "ข้อมูลจำลอง ไม่ใช่หลักฐานการอนุมัติจริง",
              },
            },
          };
          events.push({
            id: uuid(),
            document_id: id,
            version_number: number,
            uploaded_by_id: user_id,
            file_extension: "pdf",
            form_data: snapshot,
            remarks: comment,
            created_at: date,
            updated_at: date,
          });
          audit(action, module, user_id, date, comment, number);
          lastStatus = doc.status;
        };
        const submit = () => {
          const date = at();
          workflow = {
            id: uuid(),
            document_id: id,
            total_steps: matrix.length,
            current_step: 1,
            status: "Pending",
            created_at: date,
            updated_at: date,
            steps: matrix.map((m, index) => ({
              id: uuid(),
              workflow_id: null,
              step_order: m.step_order,
              approver_id: chosen[index].id,
              status: "Pending",
              action_date: null,
              comment: null,
              signature_applied: false,
              return_to_step: null,
              created_at: date,
              updated_at: date,
            })),
          };
          workflow.steps.forEach((s) => (s.workflow_id = workflow.id));
          doc.status = "Pending";
          append(
            "ส่งขออนุมัติตามรายชื่อผู้อนุมัติ",
            creator.id,
            "Edit",
            "Workflow",
          );
          notify(
            chosen[0].id,
            `เอกสาร ${docNumber} รอการอนุมัติขั้นที่ 1`,
            date,
          );
        };
        const approve = () => {
          const step = workflow.steps[workflow.current_step - 1],
            date = at();
          step.status = "Approved";
          step.action_date = date;
          step.updated_at = date;
          step.signature_applied = true;
          step.comment = "ตรวจสอบรายละเอียดและเห็นควรอนุมัติ (ข้อมูลจำลอง)";
          if (step.step_order === workflow.total_steps) {
            doc.status = "Approved";
            doc.approved_at = date;
            workflow.status = "Approved";
          } else workflow.current_step++;
          workflow.updated_at = date;
          append(
            "ลงนามอนุมัติขั้นที่ " + step.step_order,
            step.approver_id,
            "Approve",
            "Workflow",
          );
          audit(
            "Signature",
            "Workflow",
            step.approver_id,
            date,
            "ประทับตรา DEMO APPROVAL",
            events.length,
          );
        };
        const reject = (returned) => {
          const step = workflow.steps[workflow.current_step - 1],
            date = at();
          step.status = "Rejected";
          step.action_date = date;
          step.updated_at = date;
          step.return_to_step = returned ? 1 : null;
          step.comment = returned
            ? "กรุณาปรับรายละเอียดและเพิ่มหลักฐานประกอบ"
            : "งบประมาณหรือขอบเขตงานไม่สอดคล้องกับแผนที่อนุมัติ";
          workflow.status = "Rejected";
          workflow.updated_at = date;
          doc.status = returned ? "Returned" : "Rejected";
          append(step.comment, step.approver_id, "Reject", "Workflow");
        };
        append("สร้างฉบับร่างเอกสาร", creator.id, "Upload");
        if (i % 2 === 0) {
          revision++;
          append("ปรับรายละเอียดรายการและกำหนดส่งมอบ");
        }
        if (scenario !== "Draft") {
          submit();
          if (scenario === "Approved" && i % 3 === 0) {
            if (matrix.length > 1) approve();
            reject(true);
            history.push(clone(events.at(-1).form_data._meta.workflow));
            revision++;
            append("แก้ไขตามข้อเสนอแนะก่อนส่งอนุมัติใหม่");
            submit();
          }
          if (scenario === "Approved")
            while (doc.status === "Pending") approve();
          if (scenario === "Partial" && matrix.length > 1) approve();
          if (scenario === "Returned" || scenario === "Rejected") {
            if (matrix.length > 1 && i % 2 === 0) approve();
            reject(scenario === "Returned");
          }
          if (scenario === "Cancelled") {
            doc.status = "Cancelled";
            workflow.status = "Rejected";
            append("ยกเลิกคำขอเนื่องจากปรับแผนดำเนินงาน");
          }
        }
        if (doc.status === "Approved")
          doc.folder_id =
            i % 5 === 0
              ? shared.id
              : folders.get(creator.department_id + "-approved").id;
        if (doc.status === "Pending")
          notify(
            chosen[workflow.current_step - 1].id,
            `เอกสาร ${docNumber} รอการอนุมัติจากคุณ (ขั้นตอนที่ ${workflow.current_step})`,
            doc.updated_at,
            true,
          );
        if (["Approved", "Returned", "Rejected"].includes(doc.status))
          notify(
            creator.id,
            `เอกสาร ${docNumber}: ${doc.status === "Approved" ? "อนุมัติครบทุกขั้นตอน" : doc.status === "Returned" ? "ส่งกลับให้แก้ไขรายละเอียด" : "ไม่อนุมัติ"}`,
            doc.updated_at,
            doc.status === "Returned",
          );
        audit(
          "View",
          "Document",
          creator.id,
          doc.updated_at,
          "เปิดตรวจสอบรายละเอียดเอกสาร",
          events.length,
        );
        if (doc.status === "Approved")
          audit(
            "Download",
            "Document",
            creator.id,
            new Date(doc.updated_at.getTime() + 300000),
            "ดาวน์โหลดฉบับอนุมัติแล้ว",
            events.length,
          );
        dataset.document.push(doc);
        const finalForm = formFor();
        if (["PR", "PO", "BK"].includes(type.prefix)) {
          const model =
            type.prefix === "PR"
              ? "pRForm"
              : type.prefix === "PO"
                ? "pOForm"
                : "bKForm";
          const { items: rows, ...form } = finalForm;
          dataset[model].push(form);
          if (rows)
            for (const row of rows) {
              const { vat, ...item } = row;
              dataset[type.prefix === "PR" ? "pRFormItem" : "pOFormItem"].push({
                ...item,
                [type.prefix === "PR" ? "pr_form_id" : "po_form_id"]: form.id,
                ...(type.prefix === "PO" ? { vat } : {}),
                updated_at: doc.updated_at,
              });
            }
        }
        if (workflow) {
          const { steps, ...row } = workflow;
          dataset.workflow.push(row);
          dataset.workflowStep.push(...steps);
        }
        const page = await browser.newPage();
        await page.setJavaScriptEnabled(false);
        try {
          for (const version of events) {
            let html;
            if (type.prefix !== "DOC")
              html = service.buildDocumentHtml(
                {
                  ...doc,
                  type,
                  creator: stampUser(creator),
                  workflow,
                  versions: events,
                },
                version,
              );
            else {
              const meta = version.form_data._meta;
              html = `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:18mm}body{font:14px Tahoma,sans-serif;color:#1e293b;line-height:1.8}h1{font-size:24px;color:#1e40af}h2{font-size:17px}.page{break-before:page}.sig{display:inline-block;vertical-align:top;width:30%;text-align:center;margin-top:20px}.sig img{width:125px;height:36px}td{padding:8px;border-bottom:1px solid #ddd}</style></head><body><p>ระบบควบคุมเอกสารองค์กร | ${docNumber} | v${version.version_number}</p><h1>${esc(title)}</h1><p>หน่วยงาน: ${esc(creator.department.name)}</p><h2>1. วัตถุประสงค์และขอบเขต</h2><p>${esc(doc.search_text)} เอกสารฉบับนี้กำหนดผู้รับผิดชอบ ขั้นตอนการดำเนินงาน และหลักฐานที่ต้องจัดเก็บ</p><h2>2. ขั้นตอนดำเนินงาน</h2><ol><li>รวบรวมข้อมูลและตรวจสอบความครบถ้วน</li><li>จัดทำรายละเอียดและเอกสารประกอบ</li><li>เสนอผู้มีอำนาจตามลำดับอนุมัติ</li><li>ติดตามผลและจัดเก็บเอกสารฉบับที่ได้รับอนุมัติ</li></ol><h2>3. เอกสารและหลักฐาน</h2><p>จัดเก็บรายการตรวจสอบ รายงานผล และเอกสารที่เกี่ยวข้องในแฟ้มกลางของหน่วยงาน</p><div class="page"><h1>บันทึกการทบทวนและอนุมัติ</h1><p>ฉบับแก้ไข ${version.form_data.revision} — สถานะ ${meta.status}</p><p>ผู้จัดทำ ${esc(creator.first_name + " " + creator.last_name)}</p><p>รายละเอียดการทบทวน: ${revision ? "เพิ่มรายละเอียดผู้รับผิดชอบและกำหนดส่งมอบ" : "ทบทวนขอบเขตและตรวจสอบข้อมูลเบื้องต้น"}</p>${[meta.creator, ...(meta.workflow?.steps || []).filter((s) => s.status === "Approved").map((s) => s.approver)].map((u) => `<div class="sig"><img src="${encryption.decrypt(u.signature_encrypted)}"><p>${esc(u.first_name + " " + u.last_name)}</p><p>ข้อมูลจำลอง</p></div>`).join("")}</div></body></html>`;
            }
            await page.setContent(html, { waitUntil: "load", timeout: 15000 });
            const bytes = Buffer.from(
              await page.pdf({
                format: "A4",
                printBackground: true,
                displayHeaderFooter: true,
                headerTemplate: "<span></span>",
                footerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#64748b">ข้อมูลจำลองเพื่อสาธิตระบบ · ${docNumber} · v${version.version_number} · <span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
                margin: { bottom: "14mm" },
              }),
            );
            const pdf = await PDFDocument.load(bytes);
            assert.ok(pdf.getPageCount() >= 1);
            pdf.setTitle(title + ` v${version.version_number}`);
            pdf.setSubject("SYNTHETIC DEMO DATA - " + batch);
            pdf.setCreationDate(new Date(version.created_at));
            pdf.setModificationDate(new Date(version.created_at));
            version.file_data = Buffer.from(await pdf.save());
            version.file_size = String(version.file_data.length);
            dataset.documentVersion.push(version);
            if (i === 6 || i === 0)
              fs.writeFileSync(
                path.join(
                  directory,
                  `${type.prefix}-${i}-v${version.version_number}.pdf`,
                ),
                version.file_data,
              );
          }
        } finally {
          await page.close();
        }
        ordinal++;
        if (ordinal % 8 === 0)
          console.log(
            `Prepared ${ordinal}/64 documents, ${dataset.documentVersion.length} PDFs`,
          );
      }
      const running = await stage.runningNumber.findUnique({
        where: { document_type_id: type.id },
      });
      assert.ok(running);
      await stage.runningNumber.update({
        where: { id: running.id },
        data: { current_number: number, last_reset_year: 2026 },
      });
    }
    for (const user of creators)
      dataset.auditLog.push({
        id: uuid(),
        user_id: user.id,
        action: "Login",
        module: "Auth",
        target_id: user.id,
        ip_address: "192.0.2.10",
        created_at: new Date(end.getTime() - 3600000),
        details: {
          oldState: {},
          newState: { status: "Success" },
          extra: {
            is_demo: true,
            seed_batch: batch,
            comment: "ข้อมูลจำลอง: เข้าสู่ระบบเพื่อติดตามเอกสาร",
          },
        },
      });
    // Folder parents are inserted before children; all other relations follow model order.
    for (const model of models)
      if (dataset[model].length)
        await stage[model].createMany({
          data: dataset[model].map((row) => dbRow(model, row)),
        });
    const running = await stage.runningNumber.findMany();
    const summary = await validate(stage, batch, service, active);
    const payload = zlib.gzipSync(
      JSON.stringify(encoded({ dataset, running })),
    );
    fs.writeFileSync(path.join(directory, "dataset.json.gz"), payload);
    const manifest = {
      batch,
      created_at: new Date().toISOString(),
      target: {
        host: targetUrl.hostname,
        port: targetUrl.port,
        database: targetUrl.pathname,
        schema: targetUrl.searchParams.get("schema") || "public",
      },
      baseline,
      dataset_sha256: crypto.createHash("sha256").update(payload).digest("hex"),
      summary,
    };
    fs.writeFileSync(
      path.join(directory, "manifest.json"),
      JSON.stringify(manifest, null, 2),
    );
    console.log(
      JSON.stringify(
        { manifest: path.join(directory, "manifest.json"), summary },
        null,
        2,
      ),
    );
  } finally {
    await browser?.close();
    await stage.$disconnect();
  }
}

async function validate(client, batch, service, active) {
  active ??= await client.user.findMany({
    where: { is_active: true, is_deleted: false, role: { is_active: true } },
    select: { id: true, role: { select: { name: true } } },
  });
  const docs = await client.document.findMany({
    include: {
      type: true,
      versions: { orderBy: { version_number: "asc" } },
      workflow: { include: { steps: { orderBy: { step_order: "asc" } } } },
    },
  });
  assert.equal(docs.length, 64);
  let pdfs = 0,
    images = 0,
    history = 0;
  for (const doc of docs) {
    assert.ok(doc.tags.includes("ข้อมูลจำลอง"));
    assert.ok(doc.versions.length);
    for (let i = 0; i < doc.versions.length; i++) {
      const v = doc.versions[i];
      assert.equal(v.version_number, i + 1);
      assert.equal(v.document_id, doc.id);
      assert.ok(v.file_data?.length > 1000);
      assert.equal(String(v.file_data.length), v.file_size);
      const pdf = await PDFDocument.load(v.file_data);
      assert.ok(pdf.getSubject().includes(batch));
      assert.equal(v.form_data._meta.seed.batch, batch);
      assert.equal(v.form_data._meta.doc_number, doc.doc_number);
      assert.ok(new Date(v.created_at) >= new Date(doc.created_at));
      pdfs++;
      images += (v.form_data._meta.workflow?.steps || []).filter(
        (s) => s.status === "Approved" && s.approver?.signature_encrypted,
      ).length;
      history += v.form_data._meta.workflow_history?.length || 0;
    }
    assert.equal(doc.versions.at(-1).form_data._meta.status, doc.status);
    if (doc.status === "Approved") {
      assert.ok(doc.approved_at && doc.folder_id);
      assert.equal(doc.workflow.status, "Approved");
      assert.ok(
        doc.workflow.steps.every(
          (s) =>
            s.status === "Approved" && s.signature_applied && s.action_date,
        ),
      );
    }
    if (doc.status === "Pending") {
      assert.equal(doc.workflow.status, "Pending");
      const step = doc.workflow.steps.find(
        (s) => s.step_order === doc.workflow.current_step,
      );
      assert.equal(step.status, "Pending");
      const actor = active.find((u) => u.id === step.approver_id);
      assert.ok(actor);
    }
  }
  if (service)
    for (const user of active.filter((u) => u.role.name !== "Administrator")) {
      const list = await service.findAll({
        currentUserId: user.id,
        limit: 200,
      });
      assert.ok(Array.isArray(list.data));
    }
  return {
    documents: docs.length,
    versions: pdfs,
    signed_version_steps: images,
    workflow_history_snapshots: history,
    states: Object.fromEntries(
      ["Draft", "Pending", "Approved", "Returned", "Rejected", "Cancelled"].map(
        (status) => [status, docs.filter((d) => d.status === status).length],
      ),
    ),
    folders: await client.folder.count(),
    notifications: await client.notification.count(),
    audits: await client.auditLog.count(),
  };
}

async function apply(file) {
  file = manifestPath(file);
  const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.match(manifest.batch, /^dms_demo_\d+_[a-f0-9]{6}$/);
  assert.deepEqual(manifest.target, {
    host: targetUrl.hostname,
    port: targetUrl.port,
    database: targetUrl.pathname,
    schema: targetUrl.searchParams.get("schema") || "public",
  });
  const directory = path.dirname(file),
    payload = fs.readFileSync(path.join(directory, "dataset.json.gz"));
  assert.equal(
    crypto.createHash("sha256").update(payload).digest("hex"),
    manifest.dataset_sha256,
  );
  const { dataset, running } = decoded(
    JSON.parse(zlib.gunzipSync(payload).toString("utf8")),
  );
  const summary = await db.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(
        "LOCK TABLE users, roles, permissions, role_permissions, departments, positions, document_types, approval_matrix, documents, document_versions, workflows, workflow_steps, pr_forms, pr_form_items, po_forms, po_form_items, bk_forms, folders, folder_permissions, running_numbers, notifications, audit_logs IN SHARE ROW EXCLUSIVE MODE",
      );
      const current = await fingerprints(tx, [
        ...protectedTables,
        "documents",
        "document_versions",
        "folders",
        "running_numbers",
      ]);
      assert.deepEqual(
        current,
        manifest.baseline,
        "Data changed after preparation; prepare again before replacing",
      );
      const oldDocs = await tx.document.findMany({
          select: { id: true, doc_number: true },
        }),
        oldFolders = await tx.folder.findMany({ select: { id: true } });
      const auditFilter = {
        OR: [
          { module: { in: ["Document", "Workflow", "Folder"] } },
          {
            target_id: {
              in: [
                ...oldDocs.flatMap((d) => [d.id, d.doc_number]),
                ...oldFolders.map((f) => f.id),
              ],
            },
          },
        ],
      };
      const backup = {
        batch: manifest.batch,
        created_at: new Date().toISOString(),
        protected: current,
        data: {},
      };
      for (const model of models)
        backup.data[model] = await tx[model].findMany(
          model === "auditLog"
            ? { where: auditFilter }
            : model === "notification"
              ? { where: { document_id: { in: oldDocs.map((d) => d.id) } } }
              : {},
        );
      backup.running = await tx.runningNumber.findMany();
      const backupBytes = zlib.gzipSync(JSON.stringify(encoded(backup)));
      const backupFile = path.join(directory, "before-replacement.json.gz");
      fs.writeFileSync(backupFile, backupBytes);
      fs.writeFileSync(
        path.join(directory, "backup-sha256.txt"),
        crypto.createHash("sha256").update(backupBytes).digest("hex"),
      );
      // Clear ONLY document-related records, then replace them in the same transaction.
      await tx.auditLog.deleteMany({ where: auditFilter });
      await tx.notification.deleteMany({
        where: { document_id: { in: oldDocs.map((d) => d.id) } },
      });
      await tx.document.deleteMany({
        where: { id: { in: oldDocs.map((d) => d.id) } },
      });
      await tx.folderPermission.deleteMany();
      await tx.folder.updateMany({ data: { parent_id: null } });
      await tx.folder.deleteMany();
      for (const model of models)
        if (dataset[model].length)
          await tx[model].createMany({
            data: dataset[model].map((row) => dbRow(model, row)),
          });
      for (const row of running)
        await tx.runningNumber.update({
          where: { document_type_id: row.document_type_id },
          data: {
            current_number: row.current_number,
            last_reset_year: row.last_reset_year,
          },
        });
      const after = await fingerprints(tx, protectedTables);
      assert.deepEqual(
        after,
        Object.fromEntries(
          protectedTables.map((table) => [table, manifest.baseline[table]]),
        ),
        "Protected records changed",
      );
      await tx.auditLog.create({
        data: {
          action: "Upload",
          module: "DemoData",
          target_id: manifest.batch,
          details: {
            oldState: { documents: oldDocs.length },
            newState: manifest.summary,
            extra: {
              is_demo: true,
              seed_batch: manifest.batch,
              comment:
                "แทนที่เอกสารด้วยข้อมูลจำลองจากฐานข้อมูล; สำรองเอกสารเดิมก่อนเปลี่ยนแล้ว",
            },
          },
        },
      });
      return {
        replaced_documents: oldDocs.length,
        backup: backupFile,
        protected_records_unchanged: true,
        ...manifest.summary,
      };
    },
    { timeout: 120000, maxWait: 30000 },
  );
  fs.writeFileSync(
    path.join(directory, "replacement-committed.json"),
    JSON.stringify(
      { committed_at: new Date().toISOString(), ...summary },
      null,
      2,
    ),
  );
  await verifyApplied(file);
}

// Read-only database verification can be resumed without repeating replacement.
async function verifyApplied(file) {
  file = manifestPath(file);
  const directory = path.dirname(file);
  const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.match(manifest.batch, /^dms_demo_\d+_[a-f0-9]{6}$/);
  assert.deepEqual(manifest.target, {
    host: targetUrl.hostname,
    port: targetUrl.port,
    database: targetUrl.pathname,
    schema: targetUrl.searchParams.get("schema") || "public",
  });
  const payload = fs.readFileSync(path.join(directory, "dataset.json.gz"));
  assert.equal(
    crypto.createHash("sha256").update(payload).digest("hex"),
    manifest.dataset_sha256,
  );
  const { dataset } = decoded(
    JSON.parse(zlib.gunzipSync(payload).toString("utf8")),
  );
  const actualIds = await db.document.findMany({ select: { id: true } });
  assert.deepEqual(
    actualIds.map((d) => d.id).sort(),
    dataset.document.map((d) => d.id).sort(),
  );
  const protectedAfter = await fingerprints(db, protectedTables);
  assert.deepEqual(
    protectedAfter,
    Object.fromEntries(
      protectedTables.map((table) => [table, manifest.baseline[table]]),
    ),
    "Protected records changed",
  );
  const backupFile = path.join(directory, "before-replacement.json.gz");
  const backupBytes = fs.readFileSync(backupFile);
  assert.equal(
    crypto.createHash("sha256").update(backupBytes).digest("hex"),
    fs.readFileSync(path.join(directory, "backup-sha256.txt"), "utf8").trim(),
  );
  const backup = JSON.parse(zlib.gunzipSync(backupBytes).toString("utf8"));
  const summary = {
    replaced_documents: backup.data.document.length,
    backup: backupFile,
    protected_records_unchanged: true,
    ...manifest.summary,
  };
  const verification = await validate(db, manifest.batch);
  fs.writeFileSync(
    path.join(directory, "applied.json"),
    JSON.stringify(
      { applied_at: new Date().toISOString(), ...summary, verification },
      null,
      2,
    ),
  );
  await db.$executeRawUnsafe(
    `DROP SCHEMA IF EXISTS "${manifest.batch}" CASCADE`,
  );
  console.log(
    JSON.stringify({ applied: true, ...summary, verification }, null, 2),
  );
}
const mode = process.argv[2];
(async () => {
  try {
    if (mode === "prepare") await prepare();
    else if (mode === "apply" && process.argv[3]) await apply(process.argv[3]);
    else if (mode === "verify" && process.argv[3])
      await verifyApplied(process.argv[3]);
    else
      throw Error(
        "Usage: node scripts/reseed-document-demo.cjs prepare | apply <manifest.json> | verify <manifest.json>",
      );
  } finally {
    await db.$disconnect();
  }
})().catch((error) => {
  console.error(error.name + ": " + error.message.slice(0, 800));
  console.error(
    error.stack
      ?.split("\n")
      .filter((line) => /^\s+at /.test(line))
      .slice(0, 4)
      .join("\n"),
  );
  process.exitCode = 1;
});
