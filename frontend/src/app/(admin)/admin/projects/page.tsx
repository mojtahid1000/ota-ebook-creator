"use client";

import { useEffect, useState } from "react";
import { Search, ChevronDown } from "lucide-react";

type ProjectRow = {
  id: string;
  title: string | null;
  user_email: string;
  user_name: string | null;
  main_niche: string | null;
  current_step: number;
  status: string;
  created_at: string;
};

const STATUS_OPTIONS = [
  { value: "all", label: "সব স্ট্যাটাস" },
  { value: "draft", label: "ড্রাফট" },
  { value: "in_progress", label: "চলছে" },
  { value: "completed", label: "সম্পন্ন" },
  { value: "exported", label: "এক্সপোর্টেড" },
];

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/admin/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = projects.filter((p) => {
    const matchesSearch =
      !search ||
      (p.title || "").toLowerCase().includes(search.toLowerCase()) ||
      p.user_email.toLowerCase().includes(search.toLowerCase()) ||
      (p.main_niche || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1E3A5F]">প্রজেক্ট মনিটর</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="শিরোনাম, ইউজার বা নিশ দিয়ে সার্চ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316]"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316]"
          >
            {STATUS_OPTIONS.map((opt) => (
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
                  শিরোনাম
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  ইউজার
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  নিশ
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  ধাপ
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  স্ট্যাটাস
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  তারিখ
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    কোনো প্রজেক্ট পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filtered.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-slate-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {project.title || "নতুন ইবুক"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{project.user_name || "—"}</div>
                      <div className="text-xs text-slate-400">
                        {project.user_email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {project.main_niche || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 font-medium">
                          {project.current_step}/12
                        </span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#F97316] rounded-full"
                            style={{
                              width: `${(project.current_step / 12) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 capitalize">
                        {project.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(project.created_at).toLocaleDateString("bn-BD")}
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
