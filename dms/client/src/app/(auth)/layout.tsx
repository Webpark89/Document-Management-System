import { FileStack } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/30">
            <FileStack className="size-6 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">DMS</h1>
          <p className="mt-1 text-xs text-slate-400">
            Document Management & Electronic Approval System
          </p>
        </div>

        {/* Card Form Wrapper */}
        <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-8 shadow-2xl backdrop-blur-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
