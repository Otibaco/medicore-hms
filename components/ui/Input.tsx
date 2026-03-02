"use client";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, suffix, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-slate-500 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "form-input w-full rounded-xl py-2.5 text-sm transition-all duration-200",
              icon ? "pl-9 pr-4" : "px-4",
              suffix ? "pr-12" : "",
              error ? "border-red-500/60 focus:border-red-500 focus:shadow-red-500/10" : "",
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 text-slate-500 text-sm">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-slate-300">{label}</label>
      )}
      <select
        className={cn(
          "form-input w-full rounded-xl px-4 py-2.5 text-sm appearance-none cursor-pointer",
          error ? "border-red-500/60" : "",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface text-slate-200">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className, ...props }: TextAreaProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-slate-300">{label}</label>
      )}
      <textarea
        className={cn(
          "form-input w-full rounded-xl px-4 py-2.5 text-sm resize-none",
          error ? "border-red-500/60" : "",
          className
        )}
        rows={3}
        {...props}
      />
    </div>
  );
}
