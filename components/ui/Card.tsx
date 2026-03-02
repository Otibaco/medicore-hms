"use client";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "teal" | "gold" | "purple" | "rose" | "none";
  hover?: boolean;
}

export function Card({ children, className, glow = "none", hover = false }: CardProps) {
  const glowMap = {
    teal: "stat-glow-teal",
    gold: "stat-glow-gold",
    purple: "stat-glow-purple",
    rose: "stat-glow-rose",
    none: "",
  };

  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-6",
        glowMap[glow],
        hover && "transition-all duration-300 hover:translate-y-[-2px] hover:shadow-card-hover cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  glow?: "teal" | "gold" | "purple" | "rose";
  iconBg?: string;
}

export function StatCard({ title, value, change, changeType = "neutral", icon, glow = "teal", iconBg }: StatCardProps) {
  const changeColors = {
    up: "text-emerald-400",
    down: "text-red-400",
    neutral: "text-slate-500",
  };

  const iconBgDefault = {
    teal: "bg-teal-500/15 text-teal-400",
    gold: "bg-amber-500/15 text-amber-400",
    purple: "bg-violet-500/15 text-violet-400",
    rose: "bg-rose-500/15 text-rose-400",
  };

  return (
    <Card glow={glow} hover className="relative overflow-hidden">
      {/* Background decoration */}
      <div
        className={cn(
          "absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10 blur-2xl",
          glow === "teal" && "bg-teal-500",
          glow === "gold" && "bg-amber-500",
          glow === "purple" && "bg-violet-500",
          glow === "rose" && "bg-rose-500"
        )}
      />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-2">{title}</p>
          <p className="text-3xl font-bold text-slate-100 font-serif">{value}</p>
          {change && (
            <p className={cn("text-xs mt-1.5 font-medium", changeColors[changeType])}>
              {changeType === "up" ? "↑" : changeType === "down" ? "↓" : ""} {change}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", iconBg || iconBgDefault[glow])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
