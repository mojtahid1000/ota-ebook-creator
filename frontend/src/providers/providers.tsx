"use client";

import { SupabaseProvider } from "@/providers/supabase-provider";
import { ToastProvider } from "@/providers/toast-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <ToastProvider>{children}</ToastProvider>
    </SupabaseProvider>
  );
}
