"use client";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Activity, Heart, Thermometer, Droplets, Weight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, TextArea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { recordVitals } from "@/actions/clinical";
import { formatTimeAgo } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Vitals {
  _id: string; bloodPressureSystolic: number; bloodPressureDiastolic: number;
  pulse: number; temperature: number; spo2: number; weight?: number; notes?: string; createdAt: string;
  patient?: { firstName: string; lastName: string; patientId: string };
  recordedBy?: { firstName: string; lastName: string };
}

interface Patient { _id: string; patientId: string; firstName: string; lastName: string }

export function DoctorVitalsClient({ recentVitals, patients, userId }: { recentVitals: Vitals[]; patients: Patient[]; userId: string }) {
  const [submitting, startSubmit] = useTransition();
  const router = useRouter();

  const patientOpts = [{ value: "", label: "Select patient" }, ...patients.map(p => ({ value: p._id, label: `${p.firstName} ${p.lastName} (${p.patientId})` }))];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startSubmit(async () => {
      const result = await recordVitals(formData);
      if (result.success) {
        toast.success("Vitals recorded!", { description: result.message });
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        toast.error("Failed", { description: result.message });
      }
    });
  };

  return (
    <div>
      <PageHeader title="Vitals Recorder" subtitle="Record and track patient vital signs" icon={<Activity className="w-5 h-5 text-teal-400" />} />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h3 className="font-semibold text-slate-200 mb-5">Record Vitals</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Patient *" name="patientId" options={patientOpts} required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Systolic BP *" name="bloodPressureSystolic" type="number" placeholder="120" min={60} max={300} required icon={<Heart className="w-3.5 h-3.5" />} />
              <Input label="Diastolic BP *" name="bloodPressureDiastolic" type="number" placeholder="80" min={30} max={200} required icon={<Heart className="w-3.5 h-3.5" />} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Pulse (bpm) *" name="pulse" type="number" placeholder="72" min={20} max={300} required icon={<Activity className="w-3.5 h-3.5" />} />
              <Input label="Temp (°C) *" name="temperature" type="number" placeholder="36.6" step="0.1" min={30} max={45} required icon={<Thermometer className="w-3.5 h-3.5" />} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="SpO2 (%) *" name="spo2" type="number" placeholder="98" min={50} max={100} required icon={<Droplets className="w-3.5 h-3.5" />} />
              <Input label="Weight (kg)" name="weight" type="number" placeholder="70" step="0.1" icon={<Weight className="w-3.5 h-3.5" />} />
            </div>
            <TextArea label="Notes" name="notes" placeholder="Any observations..." rows={2} />
            <Button type="submit" loading={submitting} className="w-full" icon={<Activity className="w-4 h-4" />}>Save Vitals</Button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <h3 className="font-semibold text-slate-200 mb-5">Recent Vitals Log</h3>
            {recentVitals.length === 0 ? (
              <div className="text-center py-10">
                <Activity className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                <p className="text-slate-500 text-sm">No vitals recorded yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e3252]">
                      {["Patient", "BP", "Pulse", "Temp", "SpO2", "By", "Time"].map(h => (
                        <th key={h} className="text-left text-xs text-slate-600 pb-3 pr-4 font-semibold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e3252]/50">
                    {recentVitals.map((v, i) => (
                      <motion.tr key={v._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-surface-2/50">
                        <td className="py-3 pr-4">
                          {v.patient ? (
                            <div>
                              <p className="text-slate-200 text-xs font-medium">{v.patient.firstName} {v.patient.lastName}</p>
                              <p className="text-[10px] font-mono text-teal-400">{v.patient.patientId}</p>
                            </div>
                          ) : "—"}
                        </td>
                        <td className="py-3 pr-4 text-slate-300 text-xs">{v.bloodPressureSystolic}/{v.bloodPressureDiastolic}</td>
                        <td className="py-3 pr-4 text-slate-300 text-xs">{v.pulse}</td>
                        <td className="py-3 pr-4 text-slate-300 text-xs">{v.temperature}°C</td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs font-semibold ${v.spo2 < 90 ? "text-red-400" : v.spo2 < 95 ? "text-amber-400" : "text-teal-400"}`}>{v.spo2}%</span>
                        </td>
                        <td className="py-3 pr-4 text-slate-500 text-xs">{v.recordedBy ? `${v.recordedBy.firstName}` : "—"}</td>
                        <td className="py-3 pr-4 text-slate-500 text-xs">{formatTimeAgo(v.createdAt)}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
