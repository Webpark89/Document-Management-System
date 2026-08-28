import { FileStack } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] p-4 sm:p-6">
      <div className="w-full max-w-4xl space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30">
            <FileStack className="size-6 text-white" />
          </div>
          <h1 className="mt-3 text-2xl font-black text-white tracking-tight">DMS</h1>
          <p className="mt-0.5 text-xs text-slate-400 font-medium">
            Document Management & Electronic Approval System
          </p>
        </div>

        {/* Content Card Wrapper */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
