"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { BedDouble, Search } from "lucide-react";
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

const statusOpts = [{ value: "all", label: "All" }, { value: "admitted", label: "Admitted" }, { value: "discharged", label: "Discharged" }];

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
    <div>
      <PageHeader title="Admissions Overview" subtitle="Track all patient admissions and discharges" icon={<BedDouble className="w-5 h-5 text-teal-400" />} />
      <div className="grid grid-cols-3 gap-5 mb-6">
        <StatCard title="Currently Admitted" value={stats.admitted.toString()} changeType="neutral" icon={<BedDouble className="w-5 h-5" />} glow="teal" />
        <StatCard title="Total Discharged" value={stats.discharged.toString()} changeType="up" icon={<BedDouble className="w-5 h-5" />} glow="gold" />
        <StatCard title="All Admissions" value={stats.total.toString()} changeType="neutral" icon={<BedDouble className="w-5 h-5" />} glow="purple" />
      </div>
      <Card>
        <div className="flex gap-3 mb-5">
          <Input placeholder="Search by name, ID, ward..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} />
          <Select options={statusOpts} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e3252]">
                {["Patient", "Admission ID", "Ward", "Doctor", "Admitted By", "Admitted", "Status"].map(h => (
                  <th key={h} className="text-left text-xs text-slate-600 pb-3 pr-4 font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((a, i) => (
                <motion.tr key={a._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-surface-2/50 transition-colors">
                  <td className="py-3 pr-4">
                    {a.patient ? (
                      <div>
                        <p className="text-slate-200 font-medium">{a.patient.firstName} {a.patient.lastName}</p>
                        <p className="text-xs font-mono text-teal-400">{a.patient.patientId}</p>
                      </div>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-violet-400">{a.admissionId}</td>
                  <td className="py-3 pr-4 text-slate-400 text-xs">{a.ward}</td>
                  <td className="py-3 pr-4 text-slate-400 text-xs">{a.admittingDoctor ? `Dr. ${a.admittingDoctor.lastName}` : "—"}</td>
                  <td className="py-3 pr-4 text-slate-400 text-xs">{a.admittedBy ? `${a.admittedBy.firstName}` : "—"}</td>
                  <td className="py-3 pr-4 text-slate-500 text-xs">{formatTimeAgo(a.admittedAt)}</td>
                  <td className="py-3 pr-4"><StatusBadge status={a.status} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <BedDouble className="w-12 h-12 mx-auto text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">No admissions found</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
