# DMS data and workflow fidelity review — 4 November 2026

## Result

The approval stamp in the reported export came from `reseed-document-demo.cjs`, which generated a synthetic `DEMO APPROVAL / SAMPLE` image instead of reading the registered user's signature. Those images were persisted in version snapshots and PDF bytes. Changing the renderer alone would not fix existing downloads.

Repaired 246 explicitly tagged demo versions using the corresponding registered user images. Preserved the demo provenance, original approval actors/dates, user profiles and non-demo versions. Backed up exact original PDF bytes and snapshots before applying changes. Nine `MOCK-...` records with no version or workflow were soft deleted, with individual audit entries. No replacement approval events were invented.

The read-only post-repair audit checked all 66 active documents and 253 persisted versions: zero failures in the implemented checks. All 253 PDFs parsed successfully. Seven registered user signatures passed image decoding. Ten deleted documents remain retained, including the nine quarantined empty placeholders; the version totals above exclude deleted documents.

## Application corrections

- Fixture generation now requires registered PNG/JPEG signatures and refuses missing or corrupt images. It no longer draws substitute approval stamps. The older document seeds that created approved records without signed PDFs have been retired. The default seed now creates master data without inventing document approval history.
- PR, PO, BK and DOC can receive a new uploaded version after filing. Replacement bytes begin a new Draft approval cycle; previous signed versions remain immutable and their approval workflow is retained in history. A replacement never inherits approval for different file bytes.
- Workflow submission and approval preserve uploaded PDF bytes, including replacement uploads for PR/PO/BK, instead of regenerating unrelated form content. Actual approval stamps the registered image onto that PDF.
- Submission requires a readable registered creator signature. Generated exports show `SIGNED & APPROVED` only with an image, signature-applied flag and action date.
- Company name/address come from administrator Config. Missing settings do not introduce invented company details. Each version freezes its company details and signer images; later Config/profile edits cannot alter earlier versions. Existing Config values were preserved as requested.
- Removed invented requester/department fallbacks, decorative folder participants, static department options, placeholder PDF viewer content and a hardcoded signer name. Department filters read the current lookup API.
- Failed dashboard/notification/folder/approval loads no longer return successful synthetic zero/empty results. Relevant pages show load failures. Notification read actions no longer change the displayed read state when the save failed.
- Folder access remains open to all authenticated users as requested; document visibility remains enforced separately.

## Validation

- Nest server build and client TypeScript checks.
- Unit tests for version upload, historical rendering and folder behavior.
- Client API contracts, error handling, dashboard and document permission regression tests.
- PostgreSQL/Nest HTTP integration in a separate scratch schema: authentication, roles, creation, approval order, duplicate approvers, return/edit/resubmit, cancellation, soft deletion, concurrency, notifications, running numbers, master data, signature persistence, dashboard counts, password reset/SMTP sink, custom document types, Config snapshots, history access and replacement-file signing for all four document types. Machine-readable result: `e2e-results.json`. The scratch run preserves primary database counts.
- Rendered and visually reviewed an actual approved PR, PO, BK and DOC export (five pages total). Registered signature images replace the former synthetic stamps. No overlap or clipping was observed on these sampled pages.

## Evidence and rerun

The original backup and detailed before/after reports stay local because they contain historical document data:

- Backup: `D:/Document-Management-System/dms/server/.local/integrity/2026-11-04T14-10-35-461Z/before-repair.json.gz`
- Backup checksum: same directory, `backup-sha256.txt`.
- Post-repair audit: `D:/Document-Management-System/dms/server/.local/integrity/2026-11-04T14-20-21-345Z/after.json`.
- Approved PDF samples and page PNGs: same post-repair directory, filenames prefixed `PR-approved`, `PO-approved`, `BK-approved`, `DOC-approved`.

Read-only audit: `node scripts/audit-document-integrity.cjs` from `dms/`.

Fixture repair is an explicit operation: `--repair-demo`. It refuses untagged production versions, saves a backup, validates registered images, checks for concurrent changes and applies updates transactionally. Do not run the default database seed to repair existing documents.

This review establishes the listed checks and sampled PDF layouts. It is not a claim that every possible browser interaction or business input has been exhaustively tested. Historical sample approvals retain their sample-data provenance; using a registered image for fixture fidelity does not assert that the user performed those historical approvals.
