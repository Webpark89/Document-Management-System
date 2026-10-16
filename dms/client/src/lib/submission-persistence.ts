import { ApiError } from "./index";

export interface SubmissionSaveState {
  requestId: string;
  savedId?: string;
  attempted: boolean;
}

export function newSubmissionSaveState(savedId?: string): SubmissionSaveState {
  // getRandomValues also works on an HTTP LAN address, unlike randomUUID.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return {
    requestId: `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`,
    savedId,
    attempted: false,
  };
}

interface SavedDocument {
  real_id?: string;
  status: string;
}

/** Reconcile a lost response before deciding whether to create or update. */
export async function saveSubmissionDraft<T extends SavedDocument>(
  state: SubmissionSaveState,
  operations: {
    load: (id: string) => Promise<T | null>;
    create: (requestId: string) => Promise<T>;
    update: (id: string) => Promise<T>;
  },
): Promise<T> {
  let existing: T | null = null;
  if (state.savedId || state.attempted) {
    try {
      existing = await operations.load(state.savedId ?? state.requestId);
    } catch (error) {
      if (!(
        error instanceof ApiError &&
        error.status === 404 &&
        !state.savedId
      ))
        throw error;
    }
    if (!existing && state.savedId)
      throw new Error("ไม่พบฉบับร่างเดิม กรุณาตรวจสอบรายการเอกสาร");
  }
  if (existing) {
    if (!existing.real_id)
      throw new Error("ข้อมูลเอกสารไม่สมบูรณ์ กรุณาโหลดใหม่");
    state.savedId = existing.real_id;
    // A lost submit response may already have advanced the workflow.
    if (!["Draft", "Returned"].includes(existing.status)) return existing;
  }
  state.attempted = true;
  const saved = existing
    ? await operations.update(existing.real_id!)
    : await operations.create(state.requestId);
  if (!saved.real_id)
    throw new Error(
      "ไม่สามารถยืนยันเลขเอกสารที่บันทึกได้ กรุณาตรวจสอบรายการเอกสาร",
    );
  state.savedId = saved.real_id;
  return saved;
}
