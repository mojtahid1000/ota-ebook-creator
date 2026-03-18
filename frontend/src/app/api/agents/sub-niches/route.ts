import { NextRequest, NextResponse } from "next/server";

// Static sub-niche data (from backend knowledge base)
const NICHES: Record<string, Array<{ id: string; bn: string; en: string; demand: string }>> = {
  health: [
    { id: "weight-loss", bn: "ওজন কমানো", en: "Weight Loss", demand: "High" },
    { id: "belly-fat", bn: "পেটের চর্বি কমানো", en: "Belly Fat Reduction", demand: "High" },
    { id: "diabetes", bn: "ডায়াবেটিস নিয়ন্ত্রণ", en: "Diabetes Management", demand: "High" },
    { id: "blood-pressure", bn: "রক্তচাপ নিয়ন্ত্রণ", en: "Blood Pressure Control", demand: "High" },
    { id: "mental-health", bn: "মানসিক স্বাস্থ্য", en: "Mental Health", demand: "High" },
    { id: "anxiety", bn: "উদ্বেগ ও দুশ্চিন্তা", en: "Anxiety Management", demand: "High" },
    { id: "sleep", bn: "ঘুমের সমস্যা", en: "Sleep Disorders", demand: "High" },
    { id: "nutrition", bn: "পুষ্টি ও খাদ্যাভ্যাস", en: "Nutrition & Diet", demand: "Medium" },
    { id: "fitness", bn: "ফিটনেস ও ব্যায়াম", en: "Fitness & Exercise", demand: "Medium" },
    { id: "back-pain", bn: "পিঠের ব্যথা", en: "Back Pain", demand: "High" },
    { id: "skin-care", bn: "ত্বকের যত্ন", en: "Skin Care", demand: "High" },
    { id: "hair-loss", bn: "চুল পড়া সমস্যা", en: "Hair Loss", demand: "High" },
    { id: "stress", bn: "স্ট্রেস ম্যানেজমেন্ট", en: "Stress Management", demand: "High" },
    { id: "gastric", bn: "গ্যাস্ট্রিক সমস্যা", en: "Gastric Problems", demand: "High" },
    { id: "heart-health", bn: "হৃদরোগ প্রতিরোধ", en: "Heart Health", demand: "Medium" },
    { id: "sexual-health", bn: "যৌন স্বাস্থ্য", en: "Sexual Health", demand: "High" },
    { id: "meditation", bn: "ধ্যান ও মেডিটেশন", en: "Meditation", demand: "Medium" },
    { id: "yoga", bn: "যোগব্যায়াম", en: "Yoga", demand: "Medium" },
    { id: "immunity", bn: "রোগ প্রতিরোধ ক্ষমতা", en: "Immunity Building", demand: "Medium" },
    { id: "herbal", bn: "ভেষজ চিকিৎসা", en: "Herbal Medicine", demand: "Medium" },
  ],
  wealth: [
    { id: "freelancing", bn: "ফ্রিল্যান্সিং", en: "Freelancing", demand: "High" },
    { id: "ecommerce", bn: "ই-কমার্স ব্যবসা", en: "E-commerce Business", demand: "High" },
    { id: "stock-market", bn: "শেয়ার বাজার", en: "Stock Market", demand: "High" },
    { id: "passive-income", bn: "প্যাসিভ ইনকাম", en: "Passive Income", demand: "High" },
    { id: "online-business", bn: "অনলাইন ব্যবসা", en: "Online Business", demand: "High" },
    { id: "digital-marketing", bn: "ডিজিটাল মার্কেটিং", en: "Digital Marketing", demand: "High" },
    { id: "youtube", bn: "ইউটিউব ইনকাম", en: "YouTube Income", demand: "High" },
    { id: "financial-freedom", bn: "আর্থিক স্বাধীনতা", en: "Financial Freedom", demand: "High" },
    { id: "entrepreneurship", bn: "উদ্যোক্তা হওয়া", en: "Entrepreneurship", demand: "High" },
    { id: "savings", bn: "সঞ্চয় ও বিনিয়োগ", en: "Savings & Investment", demand: "High" },
    { id: "ai-income", bn: "এআই দিয়ে আয়", en: "AI-Powered Income", demand: "High" },
    { id: "content-creation", bn: "কন্টেন্ট ক্রিয়েশন", en: "Content Creation", demand: "High" },
    { id: "d2c", bn: "D2C ব্যবসা", en: "Direct-to-Consumer", demand: "High" },
    { id: "side-hustle", bn: "সাইড বিজনেস", en: "Side Business", demand: "High" },
    { id: "social-media", bn: "সোশ্যাল মিডিয়া ইনকাম", en: "Social Media Income", demand: "High" },
  ],
  relationship: [
    { id: "marriage", bn: "সুখী বিবাহিত জীবন", en: "Happy Marriage", demand: "High" },
    { id: "communication", bn: "দাম্পত্য যোগাযোগ", en: "Couple Communication", demand: "High" },
    { id: "parenting", bn: "সন্তান লালনপালন", en: "Parenting", demand: "High" },
    { id: "self-love", bn: "আত্মভালোবাসা", en: "Self-Love", demand: "High" },
    { id: "self-confidence", bn: "আত্মবিশ্বাস বাড়ানো", en: "Building Self-Confidence", demand: "High" },
    { id: "toxic-relationship", bn: "বিষাক্ত সম্পর্ক থেকে মুক্তি", en: "Toxic Relationship Recovery", demand: "High" },
    { id: "breakup", bn: "ব্রেকআপ থেকে সামলানো", en: "Breakup Recovery", demand: "High" },
    { id: "in-laws", bn: "শ্বশুরবাড়ির সম্পর্ক", en: "In-Law Relations", demand: "High" },
    { id: "anger-management", bn: "রাগ নিয়ন্ত্রণ", en: "Anger Management", demand: "Medium" },
    { id: "emotional-intelligence", bn: "আবেগীয় বুদ্ধিমত্তা", en: "Emotional Intelligence", demand: "Medium" },
    { id: "family", bn: "পারিবারিক সম্পর্ক", en: "Family Relationships", demand: "Medium" },
    { id: "boundaries", bn: "সীমানা নির্ধারণ", en: "Setting Boundaries", demand: "Medium" },
    { id: "leadership", bn: "নেতৃত্বের দক্ষতা", en: "Leadership Skills", demand: "Medium" },
  ],
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mainNiche = (searchParams.get("main_niche") || "").toLowerCase();

  // Match niche
  let key = "health";
  if (mainNiche.includes("wealth") || mainNiche.includes("সম্পদ")) key = "wealth";
  if (mainNiche.includes("relation") || mainNiche.includes("সম্পর্ক")) key = "relationship";

  return NextResponse.json({
    main_niche: mainNiche,
    sub_niches: NICHES[key] || [],
  });
}
