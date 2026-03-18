"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/providers/supabase-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown, Zap, Star } from "lucide-react";



type Plan = {
  id: string;
  name: string;
  bn: string;
  price_bdt: number;
  ebooks_per_month: number;
  features: string[];
};

const PLAN_ICONS: Record<string, typeof Star> = {
  free: Star,
  pro: Zap,
  unlimited: Crown,
};

const PLAN_COLORS: Record<string, string> = {
  free: "border-slate-200",
  pro: "border-ota-orange ring-2 ring-ota-orange/20",
  unlimited: "border-ota-blue ring-2 ring-ota-blue/20",
};

export default function SubscriptionPage() {
  const { supabase, user } = useSupabase();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
    loadCurrentPlan();
  }, []);

  async function loadPlans() {
    try {
      const res = await fetch(`/api/payments/plans`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch {}
  }

  async function loadCurrentPlan() {
    if (!user) return;
    const { data } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single();
    if (data) setCurrentPlan(data.plan);
  }

  async function handleUpgrade(planId: string) {
    if (!user || planId === "free") return;
    setLoading(planId);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("author_name")
        .eq("id", user.id)
        .single();

      const res = await fetch(`/api/payments/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planId,
          user_id: user.id,
          user_email: user.email || "",
          user_name: profile?.author_name || user.email || "",
        }),
      });

      const data = await res.json();
      if (data.success && data.session_url) {
        window.open(data.session_url, "_blank");
      } else if (data.mock) {
        alert("SSLCommerz সেটআপ করা হয়নি। টেস্ট মোডে চলছে।");
      }
    } catch {}
    setLoading(null);
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-ota-blue">সাবস্ক্রিপশন প্ল্যান</h1>
        <p className="text-slate-500 mt-1">আপনার প্রয়োজন অনুযায়ী প্ল্যান বেছে নিন</p>
        <p className="text-sm text-ota-teal mt-2">
          বর্তমান প্ল্যান: <span className="font-bold">{currentPlan.toUpperCase()}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const Icon = PLAN_ICONS[plan.id] || Star;
          const isCurrent = currentPlan === plan.id;
          const borderClass = PLAN_COLORS[plan.id] || "";

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border-2 p-6 ${borderClass} ${
                plan.id === "pro" ? "relative" : ""
              }`}
            >
              {plan.id === "pro" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ota-orange text-white text-xs font-bold px-3 py-1 rounded-full">
                  জনপ্রিয়
                </div>
              )}

              <div className="text-center mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                  plan.id === "pro" ? "bg-ota-orange/10" : plan.id === "unlimited" ? "bg-ota-blue/10" : "bg-slate-100"
                }`}>
                  <Icon className={`w-6 h-6 ${
                    plan.id === "pro" ? "text-ota-orange" : plan.id === "unlimited" ? "text-ota-blue" : "text-slate-400"
                  }`} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{plan.bn}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-slate-800">
                    {plan.price_bdt === 0 ? "ফ্রি" : `৳${plan.price_bdt}`}
                  </span>
                  {plan.price_bdt > 0 && <span className="text-slate-400 text-sm">/মাস</span>}
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <p key={i} className="text-sm text-slate-600 flex items-center gap-2">
                    <Check className="w-4 h-4 text-ota-teal shrink-0" />
                    {feature}
                  </p>
                ))}
              </div>

              {isCurrent ? (
                <Button variant="ghost" className="w-full" disabled>
                  বর্তমান প্ল্যান
                </Button>
              ) : plan.price_bdt === 0 ? (
                <Button variant="ghost" className="w-full" disabled>
                  ফ্রি
                </Button>
              ) : (
                <Button
                  variant={plan.id === "pro" ? "primary" : "secondary"}
                  className="w-full"
                  onClick={() => handleUpgrade(plan.id)}
                  loading={loading === plan.id}
                >
                  আপগ্রেড করুন
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center mt-8 text-sm text-slate-400">
        <p>পেমেন্ট: SSLCommerz / bKash / নগদ / ভিসা / মাস্টারকার্ড</p>
        <p className="mt-1">সব পেমেন্ট নিরাপদ ও এনক্রিপ্টেড</p>
      </div>
    </div>
  );
}
