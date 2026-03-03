"use client";
import { cn } from "@/lib/utils";

type BadgeVariant = "teal" | "gold" | "red" | "purple" | "blue" | "gray" | "green"|"rose";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  teal: "bg-teal-500/15 text-teal-300 border border-teal-500/30",
  gold: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  red: "bg-red-500/15 text-red-300 border border-red-500/30",
  purple: "bg-violet-500/15 text-violet-300 border border-violet-500/30",
  blue: "bg-blue-500/15 text-blue-300 border border-blue-500/30",
  gray: "bg-slate-500/15 text-slate-400 border border-slate-500/30",
  green: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  rose: "bg-rose-500/15 text-rose-400 border border-rose-500/20"
};

const dotColors: Record<BadgeVariant, string> = {
  teal: "bg-teal-400",
  gold: "bg-amber-400",
  red: "bg-red-400",
  purple: "bg-violet-400",
  blue: "bg-blue-400",
  gray: "bg-slate-400",
  green: "bg-emerald-400",
  rose: "bg-rose-400"
};

export function Badge({ children, variant = "teal", dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase",
        variants[variant],
        className
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full pulse-dot", dotColors[variant])} />
      )}
      {children}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, BadgeVariant> = {
    Admin: "gold",
    Doctor: "teal",
    Nurse: "purple",
    Receptionist: "blue",
  };
  return <Badge variant={map[role] || "gray"}>{role}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    Active: "green",
    Inactive: "gray",
    Admitted: "teal",
    Discharged: "blue",
    Pending: "gold",
    Paid: "green",
    Overdue: "red",
  };
  return (
    <Badge variant={map[status] || "gray"} dot>
      {status}
    </Badge>
  );
}
