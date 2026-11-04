# Document visibility and approval access — 4 November 2026

## Verified behavior

The visibility form reads departments and people from authenticated `/api/lookups/departments` and `/api/lookups/users`, backed by Prisma queries against the actual master records. Selection stores stable record IDs, not display names. A read-only check of the configured database found five active departments and seven active users. The PR matrix currently has Manager / Manager / Executive (three steps); other document types retain the step counts configured by the administrator. This work does not change the production matrices.

All currently assigned approvers receive document-level visibility when the workflow is submitted, even when they are outside the selected departments or individually shared users. This applies to every assigned step, including future steps. Viewing a document does not allow approving it before the assigned turn.

Automatic visibility is derived from the current workflow, not copied permanently into the manual sharing list. Returning and resubmitting with a replacement approver removes the previous person's derived access; explicitly shared viewers retain their access. Ordinary users in an approver's department do not gain access simply because a colleague was selected. Existing role/action permissions remain enforced.

## Changes

- Both visibility selection and workflow selection share the same live user directory cache. Loading failures show retryable errors instead of silently displaying an empty list.
- Removed the unused hardcoded department list. Department and person selections use the live Master Data IDs. Disabled departments/users/roles are rejected by server validation.
- Restricted visibility forms show a read-only summary of the selected approvers' automatic access. Added to PR, PO, BK and upload-only forms, on visibility and workflow steps.
- Workflow selection guards duplicate people and ineligible role selections. Eligibility is independent of the manually selected visibility audience.
- Document responses and version snapshots include `visibility.automatic_users`. Submission audit records include `automatic_visibility_users`.
- Manual department/person rules now honor the selected visibility mode consistently in list queries and individual reads. Stale selections from a previous mode cannot grant unintended access or block validation of the current mode.

## Tests

35 visibility-specific cases passed. Final regression totals: 170 passed, zero failed (46 server unit tests, 71 client/component/API tests, 53 PostgreSQL/Nest HTTP cases).

- 12 server unit tests: assigned access, unrelated colleagues, mode isolation, replacement revocation, explicit sharing, unique IDs, inactive Master Data, stale mode fields.
- 12 component tests: live lookup service calls, selected department/user IDs, three-step automatic access summaries, changed selections, eligibility, duplicate blocking, load errors and retry controls.
- 11 PostgreSQL/Nest HTTP cases: actual Master Data rename/disable operations, each of PR/PO/BK/DOC in both Department and SpecificUsers modes with three assigned approvers, replacement revocation and invalid input. These cover document listing, details, PDF preview/download, workflow reads, future-step action rejection and completing all three approvals.

The integration scenarios run in an isolated `codex_flow_*` schema. They do not change production accounts, Master Data, document sharing or document contents. The suite records primary database counts before and after testing. Earlier account/password tests intentionally disable an approver and revoke a viewer session; the visibility fixture restores those scratch accounts and obtains fresh sessions before the three-step scenarios. The final complete suite passes all 53 cases together.

Full integration results: `e2e-results.json` in this directory. Client TypeScript checks and the Nest build pass. Component tests exercise rendering and event handlers; they are not a claim of a manual click-through of every browser screen.

Run the focused integration cases from `dms/` using `DMS_TEST_FILTER='Master Data lookups|three approvers|Replacing a returned three-step|Visibility rejects'` and `node scripts/verify-flow-e2e.cjs`. Omit the filter for the complete regression suite.
