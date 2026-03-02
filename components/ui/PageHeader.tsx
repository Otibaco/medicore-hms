"use client";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";

interface PageHeaderProps {
  greeting?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ greeting, title, subtitle, actions }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start justify-between mb-7 gap-4 flex-wrap"
    >
      <div>
        {greeting && <p className="text-slate-600 text-xs mb-0.5">{greeting}</p>}
        <h1 className="font-serif text-2xl font-bold text-slate-100 leading-tight">{title}</h1>
        {subtitle && <p className="text-slate-600 text-xs mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </motion.div>
  );
}
