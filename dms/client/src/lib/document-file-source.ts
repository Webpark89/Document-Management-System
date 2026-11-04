export function isUploadedPdfDocument(doc: {
  type?: string | { prefix?: string };
  _meta?: { file_source?: string };
}) {
  const prefix = typeof doc.type === "object" ? doc.type.prefix : doc.type;
  return doc._meta?.file_source === "uploaded_pdf" ||
    !["PR", "PO", "BK", "MEMO", "บันทึก"].includes(prefix ?? "");
}
