"use client";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope, Activity, FlaskConical, FileText,
  ChevronRight, Users, CheckCircle, Heart, Thermometer,
  Droplets, Weight, AlertTriangle, Plus
} from "lucide-react";
import { Card, StatCard } from "@/components/ui/Card";
import { Input, TextArea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { recordVitals, createDiagnosis } from "@/actions/clinical";
import { formatDate, calculateAge } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Patient {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob?: string;
  status: string;
}

interface AdmittedPatient {
  _id: string;
  admissionId: string;
  ailments: string;
  ward: string;
  admittedAt: string;
  patient: Patient;
}

interface Props {
  greeting: string;
  today: string;
  firstName: string;
  doctorId: string;
  stats: { myPatients: number; pendingLabs: number; todayDiagnoses: number };
  myAdmissions: AdmittedPatient[];
  recentPatients: Patient[];
}

const tabs = [
  { id: "vitals", label: "Vitals", icon: <Activity className="w-4 h-4" /> },
  { id: "diagnosis", label: "Diagnosis", icon: <Stethoscope className="w-4 h-4" /> },
] as const;

export function DoctorDashboardClient({ greeting, today, firstName, doctorId, stats, myAdmissions, recentPatients }: Props) {
  const [selectedAdmission, setSelectedAdmission] = useState<AdmittedPatient | null>(null);
  const [activeTab, setActiveTab] = useState<"vitals" | "diagnosis">("vitals");
  const [saving, startSave] = useTransition();
  const router = useRouter();

  const handleSaveVitals = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    const formData = new FormData(e.currentTarget);
    formData.set("patientId", selectedAdmission.patient._id);

    startSave(async () => {
      const result = await recordVitals(formData);
      if (result.success) {
        toast.success("Vitals recorded", { description: `Saved for ${selectedAdmission.patient.firstName} ${selectedAdmission.patient.lastName}.` });
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        toast.error("Failed to save vitals", { description: result.message });
      }
    });
  };

  const handleSaveDiagnosis = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    const formData = new FormData(e.currentTarget);
    formData.set("patientId", selectedAdmission.patient._id);

    startSave(async () => {
      const result = await createDiagnosis(formData);
      if (result.success) {
        toast.success("Diagnosis saved", { description: "Patient medical record updated." });
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        toast.error("Failed to save diagnosis", { description: result.message });
      }
    });
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-slate-500 text-sm mb-1">{greeting}, Dr. {firstName}!</p>
        <h1 className="font-serif text-3xl font-bold text-slate-100">Doctor Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">{today} · Clinical Operations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard title="My Admitted Patients" value={stats.myPatients.toString()} change="Currently under your care" changeType="neutral" icon={<Users className="w-5 h-5" />} glow="teal" />
        <StatCard title="Pending Lab Reviews" value={stats.pendingLabs.toString()} change="Awaiting your review" changeType={stats.pendingLabs > 0 ? "down" : "neutral"} icon={<FlaskConical className="w-5 h-5" />} glow="gold" />
        <StatCard title="Diagnoses Today" value={stats.todayDiagnoses.toString()} change="Recorded today" changeType="up" icon={<CheckCircle className="w-5 h-5" />} glow="purple" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <Card className="lg:col-span-1">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/15 flex items-center justify-center">
                <Users className="w-4 h-4 text-teal-400" />
              </div>
              <h3 className="font-semibold text-slate-200">My Patients</h3>
            </div>
            <Badge variant="teal">{myAdmissions.length}</Badge>
          </div>

          {myAdmissions.length === 0 ? (
            <div className="text-center py-12">
              <BedEmpty />
              <p className="text-slate-500 text-sm mt-3">No patients currently assigned</p>
              <p className="text-slate-600 text-xs mt-1">Patients will appear here once admitted to your care</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myAdmissions.map((admission, i) => {
                const patient = admission.patient;
                const isSelected = selectedAdmission?._id === admission._id;
                return (
                  <motion.button key={admission._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    onClick={() => { setSelectedAdmission(admission); setActiveTab("vitals"); }}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                      isSelected ? "bg-teal-500/10 border-teal-500/40" : "bg-surface-2 border-border hover:border-teal-500/20"
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold border ${
                          isSelected ? "bg-teal-500/20 border-teal-500/30 text-teal-300" : "bg-surface-3 border-border text-slate-400"
                        }`}>
                          {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isSelected ? "text-teal-300" : "text-slate-200"}`}>
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-[11px] text-slate-600">{admission.ward}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={patient.status} />
                        {isSelected && <ChevronRight className="w-3 h-3 text-teal-400" />}
                      </div>
                    </div>
                    {admission.ailments && (
                      <p className="mt-1.5 text-xs text-slate-500 truncate">{admission.ailments}</p>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!selectedAdmission ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="flex flex-col items-center justify-center text-center py-24">
                  <div className="w-16 h-16 rounded-2xl bg-surface-3 border border-border flex items-center justify-center mb-4">
                    <Stethoscope className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-400 font-medium mb-2">No patient selected</p>
                  <p className="text-slate-600 text-sm">Select a patient from the list to record vitals or diagnoses.</p>
                </Card>
              </motion.div>
            ) : (
              <motion.div key={selectedAdmission._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {/* Patient header */}
                <Card glow="teal">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center text-lg font-bold text-teal-300">
                        {selectedAdmission.patient.firstName[0]}{selectedAdmission.patient.lastName[0]}
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-bold text-slate-100">
                          {selectedAdmission.patient.firstName} {selectedAdmission.patient.lastName}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="font-mono text-sm text-teal-400">{selectedAdmission.patient.patientId}</span>
                          <span className="text-slate-600">·</span>
                          {selectedAdmission.patient.dob && (
                            <>
                              <span className="text-sm text-slate-500">Age {calculateAge(selectedAdmission.patient.dob)}</span>
                              <span className="text-slate-600">·</span>
                            </>
                          )}
                          <span className="text-sm text-slate-500 capitalize">{selectedAdmission.patient.gender}</span>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={selectedAdmission.patient.status} />
                  </div>
                  {selectedAdmission.ailments && (
                    <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Presenting Ailments</span>
                      </div>
                      <p className="text-sm text-slate-300">{selectedAdmission.ailments}</p>
                    </div>
                  )}
                </Card>

                <Card>
                  <div className="flex gap-1 p-1 bg-surface-3 rounded-xl mb-6">
                    {tabs.map((tab) => (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          activeTab === tab.id ? "bg-surface text-teal-300 border border-border shadow-sm" : "text-slate-500 hover:text-slate-300"
                        }`}>
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {activeTab === "vitals" && (
                      <motion.div key="vitals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <form onSubmit={handleSaveVitals} className="space-y-4">
                          <h4 className="text-sm font-semibold text-slate-300 mb-4">Record Current Vitals</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <Input label="Systolic BP (mmHg) *" name="bloodPressureSystolic" type="number" placeholder="120" min={60} max={300} required icon={<Heart className="w-3.5 h-3.5" />} />
                            <Input label="Diastolic BP (mmHg) *" name="bloodPressureDiastolic" type="number" placeholder="80" min={30} max={200} required icon={<Heart className="w-3.5 h-3.5" />} />
                            <Input label="Pulse Rate (bpm) *" name="pulse" type="number" placeholder="72" min={20} max={300} required icon={<Activity className="w-3.5 h-3.5" />} />
                            <Input label="Temperature (°C) *" name="temperature" type="number" placeholder="36.6" step="0.1" min={30} max={45} required icon={<Thermometer className="w-3.5 h-3.5" />} />
                            <Input label="SpO2 (%) *" name="spo2" type="number" placeholder="98" min={50} max={100} required icon={<Droplets className="w-3.5 h-3.5" />} />
                            <Input label="Weight (kg)" name="weight" type="number" placeholder="70" step="0.1" icon={<Weight className="w-3.5 h-3.5" />} />
                          </div>
                          <TextArea label="Notes" name="notes" placeholder="Additional observations..." rows={2} />
                          <Button type="submit" loading={saving} icon={<Activity className="w-4 h-4" />}>Save Vitals</Button>
                        </form>
                      </motion.div>
                    )}

                    {activeTab === "diagnosis" && (
                      <motion.div key="diagnosis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <form onSubmit={handleSaveDiagnosis} className="space-y-4">
                          <h4 className="text-sm font-semibold text-slate-300 mb-4">Record Clinical Diagnosis</h4>
                          <Input label="Diagnosis *" name="diagnosis" placeholder="e.g. Malaria Falciparum" icon={<Stethoscope className="w-3.5 h-3.5" />} required />
                          <Input label="Diagnosis Code (ICD-10)" name="diagnosisCode" placeholder="e.g. B50.0" />
                          <TextArea label="Clinical Notes *" name="clinicalNotes" placeholder="Observations, findings, treatment plan..." rows={4} required />
                          <TextArea label="Test Results" name="testResults" placeholder="Lab or imaging results..." rows={3} />
                          <TextArea label="Prescription" name="prescription" placeholder="Medications and dosage..." rows={2} />
                          <Input label="Follow-up Date" name="followUpDate" type="date" />
                          <Button type="submit" loading={saving} icon={<FileText className="w-4 h-4" />}>Save Diagnosis</Button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function BedEmpty() {
  return (
    <div className="w-16 h-16 rounded-2xl bg-surface-3 border border-border flex items-center justify-center mx-auto">
      <Stethoscope className="w-8 h-8 text-slate-600" />
    </div>
  );
}
