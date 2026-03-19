"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/admin/stat-card";
import {
  Users,
  FolderKanban,
  Download,
  Cpu,
  CreditCard,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type AdminStats = {
  total_users: number;
  total_projects: number;
  total_exports: number;
  total_tokens: number;
  paid_users: number;
  users_by_date: { date: string; count: number }[];
  projects_by_status: { status: string; count: number }[];
};

const STATUS_LABELS: Record<string, string> = {
  draft: "ড্রাফট",
  in_progress: "চলছে",
  completed: "সম্পন্ন",
  exported: "এক্সপোর্টেড",
};

const PIE_COLORS = ["#94a3b8", "#F97316", "#14B8A6", "#1E3A5F"];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">
          অ্যাডমিন ড্যাশবোর্ড
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border p-5 animate-pulse"
            >
              <div className="w-10 h-10 bg-slate-200 rounded-lg mb-3" />
              <div className="h-7 bg-slate-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const pieData = (stats?.projects_by_status || []).map((item) => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.count,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1E3A5F]">
        অ্যাডমিন ড্যাশবোর্ড
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Users}
          label="মোট ইউজার"
          value={stats?.total_users ?? 0}
          iconColor="text-[#1E3A5F]"
          iconBg="bg-[#1E3A5F]/10"
        />
        <StatCard
          icon={FolderKanban}
          label="মোট প্রজেক্ট"
          value={stats?.total_projects ?? 0}
          iconColor="text-[#F97316]"
          iconBg="bg-[#F97316]/10"
        />
        <StatCard
          icon={Download}
          label="মোট এক্সপোর্ট"
          value={stats?.total_exports ?? 0}
          iconColor="text-[#14B8A6]"
          iconBg="bg-[#14B8A6]/10"
        />
        <StatCard
          icon={Cpu}
          label="AI টোকেন ব্যবহার"
          value={stats?.total_tokens?.toLocaleString("bn-BD") ?? "০"}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <StatCard
          icon={CreditCard}
          label="পেইড ইউজার"
          value={stats?.paid_users ?? 0}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Over Time */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-base font-semibold text-slate-700 mb-4">
            ইউজার বৃদ্ধি (গত ৩০ দিন)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.users_by_date || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#1E3A5F"
                  fill="#1E3A5F"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  name="নতুন ইউজার"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projects by Status */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-base font-semibold text-slate-700 mb-4">
            প্রজেক্ট স্ট্যাটাস
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {pieData.map((_, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={PIE_COLORS[idx % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
