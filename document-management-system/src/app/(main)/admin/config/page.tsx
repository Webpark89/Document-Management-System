"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ACTION_CARDS = [
  {
    title: "Create role",
    subtitle: "Define permissions and access levels",
    icon: "shield-plus",
    href: "/admin/config/roles?mode=new",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    title: "Create user",
    subtitle: "Add a new user account",
    icon: "user-plus",
    href: "/admin/config/users?mode=new",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
] as const;

export default function ConfigPage() {
  const router = useRouter();

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className="h-fit w-full bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <nav className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
          <span>Admin</span>
          <span>/</span>
          <span className="font-medium text-slate-600">Config</span>
        </nav>
        <h1 className="text-xl font-semibold text-slate-800">Config</h1>
        <p className="mt-1 text-xs text-slate-400">In-memory demo — resets on refresh</p>
      </header>

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ACTION_CARDS.map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => router.push(card.href)}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div
                className={`flex size-9 items-center justify-center rounded-md ${card.iconBg}`}
              >
                <i className={`ti ti-${card.icon} text-[1.125rem] leading-none ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{card.title}</p>
                <p className="text-xs text-slate-500">{card.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
