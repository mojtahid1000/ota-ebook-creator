"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("ইমেইল অথবা পাসওয়ার্ড ভুল হয়েছে");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-ota-orange rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ota-blue">
            OTA Ebook Creator
          </h1>
          <p className="text-slate-500 mt-1">
            আপনার অ্যাকাউন্টে লগইন করুন
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
        >
          <div className="space-y-4">
            <Input
              label="ইমেইল"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="পাসওয়ার্ড"
              type="password"
              placeholder="আপনার পাসওয়ার্ড"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-500 bg-red-50 p-2 rounded">
              {error}
            </p>
          )}

          <Button
            type="submit"
            loading={loading}
            className="w-full mt-6"
            size="lg"
          >
            লগইন করুন
          </Button>

          <p className="text-center text-sm text-slate-500 mt-4">
            অ্যাকাউন্ট নেই?{" "}
            <Link
              href="/signup"
              className="text-ota-orange font-semibold hover:underline"
            >
              সাইন আপ করুন
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
