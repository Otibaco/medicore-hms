"use client";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BedDouble, Search, UserCheck, ChevronDown, LogOut,
  Filter, Clock, CheckCircle, Users, Plus
} from "lucide-react";
import { Card, StatCard } from "@/components/ui/Card";
import { Input, Select, TextArea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { admitPatient, dischargePatient } from "@/actions/admissions";
import { getPatientById } from "@/actions/patients";
import { LAB_TESTS, WARDS, formatDate, formatTimeAgo, calculateAge } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Doctor { _id: string; firstName: string; lastName: string; specialty?: string }
interface Patient { _id: string; patientId: string; firstName: string; lastName: string; gender: string; dob?: string; phone: string; status: string }
interface Admission {
  _id: string; admissionId: string; ward: string; ailments: string; status: string;
  admittedAt: string; dischargedAt?: string;
  patient?: Patient;
  admittingDoctor?: { firstName: string; lastName: string; specialty?: string };
  admittedBy?: { firstName: string; lastName: string; role: string };
}

interface Props {
  admissions: Admission[];
  doctors: Doctor[];
  stats: { admitted: number; discharged: number; total: number };
  nurseId: string;
}

const wardOpts = [{ value: "", label: "Select ward" }, ...WARDS.map(w => ({ value: w, label: w }))];

export function NurseAdmissionsClient({ admissions: initial, doctors, stats, nurseId }: Props) {
  const [admissions, setAdmissions] = useState(initial);
  const [activeTab, setActiveTab] = useState<"admit" | "list">("admit");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [patientIdInput, setPatientIdInput] = useState("");
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [showTests, setShowTests] = useState(false);
  const [submitting, startSubmit] = useTransition();
  const [discharging, startDischarge] = useTransition();
  const router = useRouter();

  const doctorOpts = [
    { value: "", label: "Select admitting doctor" },
    ...doctors.map(d => ({ value: d._id, label: `Dr. ${d.firstName} ${d.lastName}${d.specialty ? ` · ${d.specialty}` : ""}` })),
  ];

  const filtered = admissions.filter(a => {
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchSearch = !search || `${a.patient?.firstName ?? ""} ${a.patient?.lastName ?? ""} ${a.patient?.patientId ?? ""} ${a.admissionId}`
      .toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const fetchPatient = async () => {
    if (!patientIdInput.trim()) { toast.error("Enter Patient ID"); return; }
    setSearching(true); setFoundPatient(null);
    const result = await getPatientById(patientIdInput.trim().toUpperCase());
    if (result.success && result.data) {
      setFoundPatient(result.data as unknown as Patient);
      toast.success("Patient found", { description: `${result.data.firstName} ${result.data.lastName}` });
    } else {
      toast.error("Patient not found", { description: result.message });
    }
    setSearching(false);
  };

  const handleAdmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!foundPatient) return;
    const formData = new FormData(e.currentTarget);
    formData.set("patientId", foundPatient.patientId);
    selectedTests.forEach(t => formData.append("labTests", t));
    startSubmit(async () => {
      const result = await admitPatient(formData);
      if (result.success) {
        toast.success("Patient admitted!", { description: result.message });
        setFoundPatient(null); setPatientIdInput(""); setSelectedTests([]);
        (e.target as HTMLFormElement).reset();
        router.refresh();
        setActiveTab("list");
      } else {
        toast.error("Admission failed", { description: result.message });
      }
    });
  };

  const handleDischarge = (admissionId: string, patientName: string) => {
    const formData = new FormData();
    formData.set("admissionId", admissionId);
    startDischarge(async () => {
      const result = await dischargePatient(formData);
      if (result.success) {
        setAdmissions(p => p.map(a => a.admissionId === admissionId ? { ...a, status: "discharged", dischargedAt: new Date().toISOString() } : a));
        toast.success("Patient discharged", { description: patientName });
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div>
      <PageHeader title="Admissions" subtitle="Manage patient admissions and discharges" icon={<BedDouble className="w-5 h-5 text-violet-400" />} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard title="Currently Admitted" value={stats.admitted.toString()} icon={<BedDouble className="w-4 h-4" />} glow="teal" />
        <StatCard title="Discharged" value={stats.discharged.toString()} icon={<CheckCircle className="w-4 h-4" />} glow="purple" />
        <StatCard title="Total Records" value={stats.total.toString()} icon={<Users className="w-4 h-4" />} glow="gold" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface rounded-xl border border-[#1e3252] w-fit mb-6">
        {[{ id: "admit" as const, label: "New Admission", icon: <Plus className="w-4 h-4" /> },
          { id: "list" as const, label: "All Admissions", icon: <BedDouble className="w-4 h-4" /> }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-surface-2 text-slate-200 border border-border" : "text-slate-500 hover:text-slate-300"}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "admit" && (
          <motion.div key="admit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-200">Admit Patient</h2>
                  <p className="text-xs text-slate-500">Search by Patient ID to begin admission</p>
                </div>
              </div>

              <div className="flex gap-3 mb-4">
                <Input placeholder="Patient ID (e.g. AB123)" value={patientIdInput}
                  onChange={e => setPatientIdInput(e.target.value.toUpperCase())}
                  icon={<Search className="w-4 h-4" />}
                  onKeyDown={e => e.key === "Enter" && fetchPatient()} />
                <Button onClick={fetchPatient} loading={searching}>Fetch</Button>
              </div>

              <AnimatePresence>
                {foundPatient && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="p-4 bg-teal-500/5 border border-teal-500/20 rounded-xl mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <UserCheck className="w-5 h-5 text-teal-400" />
                        <div>
                          <p className="font-semibold text-slate-200">{foundPatient.firstName} {foundPatient.lastName}</p>
                          <p className="text-xs font-mono text-teal-400">{foundPatient.patientId}</p>
                        </div>
                        <StatusBadge status={foundPatient.status} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                        {foundPatient.dob && <div><span className="text-slate-600">Age</span> <span className="text-slate-300 ml-1">{calculateAge(foundPatient.dob)}</span></div>}
                        <div><span className="text-slate-600">Gender</span> <span className="text-slate-300 ml-1 capitalize">{foundPatient.gender}</span></div>
                        <div><span className="text-slate-600">Phone</span> <span className="text-slate-300 ml-1">{foundPatient.phone}</span></div>
                      </div>
                    </div>

                    <form onSubmit={handleAdmit} className="space-y-4">
                      <TextArea label="Ailments / Presenting Complaints *" name="ailments" placeholder="Describe symptoms and complaints..." rows={3} required />
                      <Select label="Admitting Doctor *" name="admittingDoctorId" options={doctorOpts} required />
                      <Select label="Ward *" name="ward" options={wardOpts} required />
                      <Input label="Bed Number" name="bedNumber" placeholder="e.g. B-14" />

                      <div>
                        <label className="text-sm font-medium text-slate-300 block mb-1.5">Request Lab Tests</label>
                        <button type="button" onClick={() => setShowTests(!showTests)}
                          className="form-input w-full px-4 py-2.5 rounded-xl text-sm flex items-center justify-between">
                          <span className={selectedTests.length ? "text-slate-200" : "text-slate-500"}>
                            {selectedTests.length ? `${selectedTests.length} test(s) selected` : "Select lab tests..."}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showTests ? "rotate-180" : ""}`} />
                        </button>
                        {showTests && (
                          <div className="mt-1 glass-card border border-[#1e3252] rounded-xl p-2 max-h-48 overflow-y-auto space-y-1">
                            {LAB_TESTS.map(test => (
                              <label key={test} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-3 cursor-pointer">
                                <input type="checkbox" checked={selectedTests.includes(test)} onChange={() => setSelectedTests(p => p.includes(test) ? p.filter(t => t !== test) : [...p, test])}
                                  className="w-4 h-4 rounded accent-teal-500" />
                                <span className="text-sm text-slate-300">{test}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        {selectedTests.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {selectedTests.map(t => <Badge key={t} variant="teal">{t}</Badge>)}
                          </div>
                        )}
                      </div>

                      <TextArea label="Nursing Notes" name="nursingNotes" placeholder="Additional observations..." rows={2} />
                      <Button type="submit" loading={submitting} className="w-full" icon={<BedDouble className="w-4 h-4" />}>Process Admission</Button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}

        {activeTab === "list" && (
          <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card>
              <div className="flex gap-3 mb-5">
                <Input placeholder="Search patient, admission ID..." value={search} onChange={e => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} />
                <Select options={[{ value: "all", label: "All Status" }, { value: "admitted", label: "Admitted" }, { value: "discharged", label: "Discharged" }]}
                  value={statusFilter} onChange={e => setStatusFilter(e.target.value)} />
              </div>

              <p className="text-xs text-slate-600 mb-4">{filtered.length} records</p>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                  <div className="text-center py-12">
                    <BedDouble className="w-10 h-10 mx-auto text-slate-700 mb-3" />
                    <p className="text-slate-500 text-sm">No admissions found</p>
                  </div>
                ) : filtered.map((adm, i) => (
                  <motion.div key={adm._id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="p-4 rounded-xl bg-surface-2 border border-[#1e3252] hover:border-violet-500/20 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-3 border border-[#1e3252] flex items-center justify-center text-xs font-bold text-violet-400">
                          {adm.patient?.firstName[0]}{adm.patient?.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{adm.patient?.firstName} {adm.patient?.lastName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-teal-400">{adm.patient?.patientId}</span>
                            <span className="text-slate-700">·</span>
                            <span className="text-xs text-slate-500">{adm.ward}</span>
                            <span className="text-slate-700">·</span>
                            <span className="text-xs text-slate-600">Dr. {adm.admittingDoctor?.lastName ?? "—"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={adm.status} />
                        {adm.status === "admitted" && (
                          <button
                            onClick={() => handleDischarge(adm.admissionId, `${adm.patient?.firstName} ${adm.patient?.lastName}`)}
                            disabled={discharging}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition-all disabled:opacity-50"
                          >
                            <LogOut className="w-3 h-3" /> Discharge
                          </button>
                        )}
                      </div>
                    </div>
                    {adm.ailments && <p className="mt-2 text-xs text-slate-500 truncate">{adm.ailments}</p>}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-600">
                      <span className="font-mono">{adm.admissionId}</span>
                      <span>·</span>
                      <span>Admitted {formatTimeAgo(adm.admittedAt)}</span>
                      {adm.dischargedAt && <><span>·</span><span>Discharged {formatTimeAgo(adm.dischargedAt)}</span></>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
