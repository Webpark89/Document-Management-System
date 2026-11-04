interface Props {
  steps: { approverId?: string; approverName?: string; stepOrder: number }[];
}

export function AutomaticApproverVisibility({ steps }: Props) {
  const selected = steps.filter(
    (step, index) =>
      step.approverId &&
      steps.findIndex((other) => other.approverId === step.approverId) ===
        index,
  );
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-800">
      <p className="font-bold">ผู้อนุมัติมองเห็นเอกสารอัตโนมัติ</p>
      <p className="mt-1 leading-relaxed">
        เมื่อส่งอนุมัติ ผู้อนุมัติทุกขั้นที่เลือกจะมองเห็นเอกสารนี้
        แม้ไม่ได้อยู่ในแผนกหรือรายชื่อที่ระบุ ไม่ต้องเพิ่มชื่อซ้ำ
      </p>
      {selected.length > 0 && (
        <ul
          className="mt-2 flex flex-wrap gap-2"
          aria-label="ผู้อนุมัติที่ได้รับสิทธิ์มองเห็นอัตโนมัติ"
        >
          {selected.map((step) => (
            <li
              key={step.approverId}
              className="rounded-lg bg-white px-2.5 py-1 font-semibold"
            >
              ขั้นที่ {step.stepOrder}:{" "}
              {step.approverName || "ผู้อนุมัติที่เลือก"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
