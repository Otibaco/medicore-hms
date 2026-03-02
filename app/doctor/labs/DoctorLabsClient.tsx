"use client";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, Search, AlertTriangle, CheckCircle, Clock,
  Activity, Eye, EyeOff, FileText, Loader2
} from "lucide-react";
import { Card, StatCard } from "@/components/ui/Card";
import { Input, TextArea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { updateLabResult } from "@/actions/clinical";
import { formatTimeAgo, formatDateTime, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface LabRequest {
  _id: string; labId: string; testName: string; priority: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  results?: string; resultNotes?: string; createdAt: string; completedAt?: string;
  patient?: { firstName: string; lastName: string; patientId: string; gender: string; phone: string };
  requestedBy?: { firstName: string; lastName: string; role: string };
  completedBy?: { firstName: string; lastName: string };
}

interface Props {
  labRequests: LabRequest[];
  stats: { pending: number; inProgress: number; completed: number; reviewed: number };
  doctorId: string;
}

const priorityConfig = {
  stat: { label: "STAT", cls: "bg-red-500/20 text-red-300 border border-red-500/30" },
  urgent: { label: "Urgent", cls: "bg-amber-500/20 text-amber-300 border border-amber-500/30" },
  routine: { label: "Routine", cls: "bg-blue-500/20 text-blue-300 border border-blue-500/30" },
};

const statusOpts = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const statusUpdateOpts = [
  { value: "in_progress", label: "Mark In Progress" },
  { value: "completed", label: "Mark Completed" },
];

export function DoctorLabsClient({ labRequests: initial, stats, doctorId }: Props) {
  const [labRequests, setLabRequests] = useState(initial);
  const [selected, setSelected] = useState<LabRequest | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [saving, startSave] = useTransition();
  const router = useRouter();

  const filtered = labRequests.filter((lr) => {
    const matchSearch = `${lr.patient?.firstName ?? ""} ${lr.patient?.lastName ?? ""} ${lr.patient?.patientId ?? ""} ${lr.testName} ${lr.labId}`
      .toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || lr.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleUpdateResult = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) return;
    const formData = new FormData(e.currentTarget);
    formData.set("labRequestId", selected._id);

    startSave(async () => {
      const result = await updateLabResult(formData);
      if (result.success) {
        const updated = result.data!;
        setLabRequests((p) => p.map((lr) =>
          lr._id === selected._id ? { ...lr, ...updated as unknown as LabRequest } : lr
        ));
        setSelected((prev) => prev ? { ...prev, ...updated as unknown as LabRequest } : null);
        toast.success("Lab result updated", { description: result.message });
        router.refresh();
      } else {
        toast.error("Failed to update", { description: result.message });
      }
    });
  };

  return (
    <div>
      <PageHeader
        title="Lab Results"
        subtitle="Review and update laboratory test results"
        icon={<FlaskConical className="w-5 h-5 text-teal-400" />}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Pending" value={stats.pending.toString()} icon={<Clock className="w-4 h-4" />} glow="gold" />
        <StatCard title="In Progress" value={stats.inProgress.toString()} icon={<Loader2 className="w-4 h-4" />} glow="teal" />
        <StatCard title="Completed" value={stats.completed.toString()} icon={<CheckCircle className="w-4 h-4" />} glow="purple" />
        <StatCard title="With Results" value={stats.reviewed.toString()} icon={<FileText className="w-4 h-4" />} glow="rose" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Lab requests list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Search patient, test, ID..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} />
            <Select options={statusOpts} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
          </div>

          <p className="text-xs text-slate-600 px-1">{filtered.length} results</p>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <FlaskConical className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                <p className="text-slate-500 text-sm">No lab requests found</p>
              </div>
            ) : filtered.map((lr, i) => {
              const isSelected = selected?._id === lr._id;
              const priCfg = priorityConfig[lr.priority as keyof typeof priorityConfig] ?? priorityConfig.routine;
              return (
                <motion.button
                  key={lr._id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelected(lr)}
                  className={cn(
                    "w-full text-left p-3.5 rounded-xl border transition-all duration-200",
                    isSelected
                      ? "bg-teal-500/10 border-teal-500/40"
                      : "bg-surface-2 border-border hover:border-teal-500/20"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className={cn("text-sm font-medium", isSelected ? "text-teal-300" : "text-slate-200")}>{lr.testName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {lr.patient ? `${lr.patient.firstName} ${lr.patient.lastName}` : "Unknown"}
                        {" · "}
                        <span className="font-mono text-teal-400/70">{lr.patient?.patientId}</span>
                      </p>
                    </div>
                    <StatusBadge status={lr.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", priCfg.cls)}>{priCfg.label}</span>
                    <span className="text-[10px] text-slate-600">{formatTimeAgo(lr.createdAt)}</span>
                    <span className="font-mono text-[10px] text-slate-700">{lr.labId}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Detail / review panel */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-surface-3 border border-border flex items-center justify-center mb-4">
                    <FlaskConical className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-400 font-medium">No result selected</p>
                  <p className="text-slate-600 text-sm mt-1">Select a lab request from the list to review or update results.</p>
                </Card>
              </motion.div>
            ) : (
              <motion.div key={selected._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Patient header */}
                <Card>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-200 text-lg">{selected.testName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", priorityConfig[selected.priority as keyof typeof priorityConfig]?.cls ?? priorityConfig.routine.cls)}>
                          {selected.priority.toUpperCase()}
                        </span>
                        <span className="font-mono text-xs text-teal-400">{selected.labId}</span>
                      </div>
                    </div>
                    <StatusBadge status={selected.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Patient</p>
                      <p className="text-slate-200 font-medium">
                        {selected.patient ? `${selected.patient.firstName} ${selected.patient.lastName}` : "—"}
                      </p>
                      <p className="font-mono text-xs text-teal-400">{selected.patient?.patientId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Requested By</p>
                      <p className="text-slate-200">
                        {selected.requestedBy ? `${selected.requestedBy.firstName} ${selected.requestedBy.lastName}` : "—"}
                      </p>
                      <p className="text-xs text-slate-600 capitalize">{selected.requestedBy?.role}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Requested At</p>
                      <p className="text-slate-300">{formatTimeAgo(selected.createdAt)}</p>
                    </div>
                    {selected.completedAt && (
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Completed At</p>
                        <p className="text-slate-300">{formatDateTime(selected.completedAt)}</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Results + Update form */}
                <Card>
                  {selected.results && (
                    <div className="mb-5 p-4 bg-teal-500/5 border border-teal-500/20 rounded-xl">
                      <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5" /> Current Results
                      </p>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{selected.results}</p>
                      {selected.resultNotes && (
                        <div className="mt-3 pt-3 border-t border-teal-500/10">
                          <p className="text-xs text-slate-500 mb-1">Notes</p>
                          <p className="text-sm text-slate-400">{selected.resultNotes}</p>
                        </div>
                      )}
                      {selected.completedBy && (
                        <p className="text-xs text-slate-600 mt-3">
                          Completed by {selected.completedBy.firstName} {selected.completedBy.lastName}
                        </p>
                      )}
                    </div>
                  )}

                  {selected.status !== "completed" && (
                    <form onSubmit={handleUpdateResult} className="space-y-4">
                      <h4 className="text-sm font-semibold text-slate-300">
                        {selected.results ? "Update Results" : "Enter Results"}
                      </h4>
                      <Select
                        label="Update Status *"
                        name="status"
                        options={statusUpdateOpts}
                        defaultValue={selected.status === "pending" ? "in_progress" : "completed"}
                        required
                      />
                      <TextArea
                        label="Results *"
                        name="results"
                        defaultValue={selected.results ?? ""}
                        placeholder="Enter lab result values, findings, measurements..."
                        rows={5}
                        required
                      />
                      <TextArea
                        label="Clinical Notes / Interpretation"
                        name="resultNotes"
                        defaultValue={selected.resultNotes ?? ""}
                        placeholder="Clinical interpretation, reference ranges, recommendations..."
                        rows={3}
                      />
                      <Button type="submit" loading={saving} icon={<CheckCircle className="w-4 h-4" />}>
                        {saving ? "Saving..." : "Save Results"}
                      </Button>
                    </form>
                  )}

                  {selected.status === "completed" && !selected.results && (
                    <p className="text-center text-sm text-slate-600 py-4">This test is marked completed with no results entered.</p>
                  )}
                  {selected.status === "completed" && selected.results && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl mt-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <p className="text-sm text-emerald-300">Results finalized. No further action needed.</p>
                    </div>
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
