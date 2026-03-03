"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { BedDouble, Search, Filter } from "lucide-react";
import { Card, StatCard } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { formatDate, formatTimeAgo, calculateAge } from "@/lib/utils";

interface Admission {
  _id: string; admissionId: string; ward: string; ailments: string; status: string;
  admittedAt: string; dischargedAt?: string;
  patient?: { firstName: string; lastName: string; patientId: string; gender: string; dob?: string };
  admittingDoctor?: { firstName: string; lastName: string; specialty?: string };
  admittedBy?: { firstName: string; lastName: string };
}

const statusOpts = [
  { value: "all", label: "All Status" }, 
  { value: "admitted", label: "Admitted" }, 
  { value: "discharged", label: "Discharged" }
];

export function AdminAdmissionsClient({ stats, admissions }: { stats: { total: number; admitted: number; discharged: number }; admissions: Admission[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = admissions.filter(a => {
    const name = a.patient ? `${a.patient.firstName} ${a.patient.lastName} ${a.patient.patientId}` : "";
    const matchSearch = `${name} ${a.admissionId} ${a.ward}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Admissions Overview" 
        subtitle="Track all patient admissions and discharges" 
        icon={<BedDouble className="w-5 h-5 text-teal-400" />} 
      />

      {/* Stats Grid: Responsive Column Logic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-6">
        <StatCard title="Currently Admitted" value={stats.admitted.toString()} changeType="neutral" icon={<BedDouble className="w-5 h-5 text-teal-400" />} glow="teal" />
        <StatCard title="Total Discharged" value={stats.discharged.toString()} changeType="up" icon={<BedDouble className="w-5 h-5 text-amber-400" />} glow="gold" />
        <StatCard title="All Admissions" value={stats.total.toString()} changeType="neutral" icon={<BedDouble className="w-5 h-5 text-purple-400" />} glow="purple" />
      </div>

      <Card className="p-0 sm:p-0 overflow-hidden">
        {/* Responsive Filters Area */}
        <div className="p-4 sm:p-5 border-b border-[#1e3252]/50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Input 
              placeholder="Search by name, ID, ward..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              icon={<Search className="w-4 h-4 text-slate-500" />}
              className="w-full bg-surface-2/50 border-[#1e3252] h-11 text-sm focus:ring-1 focus:ring-teal-500/40 transition-all"
            />
          </div>
          <div className="w-full sm:w-48 flex-shrink-0">
            <Select 
              options={statusOpts} 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface-2/50 border-[#1e3252] h-11 text-sm w-full"
            />
          </div>
        </div>

        {/* Professional Table: Perfect Text Alignment */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-2/20">
                <th className="px-5 py-4 text-[11px] text-slate-500 font-bold uppercase tracking-widest border-b border-[#1e3252]">Patient Details</th>
                <th className="px-5 py-4 text-[11px] text-slate-500 font-bold uppercase tracking-widest border-b border-[#1e3252]">ID & Ward</th>
                <th className="px-5 py-4 text-[11px] text-slate-500 font-bold uppercase tracking-widest border-b border-[#1e3252]">Medical Personnel</th>
                <th className="px-5 py-4 text-[11px] text-slate-500 font-bold uppercase tracking-widest border-b border-[#1e3252]">Timeline</th>
                <th className="px-5 py-4 text-[11px] text-slate-500 font-bold uppercase tracking-widest border-b border-[#1e3252] text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3252]/40">
              {filtered.map((a, i) => (
                <motion.tr 
                  key={a._id} 
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.01 }} 
                  className="hover:bg-surface-2/50 transition-colors group"
                >
                  <td className="px-5 py-4">
                    {a.patient ? (
                      <div className="flex flex-col">
                        <span className="text-slate-200 font-bold text-sm leading-none mb-1 group-hover:text-teal-400 transition-colors">
                          {a.patient.firstName} {a.patient.lastName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {a.patient.patientId}
                        </span>
                      </div>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[11px] text-violet-400 bg-violet-400/5 px-2 py-0.5 rounded border border-violet-400/10 w-fit">
                        {a.admissionId}
                      </span>
                      <span className="text-slate-400 text-xs font-medium">{a.ward} Ward</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-slate-300 text-xs font-semibold">
                        {a.admittingDoctor ? `Dr. ${a.admittingDoctor.lastName}` : "—"}
                      </p>
                      <p className="text-[10px] text-slate-500 italic font-medium">
                        Admitted by: {a.admittedBy ? `${a.admittedBy.firstName}` : "System"}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-slate-400 text-xs font-medium bg-surface-3 px-2 py-1 rounded">
                      {formatTimeAgo(a.admittedAt)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center">
                      <StatusBadge status={a.status} />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-surface-2/10">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                <BedDouble className="w-8 h-8 text-slate-600 opacity-30" />
              </div>
              <h4 className="text-slate-300 font-bold text-sm">No Admissions Found</h4>
              <p className="text-slate-500 text-xs mt-1">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}