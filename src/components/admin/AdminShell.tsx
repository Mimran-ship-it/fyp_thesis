"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Image as ImageIcon,
  Settings,
  Eye,
  LogOut,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Chapters", icon: <BookOpen className="h-4 w-4" /> },
  { href: "/admin/dashboard/media", label: "Media", icon: <ImageIcon className="h-4 w-4" /> },
  { href: "/admin/dashboard/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
  { href: "/", label: "Preview", icon: <Eye className="h-4 w-4" /> },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return false;
  if (pathname === href) return true;
  return pathname.startsWith(href + "/");
}

export function AdminShell({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const active = (href: string) => isActive(pathname, href);
  const initial = (username?.trim()?.[0] || "A").toUpperCase();

  return (
    <div className="min-h-[calc(100vh-0rem)] bg-[#f8fafc]">
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] flex-col bg-[#0f172a] lg:flex">
        <div className="h-1 bg-[#2563eb]" />
        <div className="flex flex-1 flex-col px-4 py-5">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
              <span className="font-sans text-sm font-bold">TP</span>
            </div>
            <div className="min-w-0">
              <div className="truncate font-sans text-sm font-bold text-white">
                Thesis Portal
              </div>
              <div className="truncate font-sans text-xs text-slate-300">
                Admin Dashboard
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563eb] text-white">
              <span className="font-sans text-sm font-bold">{initial}</span>
            </div>
            <div className="min-w-0">
              <div className="font-sans text-xs text-slate-300">Signed in as</div>
              <div className="truncate font-sans text-sm font-semibold text-white">
                Soft robotic project Team
              </div>
            </div>
          </div>

          <nav className="mt-5 flex flex-col gap-1">
            {NAV.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className={[
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 font-sans text-sm transition-colors",
                  active(i.href)
                    ? "bg-[#1e3a5f] text-white"
                    : "text-slate-200 hover:bg-[#1e293b]",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute left-0 top-2 bottom-2 w-1 rounded-r transition-colors",
                    active(i.href) ? "bg-[#2563eb]" : "bg-transparent",
                  ].join(" ")}
                />
                <span className={active(i.href) ? "text-white" : "text-slate-200"}>
                  {i.icon}
                </span>
                <span className="text-[14px]">{i.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-4">
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl bg-red-500/10 px-3 py-2.5 font-sans text-sm text-red-200 hover:bg-red-500/15"
              >
                <LogOut className="h-4 w-4 text-red-300" />
                Logout
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[260px]">
        <main className="mx-auto max-w-7xl px-5 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

