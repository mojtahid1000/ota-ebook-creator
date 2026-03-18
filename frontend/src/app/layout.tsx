import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/providers";

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-bangla",
});

export const metadata: Metadata = {
  title: "OTA Ebook Creator | ওটিএ ইবুক ক্রিয়েটর",
  description:
    "এআই দিয়ে প্রফেশনাল ইবুক তৈরি করুন - Online Tech Academy",
  keywords: "ebook, bangla, ai, ইবুক, বাংলা, এআই",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" dir="ltr" className={hindSiliguri.variable}>
      <body className={hindSiliguri.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
