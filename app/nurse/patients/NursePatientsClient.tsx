"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, ChevronRight, Phone, MapPin, Heart } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { formatDate, calculateAge } from "@/lib/utils";

interface Patient {
  _id: string; patientId: string; firstName: string; lastName: string; gender: string;
  dob?: string; phone: string; address: string; state: string; status: string;
  paymentType: string; bloodGroup?: string; allergies?: string[]; createdAt: string;
  emergencyContact?: { name: string; phone: string; relationship: string };
}

const statusOpts = [{ value: "all", label: "All Status" }, ...["active","admitted","discharged","deceased"].map(s => ({ value: s, label: s.charAt(0).toUpperCase()+s.slice(1) }))];

export function NursePatientsClient({ patients }: { patients: Patient[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Patient | null>(null);

  const filtered = patients.filter(p => {
    const matchSearch = `${p.firstName} ${p.lastName} ${p.patientId} ${p.phone}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <PageHeader title="Patients" subtitle={`${patients.length} total patients`} icon={<Users className="w-5 h-5 text-teal-400" />} />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <div className="space-y-3 mb-4">
              <Input placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} />
              <Select options={statusOpts} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <p className="text-slate-600 text-sm text-center py-6">No patients found</p>
              ) : filtered.map((p, i) => (
                <motion.button key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  onClick={() => setSelected(p)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${selected?._id === p._id ? "bg-teal-500/10 border-teal-500/40" : "bg-surface-2 border-border hover:border-teal-500/20"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-surface-3 border border-[#1e3252] flex items-center justify-center text-[10px] font-bold text-slate-400">{p.firstName[0]}{p.lastName[0]}</div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{p.firstName} {p.lastName}</p>
                        <p className="text-[10px] font-mono text-teal-400">{p.patientId}</p>
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                </motion.button>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!selected ? (
              <Card className="flex items-center justify-center py-24 text-center">
                <div>
                  <Users className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                  <p className="text-slate-400">Select a patient to view details</p>
                </div>
              </Card>
            ) : (
              <motion.div key={selected._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <Card>
                  <div className="flex items-start justify-between mb-5 pb-5 border-b border-[#1e3252]">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center text-lg font-bold text-teal-300">
                        {selected.firstName[0]}{selected.lastName[0]}
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-bold text-slate-100">{selected.firstName} {selected.lastName}</h3>
                        <p className="font-mono text-sm text-teal-400">{selected.patientId}</p>
                        {selected.dob && <p className="text-xs text-slate-500 mt-1">Age {calculateAge(selected.dob)} · {selected.gender}</p>}
                      </div>
                    </div>
                    <StatusBadge status={selected.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Phone</p><p className="text-slate-200 flex items-center gap-1"><Phone className="w-3 h-3" /> {selected.phone}</p></div>
                    <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Payment</p><Badge variant="blue">{selected.paymentType.toUpperCase()}</Badge></div>
                    <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Address</p><p className="text-slate-200 text-xs">{selected.address}, {selected.state}</p></div>
                    <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Registered</p><p className="text-slate-200 text-xs">{formatDate(selected.createdAt)}</p></div>
                    {selected.bloodGroup && <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Blood Group</p><Badge variant="rose">{selected.bloodGroup}</Badge></div>}
                    {selected.allergies && selected.allergies.length > 0 && (
                      <div className="col-span-2"><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Allergies</p><p className="text-slate-300 text-xs">{selected.allergies.join(", ")}</p></div>
                    )}
                    {selected.emergencyContact && (
                      <div className="col-span-2 pt-3 border-t border-[#1e3252]">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Emergency Contact</p>
                        <p className="text-slate-200 text-sm">{selected.emergencyContact.name} <span className="text-slate-500">({selected.emergencyContact.relationship})</span></p>
                        <p className="text-slate-400 text-xs mt-1">{selected.emergencyContact.phone}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
