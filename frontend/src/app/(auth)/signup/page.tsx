"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { author_name: authorName },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-ota-teal rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-ota-blue mb-2">
            অ্যাকাউন্ট তৈরি হয়েছে!
          </h2>
          <p className="text-slate-500 mb-4">
            আপনার ইমেইল চেক করুন এবং ভেরিফিকেশন লিংকে ক্লিক করুন।
          </p>
          <Button onClick={() => router.push("/login")}>
            লগইন পেজে যান
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-ota-orange rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ota-blue">
            নতুন অ্যাকাউন্ট তৈরি করুন
          </h1>
          <p className="text-slate-500 mt-1">
            ফ্রিতে আপনার প্রথম ইবুক তৈরি করুন
          </p>
        </div>

        <form
          onSubmit={handleSignup}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
        >
          <div className="space-y-4">
            <Input
              label="লেখকের নাম (Author Name)"
              placeholder="আপনার নাম"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
            />
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
              placeholder="কমপক্ষে ৬ অক্ষর"
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
            সাইন আপ করুন
          </Button>

          <p className="text-center text-sm text-slate-500 mt-4">
            ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
            <Link
              href="/login"
              className="text-ota-orange font-semibold hover:underline"
            >
              লগইন করুন
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
