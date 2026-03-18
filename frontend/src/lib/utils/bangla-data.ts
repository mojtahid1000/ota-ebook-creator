/**
 * Bangla UI strings and niche data for the frontend.
 * Sub-niche data is loaded from backend knowledge base,
 * but main niches are defined here for Step 1.
 */

export const MAIN_NICHES = [
  {
    id: "health",
    bn: "স্বাস্থ্য",
    en: "Health",
    icon: "Heart",
    color: "bg-emerald-500",
    description: "শারীরিক ও মানসিক স্বাস্থ্য বিষয়ক ইবুক",
    subCount: 40,
  },
  {
    id: "wealth",
    bn: "সম্পদ",
    en: "Wealth",
    icon: "TrendingUp",
    color: "bg-amber-500",
    description: "আয়, বিনিয়োগ ও আর্থিক স্বাধীনতা বিষয়ক ইবুক",
    subCount: 35,
  },
  {
    id: "relationship",
    bn: "সম্পর্ক",
    en: "Relationship",
    icon: "Users",
    color: "bg-rose-500",
    description: "পারিবারিক, দাম্পত্য ও ব্যক্তিগত সম্পর্ক বিষয়ক ইবুক",
    subCount: 30,
  },
] as const;

export type MainNicheId = (typeof MAIN_NICHES)[number]["id"];

export const NICHE_TO_LABEL: Record<string, string> = {
  health: "Health (স্বাস্থ্য)",
  wealth: "Wealth (সম্পদ)",
  relationship: "Relationship (সম্পর্ক)",
};

export const AGE_RANGES = [
  { id: "18-24", bn: "১৮-২৪ বছর (তরুণ)" },
  { id: "25-34", bn: "২৫-৩৪ বছর (যুবক)" },
  { id: "35-44", bn: "৩৫-৪৪ বছর (মধ্যবয়স্ক)" },
  { id: "45-54", bn: "৪৫-৫৪ বছর (প্রবীণ মধ্যবয়স্ক)" },
  { id: "55-64", bn: "৫৫-৬৪ বছর (প্রবীণ)" },
  { id: "65+", bn: "৬৫+ বছর (বয়স্ক)" },
];

export const GENDERS = [
  { id: "male", bn: "পুরুষ" },
  { id: "female", bn: "মহিলা" },
  { id: "all", bn: "সবার জন্য" },
];

export const INCOME_LEVELS = [
  { id: "low", bn: "নিম্ন আয় (মাসে ১৫,০০০ টাকার কম)" },
  { id: "lower-middle", bn: "নিম্ন-মধ্যবিত্ত (১৫,০০০-৩০,০০০ টাকা)" },
  { id: "middle", bn: "মধ্যবিত্ত (৩০,০০০-৬০,০০০ টাকা)" },
  { id: "upper-middle", bn: "উচ্চ-মধ্যবিত্ত (৬০,০০০-১,৫০,০০০ টাকা)" },
  { id: "high", bn: "উচ্চ আয় (১,৫০,০০০+ টাকা)" },
];

export const EDUCATION_LEVELS = [
  { id: "below-ssc", bn: "এসএসসির নিচে" },
  { id: "ssc", bn: "এসএসসি/সমমান" },
  { id: "hsc", bn: "এইচএসসি/সমমান" },
  { id: "bachelors", bn: "স্নাতক (Bachelor's)" },
  { id: "masters", bn: "স্নাতকোত্তর (Master's)" },
  { id: "phd", bn: "পিএইচডি/ডক্টরেট" },
];
