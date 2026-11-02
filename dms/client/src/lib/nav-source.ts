/** Which list page a document/approval detail view was opened from. */
export type NavSource =
  | "documents"
  | "folders"
  | "submissions"
  | "submissions_history"
  | "approvals";

export type NavSection = "documents" | "folders" | "submissions" | "approvals";

export function parseNavSource(value?: string | null): NavSource | null {
  switch (value) {
    case "documents":
    case "folders":
    case "submissions":
    case "submissions_history":
    case "approvals":
      return value;
    default:
      return null;
  }
}

export function navSourceSection(source: NavSource): NavSection {
  return source === "submissions_history" ? "submissions" : source;
}

export function withNavSource(href: string, source?: NavSource | null) {
  if (!source) return href;
  return `${href}${href.includes("?") ? "&" : "?"}source=${source}`;
}

export function navSourceListHref(source?: NavSource | null) {
  switch (source) {
    case "folders":
      return "/folders";
    case "submissions":
      return "/submissions";
    case "submissions_history":
      return "/submissions/history";
    case "approvals":
      return "/approvals";
    default:
      return "/documents";
  }
}

export function navSourceListLabel(source?: NavSource | null) {
  switch (source) {
    case "folders":
      return "Back to Folders";
    case "submissions":
    case "submissions_history":
      return "Back to Submissions";
    case "approvals":
      return "Back to Approvals";
    default:
      return "Back to Documents";
  }
}
