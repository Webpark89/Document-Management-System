/* Audit all document records. --repair-demo repairs ONLY explicitly tagged demo
   version snapshots/PDFs, after a full backup, without changing user signatures,
   approval actors, action dates, document status, or non-demo versions. */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const zlib = require("node:zlib");
const assert = require("node:assert/strict");
const {
  registeredSignature,
  uploadedFixtureHtml,
} = require("./lib/fixture-signatures.cjs");
const { PrismaClient } = require("@prisma/client");
const { PDFDocument } = require("pdf-lib");
const root = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(root, "server/.env"), quiet: true });
process.chdir(path.join(root, "server"));
const { ConfigService } = require("@nestjs/config");
const {
  EncryptionService,
} = require("../server/dist/src/common/encryption/encryption.service");
const {
  DocumentsService,
} = require("../server/dist/src/documents/documents.service");
const encryption = new EncryptionService(new ConfigService(process.env));
const db = new PrismaClient();
const repair = process.argv.includes("--repair-demo");
const directory = path.join(
  root,
  "server/.local/integrity",
  new Date().toISOString().replace(/[:.]/g, "-"),
);
const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const isDemo = (version) => version.form_data?._meta?.seed?.is_demo === true;
const uriHash = (encrypted) => {
  try {
    return hash(encryption.decrypt(encrypted));
  } catch {
    return null;
  }
};
function json(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? String(v) : v)),
  );
}
async function rows() {
  const ids = await db.document.findMany({
    select: { id: true },
    orderBy: { doc_number: "asc" },
  });
  const documents = [];
  // Loading all PDF bytes in one Prisma response can exceed its string limit.
  for (const { id } of ids)
    documents.push(
      await db.document.findUniqueOrThrow({
        where: { id },
        include: {
          type: true,
          creator: {
            include: { department: true, position: true, role: true },
          },
          pr_form: { include: { items: true } },
          po_form: { include: { items: true } },
          bk_form: true,
          workflow: {
            include: {
              steps: {
                include: { approver: { include: { role: true } } },
                orderBy: { step_order: "asc" },
              },
            },
          },
          versions: { orderBy: { version_number: "asc" } },
        },
      }),
    );
  return documents;
}
async function audit(docs, users) {
  const issues = [];
  const counts = {
    documents: docs.filter((d) => !d.is_deleted).length,
    deleted_documents: docs.filter((d) => d.is_deleted).length,
    versions: 0,
    demo_versions: 0,
    pdfs_checked: 0,
    registered_signatures: 0,
  };
  const issue = (doc, code, detail, version) =>
    issues.push({
      document: doc.doc_number,
      code,
      detail,
      ...(version ? { version: version.version_number } : {}),
    });
  for (const user of users.values()) {
    if (user.signature_encrypted) {
      try {
        await registeredSignature(user, encryption);
        counts.registered_signatures++;
      } catch (e) {
        issues.push({
          code: "INVALID_PROFILE_SIGNATURE",
          user_id: user.id,
          detail: e.message,
        });
      }
    }
  }
  for (const doc of docs) {
    if (doc.is_deleted) continue;
    const latest = doc.versions.at(-1);
    if (!latest) issue(doc, "MISSING_VERSION", "No persisted document version");
    if (
      doc.status === "Approved" &&
      (!doc.approved_at ||
        doc.workflow?.status !== "Approved" ||
        !doc.workflow.steps.length ||
        doc.workflow.steps.some(
          (s) =>
            s.status !== "Approved" || !s.action_date || !s.signature_applied,
        ))
    )
      issue(
        doc,
        "APPROVAL_INCONSISTENT",
        "Approved document must have completed signed workflow and approval date",
      );
    if (
      doc.status === "Pending" &&
      (doc.workflow?.status !== "Pending" ||
        !doc.workflow.steps.some(
          (s) =>
            s.step_order === doc.workflow.current_step &&
            s.status === "Pending",
        ))
    )
      issue(
        doc,
        "PENDING_INCONSISTENT",
        "Pending document must have an actionable current step",
      );
    if (doc.workflow) {
      const ids = doc.workflow.steps.map((s) => s.approver_id).filter(Boolean);
      if (new Set(ids).size !== ids.length)
        issue(
          doc,
          "DUPLICATE_APPROVER",
          "Same approver occupies multiple steps",
        );
      if (
        doc.workflow.steps.length !== doc.workflow.total_steps ||
        doc.workflow.steps.some((s, i) => s.step_order !== i + 1)
      )
        issue(
          doc,
          "WORKFLOW_SEQUENCE",
          "Workflow steps must be contiguous and match total_steps",
        );
    }
    const form = doc.pr_form ?? doc.po_form;
    if (form) {
      const expected = form.items.reduce(
        (total, item) =>
          total +
          Number(item.quantity) *
            Number(item.unit_price) *
            (doc.po_form ? 1 + Number(item.vat) / 100 : 1),
        0,
      );
      if (Math.abs(expected - Number(form.total_amount)) > 0.02)
        issue(doc, "FORM_TOTAL", "Saved total differs from line items and VAT");
      if (!form.items.length)
        issue(doc, "EMPTY_ITEMS", "Purchase document has no items");
    }
    if (
      latest?.form_data?._meta?.status &&
      latest.form_data._meta.status !== doc.status
    )
      issue(
        doc,
        "LATEST_STATUS_MISMATCH",
        "Latest snapshot status differs from document state",
        latest,
      );
    for (let i = 0; i < doc.versions.length; i++) {
      const version = doc.versions[i],
        meta = version.form_data?._meta;
      counts.versions++;
      if (isDemo(version)) counts.demo_versions++;
      if (version.version_number !== i + 1)
        issue(
          doc,
          "VERSION_SEQUENCE",
          "Version numbers must start at one and be contiguous",
          version,
        );
      if (!version.file_data?.length) {
        issue(doc, "MISSING_PDF", "Persisted PDF is missing", version);
        continue;
      }
      try {
        const pdf = await PDFDocument.load(version.file_data);
        assert.ok(pdf.getPageCount());
        counts.pdfs_checked++;
      } catch {
        issue(
          doc,
          "INVALID_PDF",
          "Persisted bytes are not a readable PDF",
          version,
        );
      }
      if (Number(version.file_size) !== version.file_data.length)
        issue(
          doc,
          "FILE_SIZE",
          "Stored byte size differs from actual PDF",
          version,
        );
      if (!meta) {
        issue(
          doc,
          "MISSING_SNAPSHOT",
          "No historical metadata snapshot",
          version,
        );
        continue;
      }
      if (
        new Date(meta.created_at) > new Date(version.created_at) ||
        new Date(version.created_at) > new Date(Date.now() + 60000)
      )
        issue(
          doc,
          "VERSION_DATE",
          "Version predates document creation or is in the future",
          version,
        );
      const signed = (meta.workflow?.steps ?? []).filter(
        (s) => s.status === "Approved",
      );
      for (const step of signed) {
        if (
          !step.signature_applied ||
          !step.action_date ||
          !step.approver?.signature_encrypted ||
          !uriHash(step.approver.signature_encrypted)
        )
          issue(
            doc,
            "MISSING_APPROVAL_SIGNATURE",
            `Step ${step.step_order} lacks registered signature evidence`,
            version,
          );
      }
      if (isDemo(version)) {
        for (const signer of [meta.creator, ...signed.map((s) => s.approver)]) {
          const registered = users.get(signer?.id);
          if (
            !registered?.signature_encrypted ||
            uriHash(signer?.signature_encrypted) !==
              uriHash(registered.signature_encrypted)
          )
            issue(
              doc,
              "DEMO_SIGNATURE_SUBSTITUTION",
              `Fixture signature differs from registered user ${signer?.id}`,
              version,
            );
        }
      }
    }
  }
  return { checked_at: new Date().toISOString(), counts, issues };
}
async function repairDemo(docs, users) {
  if (
    !["localhost", "127.0.0.1"].includes(
      new URL(process.env.DATABASE_URL).hostname,
    )
  )
    throw Error("Fixture repair is restricted to local databases");
  const versions = docs.flatMap((d) => d.versions).filter(isDemo);
  for (const version of versions) {
    const meta = version.form_data._meta;
    for (const signer of [
      meta.creator,
      ...(meta.workflow?.steps ?? [])
        .filter((s) => s.status === "Approved")
        .map((s) => s.approver),
    ])
      await registeredSignature(users.get(signer?.id), encryption);
  }
  // Retain exact original snapshots and PDF bytes before changing any fixture.
  const incompleteMocks = docs.filter(
    (d) =>
      !d.is_deleted &&
      /^MOCK-[A-Z]+-\d{4}-\d+$/.test(d.doc_number) &&
      !d.versions.length &&
      !d.workflow,
  );
  const backup = {
    versions: versions.map((v) => ({
      ...v,
      file_data: Buffer.from(v.file_data).toString("base64"),
    })),
    incompleteMocks: json(incompleteMocks),
  };
  const backupBytes = zlib.gzipSync(JSON.stringify(backup));
  fs.writeFileSync(path.join(directory, "before-repair.json.gz"), backupBytes);
  fs.writeFileSync(
    path.join(directory, "backup-sha256.txt"),
    hash(backupBytes),
  );
  const company = JSON.parse(
    fs.readFileSync(path.join(root, "server/uploads/settings.json"), "utf8"),
  );
  const service = new DocumentsService(db, encryption);
  const puppeteer = require("puppeteer-core");
  const executablePath = [
    process.env.PDF_BROWSER_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/chromium",
  ].find((p) => p && fs.existsSync(p));
  if (!executablePath) throw Error("PDF browser is unavailable");
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox"],
  });
  const changes = [];
  try {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", (r) =>
      r.url().startsWith("data:") || r.url() === "about:blank"
        ? r.continue()
        : r.abort(),
    );
    for (const doc of docs) {
      for (const version of doc.versions.filter(isDemo)) {
        const data = json(version.form_data),
          meta = data._meta;
        const replace = (signer) =>
          signer
            ? {
                ...signer,
                signature_encrypted:
                  users.get(signer.id)?.signature_encrypted ?? null,
              }
            : null;
        meta.creator = replace(meta.creator);
        for (const step of meta.workflow?.steps ?? [])
          step.approver =
            step.status === "Approved"
              ? replace(step.approver)
              : { ...step.approver, signature_encrypted: null };
        meta.company = company;
        meta.seed = {
          ...meta.seed,
          signature_source: "registered_profile_at_fixture_repair",
          repaired_at: new Date().toISOString(),
        };
        const fixed = { ...version, form_data: data };
        const html =
          doc.type.prefix === "DOC"
            ? uploadedFixtureHtml(doc, fixed, encryption)
            : service.buildDocumentHtml(doc, fixed);
        assert.ok(!html.includes("DEMO APPROVAL / SAMPLE"));
        await page.setContent(html, { waitUntil: "load", timeout: 15000 });
        const buffer = Buffer.from(
          await page.pdf({ format: "A4", printBackground: true }),
        );
        const pdf = await PDFDocument.load(buffer);
        assert.ok(pdf.getPageCount());
        changes.push({
          id: version.id,
          document_id: doc.id,
          original: hash(Buffer.from(version.file_data)),
          original_form: hash(JSON.stringify(version.form_data)),
          data: {
            form_data: data,
            file_data: buffer,
            file_size: String(buffer.length),
            updated_at: version.updated_at,
          },
        });
        if (
          version.id === doc.versions.at(-1).id &&
          !fs.existsSync(path.join(directory, `${doc.type.prefix}-after.pdf`))
        ) {
          fs.writeFileSync(
            path.join(directory, `${doc.type.prefix}-after.pdf`),
            buffer,
          );
          await page.screenshot({
            path: path.join(directory, `${doc.type.prefix}-after.png`),
            fullPage: true,
          });
        }
      }
      console.log(`Prepared ${doc.doc_number}`);
    }
  } finally {
    await browser.close();
  }
  await db.$transaction(
    async (tx) => {
      // Check exact source versions before applying; new user activity aborts repair.
      await tx.$executeRawUnsafe(
        "LOCK TABLE document_versions IN SHARE ROW EXCLUSIVE MODE",
      );
      for (const change of changes) {
        const current = await tx.documentVersion.findUniqueOrThrow({
          where: { id: change.id },
        });
        assert.equal(
          hash(Buffer.from(current.file_data)),
          change.original,
          "PDF changed during preparation",
        );
        assert.equal(
          hash(JSON.stringify(current.form_data)),
          change.original_form,
          "Snapshot changed during preparation",
        );
        assert.ok(isDemo(current));
        await tx.documentVersion.update({
          where: { id: change.id },
          data: change.data,
        });
      }
      for (const doc of incompleteMocks) {
        const current = await tx.document.findUniqueOrThrow({
          where: { id: doc.id },
          include: { versions: true, workflow: true },
        });
        assert.equal(
          current.versions.length,
          0,
          "Placeholder gained a real version during repair",
        );
        assert.equal(
          current.workflow,
          null,
          "Placeholder gained a workflow during repair",
        );
        await tx.document.update({
          where: { id: doc.id },
          data: { is_deleted: true },
        });
        await tx.auditLog.create({
          data: {
            action: "Delete",
            module: "DemoData",
            target_id: doc.id,
            details: {
              oldState: { is_deleted: false },
              newState: { is_deleted: true },
              extra: {
                reason:
                  "Incomplete MOCK placeholder without a file or workflow",
                backup_sha256: hash(backupBytes),
              },
            },
          },
        });
      }
      await tx.auditLog.create({
        data: {
          action: "Edit",
          module: "DemoData",
          details: {
            oldState: { signature_source: "synthetic_demo_stamp" },
            newState: {
              signature_source: "registered_user_profile",
              repaired_versions: changes.length,
            },
            extra: {
              backup_sha256: hash(backupBytes),
              is_demo: true,
              reason:
                "Repair fixture fidelity; simulated historical approvals remain demo data",
            },
          },
        },
      });
    },
    { timeout: 120000 },
  );
  return changes.length;
}
async function main() {
  fs.mkdirSync(directory, { recursive: true });
  const users = new Map((await db.user.findMany()).map((u) => [u.id, u]));
  const docs = await rows();
  const before = await audit(docs, users);
  fs.writeFileSync(
    path.join(directory, "before.json"),
    JSON.stringify(before, null, 2),
  );
  let repaired = 0;
  if (repair) repaired = await repairDemo(docs, users);
  const after = repair ? await audit(await rows(), users) : before;
  fs.writeFileSync(
    path.join(directory, "after.json"),
    JSON.stringify(after, null, 2),
  );
  if (process.argv.includes("--export-samples")) {
    for (const prefix of ["PR", "PO", "BK", "DOC"]) {
      const doc = docs.find(
        (d) =>
          !d.is_deleted &&
          d.status === "Approved" &&
          d.type.prefix === prefix &&
          d.versions.length,
      );
      if (doc)
        fs.writeFileSync(
          path.join(directory, `${prefix}-approved.pdf`),
          Buffer.from(doc.versions.at(-1).file_data),
        );
    }
  }
  console.log(
    JSON.stringify({
      directory,
      repaired,
      counts: after.counts,
      issues: after.issues.length,
      by_code: after.issues.reduce(
        (a, i) => ((a[i.code] = (a[i.code] ?? 0) + 1), a),
        {},
      ),
    }),
  );
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
