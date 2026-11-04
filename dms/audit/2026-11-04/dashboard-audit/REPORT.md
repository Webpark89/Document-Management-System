# Dashboard and Audit Log reconciliation — 4 November 2026

## Actual database reconciliation

Read-only check at 22:41 Bangkok time. Evidence: `live-check.json`.

| Metric | Actual value |
| --- | ---: |
| Active documents | 66 |
| Pending | 17 |
| Approved | 24 |
| Returned | 8 |
| Rejected | 4 |
| Draft | 8 |
| Cancelled | 5 |
| Completed approvals in November, by `approved_at` | 0 |
| Approved PR/PO document value | 194,673.15 THB |

Type totals are PR 18, PO 16, BK 16 and DOC 16. All six statuses now add up to the 66 active documents. For `manager01`, the database has six documents created by that user, zero of those currently Pending, zero completed approvals on those documents this month, and 12 current approval tasks assigned to that user. Own submissions and incoming approval tasks are different sets; those screenshot numbers are consistent.

The screenshot's monthly zero is correct at this point in time: no active, fully approved document has a November completion date. It should not be replaced with the number of old approvals or intermediate signature steps. However, the original UI used the creation date to count monthly approvals and discarded `approved_at` in the data mapper, so it would wrongly show zero for an older document newly approved this month. That defect is fixed.

## Dashboard corrections

- Preserve completion date, submission date and stable department IDs through the API-to-dashboard mapping.
- Count monthly completions from actual `approved_at`, current Approved status and the Asia/Bangkok calendar month. The statistics API exposes the same monthly metrics.
- Select a person's own documents by creator ID, not partial display-name matches. Department filters use IDs/exact matches, not substring matches.
- Separate Returned from Rejected. Include Draft and all other statuses in the status charts. Expand the legend space for all six statuses.
- Count pending-by-department using only Pending records.
- Calculate overdue approval age and its displayed date/day count from workflow submission time instead of initial creation time.
- Monthly-card clicks filter the displayed documents to that month. Scope labels describe accessible/selected data rather than implying that a restricted user sees the whole system.
- PR/PO value remains the sum of approved document amounts, not an assertion of actual payments or deduplicated procurement spend.

## Audit Log corrections

- Removed the Details header, cell, expansion buttons and expanded row from the visible table. There are seven columns. Historical details remain stored for audit evidence; they were not deleted.
- Retrieve complete paged history rather than truncating the page/export to the latest 100 records. Stable sorting and client-side ID deduplication preserve paging behavior.
- Search handles user IDs, usernames, full names, and captured historical actor names. Date filters and displayed dates use complete Bangkok calendar days.
- New HTTP audit entries inherit the actual request IP and a minimal actor-name snapshot, including transaction-based upload and approval operations. Concurrent-request tests verify context isolation. Missing old IP addresses display as unknown, not a fabricated `127.0.0.1`.
- PDF inline previews record View; an explicit attachment download records Download. Failed operations do not generate a successful edit event.
- Document targets resolve to document numbers, including soft-deleted records. Deleted document targets are not offered as working document links.
- The database check found 626 stored audit records, including 394 explicitly tagged imported histories and 65 records without an IP. Imported histories now carry an in-row provenance label and a CSV source value. Their synthetic fixture IP is not presented as captured client evidence. Original historical records remain unchanged.
- CSV export escapes every field, handles quotes/newlines and includes source provenance. Loading errors are distinct from an empty result and offer retry.

## Validation

198 regression cases pass: 55 server unit tests, 83 client/component/API-contract tests, and 60 PostgreSQL/Nest HTTP integration scenarios. The latter include seven dashboard/audit scenarios:

1. Create a document, place its creation in an earlier month, approve it through three real HTTP steps, and verify that this month's completion count increases.
2. Verify actual actors/IPs for upload, view, download, approval and signature records; rename a profile and verify the historical actor remains searchable; reject a forbidden edit without recording success.
3. Generate more than 100 real document views and retrieve every matching event across pages.
4. Verify Thai-midnight filter boundaries, unknown historical IPs and invalid filter rejection.
5. Compare role-scoped totals and current-step queues with independent database queries.
6. Identify tagged imported histories without rewriting their source records.
7. Verify soft deletion remains auditable and Audit Log access remains permission-protected.

The integration suite runs in an isolated `codex_flow_*` schema. Primary counts remain 77 retained document records, 259 retained versions and eight user records before and after the run; these include soft-deleted records. Primary data inspection is read-only. Evidence: `e2e-results.json`; additional focused audit assertions: `focused/e2e-results.json`.

Nest build, client/server TypeScript checks and diff whitespace checks pass. Table/component tests inspect rendering and handlers; this is not a claim that every browser interaction has been manually exercised. Old events lacking an original actor snapshot or captured IP cannot have those facts reconstructed retroactively; the implementation does not fabricate them.
