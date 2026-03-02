"use client";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Stethoscope, Plus, FileText, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, TextArea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { createDiagnosis } from "@/actions/clinical";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Diagnosis {
  _id: string; diagnosis: string; clinicalNotes: string; testResults?: string;
  prescription?: string; diagnosisCode?: string; createdAt: string;
  patient?: { firstName: string; lastName: string; patientId: string; gender: string };
}

interface Patient { _id: string; patientId: string; firstName: string; lastName: string }

export function DoctorDiagnosesClient({ diagnoses: initial, patients }: { diagnoses: Diagnosis[]; patients: Patient[] }) {
  const [diagnoses, setDiagnoses] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const router = useRouter();

  const patientOpts = [{ value: "", label: "Select patient" }, ...patients.map(p => ({ value: p._id, label: `${p.firstName} ${p.lastName} (${p.patientId})` }))];

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startSubmit(async () => {
      const result = await createDiagnosis(formData);
      if (result.success) {
        toast.success("Diagnosis saved!", { description: result.message });
        setShowForm(false);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        toast.error("Failed", { description: result.message });
      }
    });
  };

  return (
    <div>
      <PageHeader title="Diagnoses" subtitle="Record and manage patient diagnoses" icon={<Stethoscope className="w-5 h-5 text-teal-400" />}
        actions={<Button onClick={() => setShowForm(!showForm)} icon={<Plus className="w-4 h-4" />}>{showForm ? "Cancel" : "New Diagnosis"}</Button>} />

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <Card>
              <h3 className="font-semibold text-slate-200 mb-5">New Clinical Diagnosis</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <Select label="Patient *" name="patientId" options={patientOpts} required />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Diagnosis *" name="diagnosis" placeholder="e.g. Malaria Falciparum" required icon={<Stethoscope className="w-3.5 h-3.5" />} />
                  <Input label="ICD-10 Code" name="diagnosisCode" placeholder="e.g. B50.0" />
                </div>
                <TextArea label="Clinical Notes *" name="clinicalNotes" placeholder="Observations, findings, treatment plan..." rows={4} required />
                <TextArea label="Test Results" name="testResults" placeholder="Lab or imaging results..." rows={3} />
                <TextArea label="Prescription" name="prescription" placeholder="Medications and dosage..." rows={2} />
                <Input label="Follow-up Date" name="followUpDate" type="date" />
                <div className="flex gap-3">
                  <Button type="submit" loading={submitting} icon={<FileText className="w-4 h-4" />}>Save Diagnosis</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {diagnoses.length === 0 ? (
          <Card className="text-center py-16">
            <Stethoscope className="w-12 h-12 mx-auto text-slate-700 mb-3" />
            <p className="text-slate-400 font-medium">No diagnoses recorded yet</p>
            <p className="text-slate-600 text-sm mt-1">Click "New Diagnosis" to add your first entry</p>
          </Card>
        ) : diagnoses.map((dx, i) => (
          <motion.div key={dx._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card>
              <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === dx._id ? null : dx._id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    {dx.diagnosisCode && <Badge variant="teal">{dx.diagnosisCode}</Badge>}
                    <p className="font-semibold text-slate-200">{dx.diagnosis}</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {dx.patient ? `${dx.patient.firstName} ${dx.patient.lastName} · ${dx.patient.patientId}` : "—"} · {formatTimeAgo(dx.createdAt)}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expandedId === dx._id ? "rotate-180" : ""}`} />
              </div>
              <AnimatePresence>
                {expandedId === dx._id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Clinical Notes</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{dx.clinicalNotes}</p>
                      </div>
                      {dx.testResults && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Test Results</p>
                          <p className="text-sm text-slate-300 leading-relaxed">{dx.testResults}</p>
                        </div>
                      )}
                      {dx.prescription && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Prescription</p>
                          <p className="text-sm text-slate-300 leading-relaxed">{dx.prescription}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
