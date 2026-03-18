import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    styles: [
      { id: "storytelling", bn: "গল্পের ধরনে", en: "Storytelling" },
      { id: "step_by_step", bn: "ধাপে ধাপে গাইড", en: "Step-by-Step Guide" },
      { id: "conversational", bn: "কথোপকথনের ধরনে", en: "Conversational" },
      { id: "academic", bn: "একাডেমিক", en: "Academic" },
      { id: "motivational", bn: "অনুপ্রেরণামূলক", en: "Motivational" },
      { id: "qa", bn: "প্রশ্ন-উত্তর", en: "Q&A Format" },
      { id: "case_study", bn: "কেস স্টাডি", en: "Case Study" },
    ],
  });
}
