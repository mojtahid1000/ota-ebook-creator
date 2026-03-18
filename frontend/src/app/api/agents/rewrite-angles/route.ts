import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    angles: [
      { id: "more_practical", bn: "আরো প্র্যাক্টিক্যাল" },
      { id: "more_emotional", bn: "আরো আবেগপূর্ণ" },
      { id: "more_data", bn: "আরো ডেটা-সমৃদ্ধ" },
      { id: "simpler", bn: "আরো সহজ ভাষায়" },
      { id: "more_detailed", bn: "আরো বিস্তারিত" },
      { id: "different_examples", bn: "ভিন্ন উদাহরণ দিয়ে" },
      { id: "shorter", bn: "সংক্ষিপ্ত করুন" },
    ],
  });
}
