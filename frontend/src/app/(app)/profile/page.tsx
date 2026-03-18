"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/providers/supabase-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/providers/toast-provider";
import { Save, User } from "lucide-react";

export default function ProfilePage() {
  const { supabase, user } = useSupabase();
  const { showToast } = useToast();
  const [authorName, setAuthorName] = useState("");
  const [pressName, setPressName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [aiProvider, setAiProvider] = useState("claude");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  async function loadProfile() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user!.id)
      .single();

    if (data) {
      setAuthorName(data.author_name || "");
      setPressName(data.press_name || "");
      setWebsiteUrl(data.website_url || "");
      setAiProvider(data.preferred_ai_provider || "claude");
    }
    setLoading(false);
  }

  async function saveProfile() {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        author_name: authorName,
        press_name: pressName,
        website_url: websiteUrl,
        preferred_ai_provider: aiProvider,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      showToast("সেভ করতে সমস্যা হয়েছে", "error");
    } else {
      showToast("প্রোফাইল সেভ হয়েছে", "success");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-12 bg-slate-100 rounded" />
          <div className="h-12 bg-slate-100 rounded" />
          <div className="h-12 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-ota-orange/10 rounded-xl flex items-center justify-center">
          <User className="w-6 h-6 text-ota-orange" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ota-blue">প্রোফাইল সেটিংস</h1>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Author Info */}
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold text-slate-700 mb-4">লেখক তথ্য</h2>
          <div className="space-y-4">
            <Input
              label="লেখকের নাম (Author Name)"
              placeholder="আপনার নাম"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />
            <Input
              label="প্রকাশনার নাম (Press/Publisher Name)"
              placeholder="যেমন: OTA Press"
              value={pressName}
              onChange={(e) => setPressName(e.target.value)}
            />
            <Input
              label="ওয়েবসাইট URL"
              placeholder="https://yourwebsite.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>
        </div>

        {/* AI Provider */}
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold text-slate-700 mb-4">
            এআই প্রোভাইডার (AI Provider)
          </h2>
          <p className="text-sm text-slate-500 mb-3">
            ইবুক লেখার জন্য কোন এআই ব্যবহার করতে চান?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Card
              selected={aiProvider === "claude"}
              onClick={() => setAiProvider("claude")}
              className="py-3 px-4 text-center"
            >
              <p className="font-semibold text-slate-800">Claude (Anthropic)</p>
              <p className="text-xs text-slate-400 mt-1">সুপারিশকৃত</p>
            </Card>
            <Card
              selected={aiProvider === "openai"}
              onClick={() => setAiProvider("openai")}
              className="py-3 px-4 text-center"
            >
              <p className="font-semibold text-slate-800">GPT-4o (OpenAI)</p>
              <p className="text-xs text-slate-400 mt-1">বিকল্প</p>
            </Card>
          </div>
        </div>

        <Button onClick={saveProfile} loading={saving} size="lg" className="w-full">
          <Save className="w-5 h-5" /> প্রোফাইল সেভ করুন
        </Button>
      </div>
    </div>
  );
}
