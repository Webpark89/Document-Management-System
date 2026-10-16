import {
  ArrowUpRight,
  Check,
  FileCheck2,
  FileStack,
  FolderClosed,
  PenLine,
} from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-[#f5f6fb] px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/15">
            <FileStack
              className="size-5"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-tight text-slate-900">
              DMS Electronic
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              Document &amp; Approval Workspace
            </p>
          </div>
        </div>
        <span className="hidden rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-500 sm:inline-flex">
          พื้นที่ทำงานสำหรับองค์กร
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center py-7 sm:py-10">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_24px_80px_-35px_rgba(30,41,82,0.28)] lg:min-h-[620px] lg:grid-cols-[1.05fr_1fr]">
          <section className="relative hidden flex-col overflow-hidden bg-[#eeefff] px-7 py-8 sm:px-10 sm:py-10 lg:flex lg:p-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-28 -top-36 size-96 rounded-full bg-white/75 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-32 -right-28 size-96 rounded-full bg-indigo-200/55 blur-3xl"
            />
            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-3 py-1.5 text-[11px] font-bold tracking-wide text-indigo-700">
                <span className="size-1.5 rounded-full bg-indigo-500" />{" "}
                DOCUMENT MANAGEMENT
              </div>
              <h1 className="text-[28px] font-extrabold leading-[1.4] tracking-tight text-[#242448] sm:text-4xl lg:text-[40px]">
                ทุกเอกสาร ทุกการอนุมัติ
                <br />
                <span className="text-indigo-600">จัดการได้ในที่เดียว</span>
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600">
                สร้างเอกสาร ส่งต่อเพื่ออนุมัติ และติดตามความคืบหน้า
                ให้ทุกขั้นตอนการทำงานเป็นระบบยิ่งขึ้น
              </p>
            </div>

            <div
              aria-hidden="true"
              className="relative mx-auto my-8 hidden h-56 w-full max-w-sm sm:block lg:my-9"
            >
              <div className="absolute inset-x-10 bottom-0 top-5 rotate-6 rounded-2xl border border-indigo-100 bg-indigo-100/70" />
              <div className="absolute inset-x-7 bottom-2 top-2 -rotate-3 rounded-2xl border border-indigo-100 bg-white p-5 shadow-[0_16px_40px_-20px_rgba(79,70,229,0.35)]">
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <FileCheck2 className="size-5" />
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                    อนุมัติเรียบร้อย
                  </span>
                </div>
                <p className="mt-4 text-sm font-bold text-slate-800">
                  ใบขออนุมัติ
                </p>
                <div className="mt-3 space-y-2">
                  <div className="h-1.5 w-4/5 rounded-full bg-slate-100" />
                  <div className="h-1.5 w-full rounded-full bg-slate-100" />
                  <div className="h-1.5 w-3/5 rounded-full bg-slate-100" />
                </div>
                <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-3">
                  {["สร้างเอกสาร", "อนุมัติ", "จัดเก็บ"].map((label, index) => (
                    <div
                      key={label}
                      className="flex flex-1 items-center gap-1.5"
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                        <Check className="size-3" />
                      </span>
                      <span className="text-[9px] font-medium text-slate-500">
                        {label}
                      </span>
                      {index < 2 && (
                        <div className="ml-auto h-px flex-1 bg-indigo-100" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -right-1 bottom-9 flex items-center gap-2.5 rounded-xl border border-white bg-white px-3.5 py-3 shadow-lg shadow-indigo-900/10">
                <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <PenLine className="size-4" />
                </span>
                <div>
                  <p className="text-[11px] font-bold text-slate-700">
                    Electronic Approval
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    ทุกขั้นตอน เชื่อมต่อกัน
                  </p>
                </div>
                <ArrowUpRight className="ml-2 size-4 text-slate-300" />
              </div>
            </div>

            <div className="relative mt-6 flex flex-wrap gap-x-5 gap-y-3 border-t border-indigo-200/60 pt-5 text-xs font-medium text-slate-600 lg:mt-auto">
              <span className="flex items-center gap-2">
                <FileStack className="size-4 text-indigo-500" /> จัดการเอกสาร
              </span>
              <span className="flex items-center gap-2">
                <PenLine className="size-4 text-indigo-500" /> อนุมัติออนไลน์
              </span>
              <span className="flex items-center gap-2">
                <FolderClosed className="size-4 text-indigo-500" />{" "}
                ค้นหาย้อนหลัง
              </span>
            </div>
          </section>

          <section
            aria-label="เข้าใช้งานระบบ"
            className="relative flex items-center justify-center bg-[#141b35] px-7 py-10 sm:px-12 sm:py-12 lg:px-14"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.13),transparent_65%)]"
            />
            <div className="relative w-full max-w-sm">{children}</div>
          </section>
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <p>DMS Electronic Approval System</p>
        <p>ระบบจัดการเอกสารและการอนุมัติอิเล็กทรอนิกส์</p>
      </footer>
    </div>
  );
}
