"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Shield } from "lucide-react";

export function AdminHeader() {
  const { supabase, user } = useSupabase();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="px-6">
        <div className="flex items-center justify-between h-14">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-[#1E3A5F]">
              OTA Admin Panel
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
                মেইন অ্যাপ
              </Button>
            </Link>
            {user && (
              <span className="text-sm text-slate-500 hidden sm:inline">
                {user.email}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
