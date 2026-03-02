"use client";
import { FileText, TrendingUp, Users, BedDouble } from "lucide-react";
import { Card, StatCard } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatNaira } from "@/lib/utils";

interface Props {
  summary: { totalPatients: number; totalStaff: number; totalRevenue: number };
  monthlyAdmissions: { month: string; count: number }[];
  monthlyRevenue: { month: string; revenueKobo: number }[];
}

export function AdminReportsClient({ summary, monthlyAdmissions, monthlyRevenue }: Props) {
  const maxAdm = Math.max(...monthlyAdmissions.map(m => m.count), 1);
  const maxRev = Math.max(...monthlyRevenue.map(m => m.revenueKobo), 1);

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Hospital performance metrics and financial overview" icon={<FileText className="w-5 h-5 text-teal-400" />} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard title="Total Patients" value={summary.totalPatients.toString()} changeType="up" icon={<BedDouble className="w-5 h-5" />} glow="teal" />
        <StatCard title="Active Staff" value={summary.totalStaff.toString()} changeType="neutral" icon={<Users className="w-5 h-5" />} glow="gold" />
        <StatCard title="Total Revenue" value={formatNaira(summary.totalRevenue)} changeType="up" icon={<TrendingUp className="w-5 h-5" />} glow="rose" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Admissions */}
        <Card>
          <h3 className="font-semibold text-slate-200 mb-6 flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-violet-400" /> Monthly Admissions
          </h3>
          {monthlyAdmissions.length === 0 ? (
            <div className="text-center py-12 text-slate-600">No admission data yet.</div>
          ) : (
            <div className="flex items-end gap-3 h-40">
              {monthlyAdmissions.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">{m.count}</span>
                  <div className="w-full rounded-t-lg bg-violet-500/80 transition-all duration-700" style={{ height: `${(m.count / maxAdm) * 100}%`, minHeight: "4px" }} />
                  <span className="text-[10px] text-slate-600">{m.month}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Monthly Revenue */}
        <Card>
          <h3 className="font-semibold text-slate-200 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-400" /> Monthly Revenue (₦)
          </h3>
          {monthlyRevenue.length === 0 ? (
            <div className="text-center py-12 text-slate-600">No revenue data yet.</div>
          ) : (
            <div className="flex items-end gap-3 h-40">
              {monthlyRevenue.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">{formatNaira(m.revenueKobo).replace("₦", "")}</span>
                  <div className="w-full rounded-t-lg bg-teal-500/80 transition-all duration-700" style={{ height: `${(m.revenueKobo / maxRev) * 100}%`, minHeight: "4px" }} />
                  <span className="text-[10px] text-slate-600">{m.month}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
