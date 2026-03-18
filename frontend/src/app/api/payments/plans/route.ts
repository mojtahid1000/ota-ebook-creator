import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    plans: [
      {
        id: "free", name: "Free", bn: "ফ্রি", price_bdt: 0,
        ebooks_per_month: 1, features: ["১ ইবুক/মাস", "শুধু PDF", "বেসিক ফন্ট"],
      },
      {
        id: "pro", name: "Pro", bn: "প্রো", price_bdt: 999,
        ebooks_per_month: 10, features: ["১০ ইবুক/মাস", "PDF + DOCX", "সব ফন্ট", "AI কভার", "প্রায়োরিটি"],
      },
      {
        id: "unlimited", name: "Unlimited", bn: "আনলিমিটেড", price_bdt: 2499,
        ebooks_per_month: -1, features: ["আনলিমিটেড ইবুক", "সব ফরম্যাট", "সব ফিচার", "কাস্টম ব্র্যান্ডিং", "VIP সাপোর্ট"],
      },
    ],
  });
}
