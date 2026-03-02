"use client";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Search, UserCheck, FlaskConical,
  Stethoscope, Users, BedDouble, Activity, ChevronDown
} from "lucide-react";
import { Card, StatCard } from "@/components/ui/Card";
import { Input, Select, TextArea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { admitPatient } from "@/actions/admissions";
import { getPatientById } from "@/actions/patients";
import { LAB_TESTS, WARDS, formatDate, calculateAge } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Doctor { _id: string; firstName: string; lastName: string; specialty?: string }
interface Patient { _id: string; patientId: string; firstName: string; lastName: string; gender: string; dob?: string; phone: string; status: string }
interface Admission { _id: string; admissionId: string; ward: string; ailments: string; admittedAt: string; patient: Patient; admittingDoctor: Doctor }

interface Props {
  greeting: string; today: string; firstName: string; nurseId: string;
  stats: { currentAdmissions: number; pendingLabs: number; activePatients: number };
  currentAdmissions: Admission[];
  doctors: Doctor[];
}

export function NurseDashboardClient({ greeting, today, firstName, stats, currentAdmissions, doctors }: Props) {
  const [patientIdInput, setPatientIdInput] = useState("");
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [showTests, setShowTests] = useState(false);
  const [submitting, startSubmit] = useTransition();
  const router = useRouter();

  const doctorOptions = [
    { value: "", label: "Select admitting doctor" },
    ...doctors.map((d) => ({ value: d._id, label: `Dr. ${d.firstName} ${d.lastName}${d.specialty ? ` · ${d.specialty}` : ""}` })),
  ];

  const wardOptions = [
    { value: "", label: "Select ward" },
    ...WARDS.map((w) => ({ value: w, label: w })),
  ];

  const fetchPatient = async () => {
    if (!patientIdInput.trim()) {
      toast.error("Enter Patient ID");
      return;
    }
    setSearching(true);
    setFoundPatient(null);
    const result = await getPatientById(patientIdInput.trim().toUpperCase());
    if (result.success && result.data) {
      setFoundPatient(result.data as unknown as Patient);
      toast.success("Patient found", { description: `${result.data.firstName} ${result.data.lastName}` });
    } else {
      toast.error("Patient not found", { description: result.message });
    }
    setSearching(false);
  };

  const toggleTest = (test: string) => {
    setSelectedTests((p) => p.includes(test) ? p.filter((t) => t !== test) : [...p, test]);
  };

  const handleAdmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!foundPatient) return;
    const formData = new FormData(e.currentTarget);
    formData.set("patientId", foundPatient.patientId);
    selectedTests.forEach((t) => formData.append("labTests", t));

    startSubmit(async () => {
      const result = await admitPatient(formData);
      if (result.success) {
        toast.success("Patient admitted!", { description: result.message, duration: 4000 });
        setFoundPatient(null);
        setPatientIdInput("");
        setSelectedTests([]);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        toast.error("Admission failed", { description: result.message });
      }
    });
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-slate-500 text-sm mb-1">{greeting}, {firstName}!</p>
        <h1 className="font-serif text-3xl font-bold text-slate-100">Nurse Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">{today} · Admissions & Care Coordination</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard title="Active Admissions" value={stats.currentAdmissions.toString()} change="Currently admitted" changeType="neutral" icon={<BedDouble className="w-5 h-5" />} glow="teal" />
        <StatCard title="Pending Lab Tests" value={stats.pendingLabs.toString()} change={stats.pendingLabs > 0 ? "Awaiting processing" : "All clear"} changeType={stats.pendingLabs > 0 ? "down" : "neutral"} icon={<FlaskConical className="w-5 h-5" />} glow="gold" />
        <StatCard title="Active Patients" value={stats.activePatients.toString()} change="In system" changeType="neutral" icon={<Users className="w-5 h-5" />} glow="purple" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Admission Form */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-200">Patient Admission</h2>
              <p className="text-xs text-slate-500">Search patient by ID and process admission</p>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <Input placeholder="Enter Patient ID (e.g. AB123)" value={patientIdInput}
              onChange={(e) => setPatientIdInput(e.target.value.toUpperCase())}
              icon={<Search className="w-4 h-4" />} className="font-mono uppercase"
              onKeyDown={(e) => e.key === "Enter" && fetchPatient()} />
            <Button onClick={fetchPatient} loading={searching} className="flex-shrink-0">Fetch</Button>
          </div>

          <AnimatePresence>
            {foundPatient && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="p-4 bg-teal-500/5 border border-teal-500/20 rounded-xl mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">{foundPatient.firstName} {foundPatient.lastName}</p>
                        <p className="text-xs font-mono text-teal-400">{foundPatient.patientId}</p>
                      </div>
                    </div>
                    <StatusBadge status={foundPatient.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {foundPatient.dob && <div><span className="text-slate-600">Age</span> <span className="text-slate-300 ml-2">{calculateAge(foundPatient.dob)}</span></div>}
                    <div><span className="text-slate-600">Gender</span> <span className="text-slate-300 ml-2 capitalize">{foundPatient.gender}</span></div>
                    <div><span className="text-slate-600">Phone</span> <span className="text-slate-300 ml-2">{foundPatient.phone}</span></div>
                    <div><span className="text-slate-600">Status</span> <span className="text-slate-300 ml-2 capitalize">{foundPatient.status}</span></div>
                  </div>
                </div>

                <form onSubmit={handleAdmit} className="space-y-4">
                  <TextArea label="Ailments / Presenting Complaints *" name="ailments" placeholder="Describe symptoms..." rows={3} required />
                  <Select label="Admitting Doctor *" name="admittingDoctorId" options={doctorOptions} required />
                  <Select label="Ward *" name="ward" options={wardOptions} required />
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
                    <AnimatePresence>
                      {showTests && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                          className="mt-1 glass-card border border-border rounded-xl p-2 max-h-48 overflow-y-auto space-y-1 z-10">
                          {LAB_TESTS.map((test) => (
                            <label key={test} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-3 cursor-pointer transition-colors">
                              <input type="checkbox" checked={selectedTests.includes(test)} onChange={() => toggleTest(test)} className="w-4 h-4 rounded border-border accent-teal-500" />
                              <span className="text-sm text-slate-300">{test}</span>
                            </label>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {selectedTests.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedTests.map((t) => <Badge key={t} variant="teal">{t}</Badge>)}
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

        {/* Current Patients */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/15 flex items-center justify-center">
                <Users className="w-4 h-4 text-teal-400" />
              </div>
              <h3 className="font-semibold text-slate-200">Currently Admitted</h3>
            </div>
            <Badge variant="teal" dot>{currentAdmissions.length} Admitted</Badge>
          </div>

          {currentAdmissions.length === 0 ? (
            <div className="text-center py-12">
              <BedDouble className="w-12 h-12 mx-auto text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">No patients currently admitted</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {currentAdmissions.map((adm, i) => (
                <motion.div key={adm._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="p-4 rounded-xl bg-surface-2 border border-border hover:border-teal-500/20 transition-all cursor-pointer"
                  onClick={() => { setPatientIdInput(adm.patient.patientId); toast.info("Patient ID loaded", { description: "Click Fetch to load." }); }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-surface-3 flex items-center justify-center text-xs font-bold text-teal-400 border border-border">
                        {adm.patient.firstName[0]}{adm.patient.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{adm.patient.firstName} {adm.patient.lastName}</p>
                        <p className="text-xs text-slate-600">{adm.ward} · Dr. {adm.admittingDoctor?.lastName ?? "—"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[11px] text-teal-400 mb-1">{adm.patient.patientId}</p>
                      <StatusBadge status={adm.patient.status} />
                    </div>
                  </div>
                  {adm.ailments && <p className="mt-2 text-xs text-slate-500 truncate">{adm.ailments}</p>}
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
