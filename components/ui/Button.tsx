"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gold" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const variants = {
  primary: "bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/20 border border-teal-400/30",
  secondary: "bg-surface-2 hover:bg-surface-3 text-slate-200 border border-border",
  ghost: "hover:bg-surface-2 text-slate-300 hover:text-slate-100 border border-transparent hover:border-border",
  danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30",
  gold: "bg-amber-500 hover:bg-amber-400 text-navy-900 shadow-lg shadow-amber-500/20 border border-amber-400/30 font-semibold",
  outline: "bg-transparent hover:bg-teal-500/10 text-teal-400 border border-teal-500/40 hover:border-teal-500/70",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2.5",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconPosition = "left",
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer select-none",
        "active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        iconPosition === "left" && icon
      )}
      {children}
      {!loading && iconPosition === "right" && icon}
    </button>
  );
}
