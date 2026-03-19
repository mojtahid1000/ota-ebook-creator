"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/admin/stat-card";
import { Users, Crown, Zap } from "lucide-react";

type SubscriptionRow = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  plan: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
};

const PLAN_OPTIONS = ["free", "pro", "unlimited"];

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  async function fetchSubscriptions() {
    try {
      const res = await fetch("/api/admin/subscriptions");
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data);
      }
    } catch (err) {
      console.error("Failed to fetch subscriptions:", err);
    } finally {
      setLoading(false);
    }
  }

  async function changePlan(userId: string, newPlan: string) {
    setChangingPlan(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/update-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });
      if (res.ok) {
        setSubscriptions((prev) =>
          prev.map((s) =>
            s.user_id === userId ? { ...s, plan: newPlan } : s
          )
        );
      }
    } catch (err) {
      console.error("Plan change failed:", err);
    } finally {
      setChangingPlan(null);
    }
  }

  const freeCount = subscriptions.filter((s) => s.plan === "free").length;
  const proCount = subscriptions.filter((s) => s.plan === "pro").length;
  const unlimitedCount = subscriptions.filter(
    (s) => s.plan === "unlimited"
  ).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1E3A5F]">সাবস্ক্রিপশন</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="ফ্রি ইউজার"
          value={freeCount}
          iconColor="text-slate-500"
          iconBg="bg-slate-100"
        />
        <StatCard
          icon={Crown}
          label="প্রো ইউজার"
          value={proCount}
          iconColor="text-[#F97316]"
          iconBg="bg-[#F97316]/10"
        />
        <StatCard
          icon={Zap}
          label="আনলিমিটেড ইউজার"
          value={unlimitedCount}
          iconColor="text-[#14B8A6]"
          iconBg="bg-[#14B8A6]/10"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  ইউজার
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  ইমেইল
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  প্ল্যান
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  স্ট্যাটাস
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  শুরু
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  মেয়াদ শেষ
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  অ্যাকশন
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    কোনো সাবস্ক্রিপশন নেই
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr
                    key={sub.id || sub.user_id}
                    className="border-b border-slate-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {sub.user_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {sub.user_email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-[#F97316]/10 text-[#F97316] capitalize">
                        {sub.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-600 capitalize">
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {sub.started_at
                        ? new Date(sub.started_at).toLocaleDateString("bn-BD")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {sub.expires_at
                        ? new Date(sub.expires_at).toLocaleDateString("bn-BD")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={sub.plan}
                        onChange={(e) =>
                          changePlan(sub.user_id, e.target.value)
                        }
                        disabled={changingPlan === sub.user_id}
                        className="px-2 py-1 rounded border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#F97316]/50 disabled:opacity-50"
                      >
                        {PLAN_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </option>
                        ))}
                      </select>
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
