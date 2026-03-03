"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Filter } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { formatDate, calculateAge } from "@/lib/utils";

interface Patient {
  _id: string; patientId: string; firstName: string; lastName: string;
  gender: string; dob: string; phone: string; state: string; status: string;
  paymentType: string; createdAt: string;
  registeredBy?: { firstName: string; lastName: string };
}

const statusOpts = [{ value: "all", label: "All Status" }, ...["active","admitted","discharged","deceased"].map(s => ({ value: s, label: s.charAt(0).toUpperCase()+s.slice(1) }))];

export function AdminPatientsClient({ patients }: { patients: Patient[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = patients.filter(p => {
    const matchSearch = `${p.firstName} ${p.lastName} ${p.patientId} ${p.phone}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <PageHeader title="Patient Records" subtitle={`${patients.length} total patients in the system`} icon={<Users className="w-5 h-5 text-teal-400" />} />
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <Input placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} />
          <Select options={statusOpts} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e3252]">
                {["Patient", "ID", "Age", "Gender", "Phone", "State", "Payment", "Registered", "Status"].map(h => (
                  <th key={h} className="text-left text-xs text-slate-600 pb-3 pr-4 font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3252]/50">
              {filtered.map((p, i) => (
                <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-surface-2/50 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-surface-3 border border-[#1e3252] flex items-center justify-center text-[10px] font-bold text-slate-400">{p.firstName[0]}{p.lastName[0]}</div>
                      <span className="text-slate-200 font-medium">{p.firstName} {p.lastName}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-mono text-[11px] text-teal-400">{p.patientId}</td>
                  <td className="py-3 pr-4 text-slate-400">{p.dob ? calculateAge(p.dob) : "—"}</td>
                  <td className="py-3 pr-4 text-slate-400 capitalize">{p.gender}</td>
                  <td className="py-3 pr-4 text-slate-400 text-xs">{p.phone}</td>
                  <td className="py-3 pr-4 text-slate-400 text-xs">{p.state}</td>
                  <td className="py-3 pr-4"><Badge variant="blue">{p.paymentType.toUpperCase()}</Badge></td>
                  <td className="py-3 pr-4 text-slate-500 text-xs">{formatDate(p.createdAt)}</td>
                  <td className="py-3 pr-4"><StatusBadge status={p.status} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">No patients found</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
