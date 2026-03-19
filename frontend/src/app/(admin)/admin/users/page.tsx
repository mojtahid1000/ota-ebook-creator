"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown } from "lucide-react";

type UserRow = {
  id: string;
  full_name: string | null;
  email: string;
  plan: string;
  project_count: number;
  is_active: boolean;
  created_at: string;
};

const PLAN_OPTIONS = [
  { value: "all", label: "সব প্ল্যান" },
  { value: "free", label: "ফ্রি" },
  { value: "pro", label: "প্রো" },
  { value: "unlimited", label: "আনলিমিটেড" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(userId: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: "POST",
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, is_active: !u.is_active } : u
          )
        );
      }
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  }

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === "all" || u.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1E3A5F]">
        ইউজার ম্যানেজমেন্ট
      </h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="নাম বা ইমেইল দিয়ে সার্চ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316]"
          />
        </div>
        <div className="relative">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316]"
          >
            {PLAN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  নাম
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  ইমেইল
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  প্ল্যান
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  প্রজেক্ট সংখ্যা
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  স্ট্যাটাস
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  যোগদান
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    কোনো ইউজার পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                    className="border-b border-slate-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {user.full_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-[#F97316]/10 text-[#F97316] capitalize">
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.project_count}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => toggleActive(user.id, e)}
                        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none"
                        style={{
                          backgroundColor: user.is_active
                            ? "#14B8A6"
                            : "#cbd5e1",
                        }}
                      >
                        <span
                          className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                          style={{
                            transform: user.is_active
                              ? "translateX(18px)"
                              : "translateX(3px)",
                          }}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString("bn-BD")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
