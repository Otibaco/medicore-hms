"use client";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Activity, Stethoscope, ChevronRight, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, TextArea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { recordVitals, createDiagnosis } from "@/actions/clinical";
import { calculateAge, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Patient { _id: string; patientId: string; firstName: string; lastName: string; gender: string; dob?: string; phone: string; address: string; status: string; paymentType: string; bloodGroup?: string }

const tabs = [{ id: "vitals", label: "Vitals", icon: <Activity className="w-4 h-4" /> }, { id: "diagnosis", label: "Diagnosis", icon: <Stethoscope className="w-4 h-4" /> }] as const;

export function DoctorPatientsClient({ patients, doctorId }: { patients: Patient[]; doctorId: string }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<"vitals"|"diagnosis">("vitals");
  const [saving, startSave] = useTransition();
  const router = useRouter();

  const filtered = patients.filter(p => `${p.firstName} ${p.lastName} ${p.patientId} ${p.phone}`.toLowerCase().includes(search.toLowerCase()));

  const handleSaveVitals = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) return;
    const fd = new FormData(e.currentTarget);
    fd.set("patientId", selected._id);
    startSave(async () => {
      const r = await recordVitals(fd);
      if (r.success) { toast.success("Vitals saved!"); (e.target as HTMLFormElement).reset(); router.refresh(); }
      else toast.error(r.message);
    });
  };

  const handleSaveDiagnosis = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) return;
    const fd = new FormData(e.currentTarget);
    fd.set("patientId", selected._id);
    startSave(async () => {
      const r = await createDiagnosis(fd);
      if (r.success) { toast.success("Diagnosis saved!"); (e.target as HTMLFormElement).reset(); router.refresh(); }
      else toast.error(r.message);
    });
  };

  return (
    <div>
      <PageHeader title="My Patients" subtitle={`${patients.length} active patients`} icon={<Users className="w-5 h-5 text-teal-400" />} />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <Input placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} className="mb-4" />
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-6">No patients found</p>
            ) : filtered.map((p, i) => {
              const isSel = selected?._id === p._id;
              return (
                <motion.button key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  onClick={() => { setSelected(p); setActiveTab("vitals"); }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${isSel ? "bg-teal-500/10 border-teal-500/40" : "bg-surface-2 border-border hover:border-teal-500/20"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold border ${isSel ? "bg-teal-500/20 border-teal-500/30 text-teal-300" : "bg-surface-3 border-border text-slate-400"}`}>{p.firstName[0]}{p.lastName[0]}</div>
                      <div>
                        <p className={`text-sm font-medium ${isSel ? "text-teal-300" : "text-slate-200"}`}>{p.firstName} {p.lastName}</p>
                        <p className="text-[10px] font-mono text-teal-400">{p.patientId}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={p.status} />
                      {isSel && <ChevronRight className="w-3 h-3 text-teal-400" />}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </Card>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!selected ? (
              <Card className="flex items-center justify-center py-24 text-center">
                <div><Stethoscope className="w-12 h-12 mx-auto text-slate-700 mb-3" /><p className="text-slate-400">Select a patient to record vitals or diagnoses</p></div>
              </Card>
            ) : (
              <motion.div key={selected._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <Card glow="teal">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center text-xl font-bold text-teal-300">{selected.firstName[0]}{selected.lastName[0]}</div>
                      <div>
                        <h3 className="font-serif text-xl font-bold text-slate-100">{selected.firstName} {selected.lastName}</h3>
                        <p className="font-mono text-sm text-teal-400">{selected.patientId}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                          {selected.dob && <span>Age {calculateAge(selected.dob)}</span>}
                          <span>·</span><span className="capitalize">{selected.gender}</span>
                          {selected.bloodGroup && <><span>·</span><Badge variant="rose">{selected.bloodGroup}</Badge></>}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={selected.status} />
                  </div>
                </Card>
                <Card>
                  <div className="flex gap-1 p-1 bg-surface-3 rounded-xl mb-5">
                    {tabs.map(t => (
                      <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === t.id ? "bg-surface text-teal-300 border border-border" : "text-slate-500 hover:text-slate-300"}`}>{t.icon}{t.label}</button>
                    ))}
                  </div>
                  {activeTab === "vitals" && (
                    <form onSubmit={handleSaveVitals} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Input label="Systolic BP *" name="bloodPressureSystolic" type="number" placeholder="120" min={60} max={300} required />
                        <Input label="Diastolic BP *" name="bloodPressureDiastolic" type="number" placeholder="80" min={30} max={200} required />
                        <Input label="Pulse (bpm) *" name="pulse" type="number" placeholder="72" min={20} max={300} required />
                        <Input label="Temp (°C) *" name="temperature" type="number" placeholder="36.6" step="0.1" min={30} max={45} required />
                        <Input label="SpO2 (%) *" name="spo2" type="number" placeholder="98" min={50} max={100} required />
                        <Input label="Weight (kg)" name="weight" type="number" placeholder="70" />
                      </div>
                      <TextArea label="Notes" name="notes" rows={2} />
                      <Button type="submit" loading={saving} icon={<Activity className="w-4 h-4" />}>Save Vitals</Button>
                    </form>
                  )}
                  {activeTab === "diagnosis" && (
                    <form onSubmit={handleSaveDiagnosis} className="space-y-4">
                      <Input label="Diagnosis *" name="diagnosis" placeholder="e.g. Typhoid Fever" required icon={<Stethoscope className="w-3.5 h-3.5" />} />
                      <Input label="ICD-10 Code" name="diagnosisCode" placeholder="e.g. A01.0" />
                      <TextArea label="Clinical Notes *" name="clinicalNotes" placeholder="Findings, observations, treatment plan..." rows={4} required />
                      <TextArea label="Test Results" name="testResults" rows={3} />
                      <TextArea label="Prescription" name="prescription" rows={2} />
                      <Input label="Follow-up Date" name="followUpDate" type="date" />
                      <Button type="submit" loading={saving} icon={<Stethoscope className="w-4 h-4" />}>Save Diagnosis</Button>
                    </form>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
