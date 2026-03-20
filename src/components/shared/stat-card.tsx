// src/components/shared/stat-card.tsx
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Props = {
  title:    string;
  value:    string | number;
  sub?:     string;
  icon:     LucideIcon;
  trend?:   { value: number; label: string };
  color?:   "blue" | "green" | "yellow" | "red" | "purple" | "orange";
  className?: string;
};

const COLORS = {
  blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   ring: "bg-blue-100" },
  green:  { bg: "bg-green-50",  icon: "text-green-600",  ring: "bg-green-100" },
  yellow: { bg: "bg-yellow-50", icon: "text-yellow-600", ring: "bg-yellow-100" },
  red:    { bg: "bg-red-50",    icon: "text-red-600",    ring: "bg-red-100" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", ring: "bg-purple-100" },
  orange: { bg: "bg-orange-50", icon: "text-orange-600", ring: "bg-orange-100" },
};

export function StatCard({ title, value, sub, icon: Icon, trend, color = "blue", className }: Props) {
  const c = COLORS[color];
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={cn("rounded-xl p-2.5", c.ring)}>
          <Icon className={cn("h-5 w-5", c.icon)} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={cn("font-semibold", trend.value >= 0 ? "text-green-600" : "text-red-600")}>
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </span>
          <span className="text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
