"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  CreditCard,
  FolderKanban,
  Cpu,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";

type UserDetail = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  subscription: {
    plan: string;
    status: string;
    started_at: string | null;
    expires_at: string | null;
  } | null;
  projects: {
    id: string;
    title: string | null;
    status: string;
    current_step: number;
    created_at: string;
  }[];
  total_tokens: number;
};

const PLAN_OPTIONS = ["free", "pro", "unlimited"];

const STEP_LABELS: Record<number, string> = {
  1: "নিশ নির্বাচন",
  2: "সাব-নিশ",
  3: "অডিয়েন্স",
  4: "সমস্যা",
  5: "সমাধান",
  6: "রিসার্চ",
  7: "বইয়ের নাম",
  8: "আউটলাইন",
  9: "কন্টেন্ট",
  10: "রিভিউ",
  11: "এক্সপোর্ট",
  12: "কভার",
};

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  async function fetchUser() {
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setSelectedPlan(data.subscription?.plan || "free");
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive() {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: "POST",
      });
      if (res.ok && user) {
        setUser({ ...user, is_active: !user.is_active });
      }
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  }

  async function updatePlan() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/update-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      if (res.ok) {
        await fetchUser();
      }
    } catch (err) {
      console.error("Plan update failed:", err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse" />
        <div className="bg-white rounded-xl border p-6 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-slate-100 rounded w-1/2 mb-2" />
          <div className="h-4 bg-slate-100 rounded w-1/4" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20 text-slate-400">
        ইউজার পাওয়া যায়নি
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/admin/users")}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        ইউজার তালিকায় ফিরে যান
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-[#1E3A5F]/10 flex items-center justify-center">
              <User className="w-7 h-7 text-[#1E3A5F]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {user.full_name || "নাম নেই"}
              </h2>
              <p className="text-sm text-slate-500">{user.role}</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />
              {user.email}
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              যোগদান: {new Date(user.created_at).toLocaleDateString("bn-BD")}
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Cpu className="w-4 h-4 text-slate-400" />
              টোকেন ব্যবহার: {user.total_tokens.toLocaleString("bn-BD")}
            </div>
          </div>

          {/* Activate/Deactivate */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <Button
              variant={user.is_active ? "danger" : "primary"}
              size="sm"
              onClick={toggleActive}
              className="w-full"
            >
              {user.is_active ? (
                <>
                  <ShieldOff className="w-4 h-4" />
                  নিষ্ক্রিয় করুন
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  সক্রিয় করুন
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#F97316]" />
            সাবস্ক্রিপশন
          </h3>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-500">বর্তমান প্ল্যান:</span>
              <span className="ml-2 font-semibold text-slate-800 capitalize">
                {user.subscription?.plan || "free"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">স্ট্যাটাস:</span>
              <span className="ml-2 font-medium text-green-600 capitalize">
                {user.subscription?.status || "active"}
              </span>
            </div>
            {user.subscription?.expires_at && (
              <div>
                <span className="text-slate-500">মেয়াদ শেষ:</span>
                <span className="ml-2 text-slate-700">
                  {new Date(user.subscription.expires_at).toLocaleDateString(
                    "bn-BD"
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Plan Change */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-600 mb-2">
              প্ল্যান পরিবর্তন
            </label>
            <div className="flex gap-2">
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/50"
              >
                {PLAN_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={updatePlan}
                loading={saving}
                disabled={selectedPlan === (user.subscription?.plan || "free")}
              >
                আপডেট
              </Button>
            </div>
          </div>
        </div>

        {/* Token Usage Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-600" />
            টোকেন ব্যবহার সারাংশ
          </h3>
          <div className="text-center py-6">
            <p className="text-3xl font-bold text-slate-800">
              {user.total_tokens.toLocaleString("bn-BD")}
            </p>
            <p className="text-sm text-slate-500 mt-1">মোট টোকেন ব্যবহৃত</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500">
              প্রজেক্ট সংখ্যা: {user.projects.length}
            </p>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-700 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-[#F97316]" />
            প্রজেক্ট তালিকা ({user.projects.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  শিরোনাম
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  স্ট্যাটাস
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  ধাপ
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  তারিখ
                </th>
              </tr>
            </thead>
            <tbody>
              {user.projects.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    কোনো প্রজেক্ট নেই
                  </td>
                </tr>
              ) : (
                user.projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-slate-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {project.title || "নতুন ইবুক"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 capitalize">
                        {project.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {project.current_step}/12
                      <span className="text-slate-400 ml-1">
                        ({STEP_LABELS[project.current_step] || ""})
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
