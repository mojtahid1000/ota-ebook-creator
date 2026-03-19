import { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: number;
  iconColor?: string;
  iconBg?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  iconColor = "text-[#F97316]",
  iconBg = "bg-[#F97316]/10",
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-start justify-between">
        <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon className={clsx("w-5 h-5", iconColor)} />
        </div>
        {trend !== undefined && (
          <span
            className={clsx(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              trend >= 0
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
            )}
          >
            {trend >= 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
