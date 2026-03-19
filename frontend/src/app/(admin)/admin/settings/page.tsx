"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Check } from "lucide-react";
import { clsx } from "clsx";

type SettingsMap = Record<string, unknown>;

const TABS = [
  { id: "pricing", label: "প্ল্যান প্রাইসিং" },
  { id: "ai_config", label: "AI কনফিগ" },
  { id: "system", label: "সিস্টেম" },
];

const DEFAULT_PRICING = {
  free: { price_bdt: 0, ebook_limit: 2, token_limit: 50000 },
  pro: { price_bdt: 499, ebook_limit: 10, token_limit: 500000 },
  unlimited: { price_bdt: 999, ebook_limit: -1, token_limit: -1 },
};

const DEFAULT_AI_CONFIG = {
  default_model: "gpt-4o-mini",
  available_models: ["gpt-4o-mini", "gpt-4o", "claude-3-haiku"],
  max_tokens_per_request: 4000,
  enabled_providers: ["openai", "anthropic"],
};

const DEFAULT_SYSTEM = {
  maintenance_mode: false,
  registration_enabled: true,
  max_projects_per_user: 10,
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("pricing");
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Local editable state
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [aiConfig, setAiConfig] = useState(DEFAULT_AI_CONFIG);
  const [system, setSystem] = useState(DEFAULT_SYSTEM);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        if (data.plan_prices) setPricing(data.plan_prices);
        if (data.ai_config) setAiConfig(data.ai_config);
        if (data.system) setSystem(data.system);
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(key: string, value: unknown) {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    if (activeTab === "pricing") {
      saveSettings("plan_prices", pricing);
    } else if (activeTab === "ai_config") {
      saveSettings("ai_config", aiConfig);
    } else if (activeTab === "system") {
      saveSettings("system", system);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">সেটিংস</h1>
        <div className="bg-white rounded-xl border p-6 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4 mb-4" />
          <div className="h-4 bg-slate-100 rounded w-1/2 mb-2" />
          <div className="h-4 bg-slate-100 rounded w-1/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">সেটিংস</h1>
        <Button onClick={handleSave} loading={saving} size="sm">
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              সেভ হয়েছে
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              সেভ করুন
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === tab.id
                ? "bg-white text-[#1E3A5F] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {activeTab === "pricing" && (
          <div className="space-y-6">
            <h3 className="text-base font-semibold text-slate-700">
              প্ল্যান প্রাইসিং (BDT)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(["free", "pro", "unlimited"] as const).map((plan) => (
                <div
                  key={plan}
                  className="border border-slate-200 rounded-lg p-4 space-y-3"
                >
                  <h4 className="text-sm font-bold text-slate-700 uppercase">
                    {plan}
                  </h4>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      মূল্য (BDT)
                    </label>
                    <input
                      type="number"
                      value={pricing[plan].price_bdt}
                      onChange={(e) =>
                        setPricing({
                          ...pricing,
                          [plan]: {
                            ...pricing[plan],
                            price_bdt: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      ইবুক লিমিট (-1 = আনলিমিটেড)
                    </label>
                    <input
                      type="number"
                      value={pricing[plan].ebook_limit}
                      onChange={(e) =>
                        setPricing({
                          ...pricing,
                          [plan]: {
                            ...pricing[plan],
                            ebook_limit: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      টোকেন লিমিট (-1 = আনলিমিটেড)
                    </label>
                    <input
                      type="number"
                      value={pricing[plan].token_limit}
                      onChange={(e) =>
                        setPricing({
                          ...pricing,
                          [plan]: {
                            ...pricing[plan],
                            token_limit: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]/50"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "ai_config" && (
          <div className="space-y-6">
            <h3 className="text-base font-semibold text-slate-700">
              AI কনফিগারেশন
            </h3>
            <div className="max-w-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  ডিফল্ট মডেল
                </label>
                <select
                  value={aiConfig.default_model}
                  onChange={(e) =>
                    setAiConfig({ ...aiConfig, default_model: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/50"
                >
                  {aiConfig.available_models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  প্রতি রিকোয়েস্ট সর্বোচ্চ টোকেন
                </label>
                <input
                  type="number"
                  value={aiConfig.max_tokens_per_request}
                  onChange={(e) =>
                    setAiConfig({
                      ...aiConfig,
                      max_tokens_per_request: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  সক্রিয় প্রোভাইডার
                </label>
                <div className="space-y-2">
                  {["openai", "anthropic", "google"].map((provider) => (
                    <label
                      key={provider}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={aiConfig.enabled_providers.includes(provider)}
                        onChange={(e) => {
                          const newProviders = e.target.checked
                            ? [...aiConfig.enabled_providers, provider]
                            : aiConfig.enabled_providers.filter(
                                (p) => p !== provider
                              );
                          setAiConfig({
                            ...aiConfig,
                            enabled_providers: newProviders,
                          });
                        }}
                        className="rounded border-slate-300 text-[#F97316] focus:ring-[#F97316]/50"
                      />
                      <span className="text-slate-700 capitalize">
                        {provider}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "system" && (
          <div className="space-y-6">
            <h3 className="text-base font-semibold text-slate-700">
              সিস্টেম সেটিংস
            </h3>
            <div className="max-w-lg space-y-5">
              {/* Maintenance Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    মেইনটেন্যান্স মোড
                  </p>
                  <p className="text-xs text-slate-400">
                    চালু করলে ইউজাররা অ্যাপ ব্যবহার করতে পারবে না
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSystem({
                      ...system,
                      maintenance_mode: !system.maintenance_mode,
                    })
                  }
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                  style={{
                    backgroundColor: system.maintenance_mode
                      ? "#F97316"
                      : "#cbd5e1",
                  }}
                >
                  <span
                    className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    style={{
                      transform: system.maintenance_mode
                        ? "translateX(22px)"
                        : "translateX(4px)",
                    }}
                  />
                </button>
              </div>

              {/* Registration Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    রেজিস্ট্রেশন
                  </p>
                  <p className="text-xs text-slate-400">
                    নতুন ইউজার সাইন আপ করতে পারবে কিনা
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSystem({
                      ...system,
                      registration_enabled: !system.registration_enabled,
                    })
                  }
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                  style={{
                    backgroundColor: system.registration_enabled
                      ? "#14B8A6"
                      : "#cbd5e1",
                  }}
                >
                  <span
                    className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    style={{
                      transform: system.registration_enabled
                        ? "translateX(22px)"
                        : "translateX(4px)",
                    }}
                  />
                </button>
              </div>

              {/* Max Projects */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  প্রতি ইউজার সর্বোচ্চ প্রজেক্ট
                </label>
                <input
                  type="number"
                  value={system.max_projects_per_user}
                  onChange={(e) =>
                    setSystem({
                      ...system,
                      max_projects_per_user: Number(e.target.value),
                    })
                  }
                  className="w-full max-w-xs px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]/50"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
