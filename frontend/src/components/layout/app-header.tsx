"use client";

import { useSupabase } from "@/providers/supabase-provider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, User, LogOut } from "lucide-react";

export function AppHeader() {
  const { user, supabase } = useSupabase();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/dashboard")}
          >
            <div className="w-8 h-8 bg-ota-orange rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-ota-blue leading-tight">
                OTA Ebook Creator
              </h1>
              <p className="text-[10px] text-slate-400 leading-tight -mt-0.5">
                Online Tech Academy
              </p>
            </div>
          </div>

          {/* Nav */}
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 hidden sm:inline">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/profile")}
              >
                <User className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
