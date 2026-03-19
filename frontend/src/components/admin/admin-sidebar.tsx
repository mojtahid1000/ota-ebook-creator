"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CreditCard,
  Settings,
} from "lucide-react";
import { clsx } from "clsx";

const NAV_ITEMS = [
  {
    label: "ড্যাশবোর্ড",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "ইউজার ম্যানেজমেন্ট",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "প্রজেক্ট মনিটর",
    href: "/admin/projects",
    icon: FolderKanban,
  },
  {
    label: "সাবস্ক্রিপশন",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    label: "সেটিংস",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-[#1E3A5F] text-white flex flex-col">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-white/10">
        <h2 className="text-lg font-bold tracking-tight">OTA Admin</h2>
        <p className="text-xs text-white/50 mt-0.5">Ebook Creator Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-white/40">Online Tech Academy</p>
      </div>
    </aside>
  );
}
