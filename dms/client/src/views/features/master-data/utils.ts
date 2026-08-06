import { type DocumentRunningConfig } from "./types";

function buddhistYearParts(): { be4: string; be2: string } {
  const be4 = String(new Date().getFullYear() + 543);
  return { be4, be2: be4.slice(-2) };
}

export function formatRunningPattern(
  config: Pick<DocumentRunningConfig, "prefix" | "yearFormat" | "runningDigits" | "separator">,
  nextCounter = 1
): { pattern: string; example: string } {
  const sep = config.separator === "none" ? "" : config.separator;
  const runToken = `{RUNNING:${config.runningDigits}}`;
  const yearToken =
    config.yearFormat === "be4" ? "{YYYY}" : config.yearFormat === "be2" ? "{YY}" : null;

  let pattern = "{PREFIX}";
  if (yearToken) pattern += sep ? `${sep}${yearToken}` : yearToken;
  pattern += sep ? `${sep}${runToken}` : runToken;

  const { be4, be2 } = buddhistYearParts();
  const yearVal = config.yearFormat === "be4" ? be4 : config.yearFormat === "be2" ? be2 : null;
  const nextNum = String(nextCounter).padStart(config.runningDigits, "0");

  let example = config.prefix;
  if (yearVal) example += sep ? `${sep}${yearVal}` : yearVal;
  example += sep ? `${sep}${nextNum}` : nextNum;

  return { pattern, example };
}

// Dummy functions since backend is not yet implemented for these.
export function getRunningConfigs(): DocumentRunningConfig[] {
  return [];
}

export function updateRunningConfig(
  matrixKey: string,
  patch: Partial<Omit<DocumentRunningConfig, "matrixKey" | "prefix">>
): void {
  // no-op
}

export const APPROVAL_MATRIX = {};
export const SIGNATURES: any[] = [];
export function matrixToDocumentTypes(matrix: any): any[] { return []; }

