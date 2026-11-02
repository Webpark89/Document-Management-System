type DocumentActor = { id: string; permissions?: readonly string[] };

export function canDeleteDocument(
  actor: DocumentActor | null,
  document: { creator_id?: string },
): boolean {
  if (!actor || !document.creator_id) return false;
  const key =
    document.creator_id === actor.id
      ? "delete_document"
      : "delete_others_document";
  return ["document", "submissions"].some((section) =>
    actor.permissions?.includes(`${section}.${key}:delete`),
  );
}
