"use client";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Plus, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { createLabRequest } from "@/actions/clinical";
import { LAB_TESTS, formatTimeAgo } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface LabRequest {
  _id: string; labId: string; testName: string; priority: string; status: string; createdAt: string;
  patient?: { firstName: string; lastName: string; patientId: string };
  requestedBy?: { firstName: string; lastName: string };
}

interface Patient { _id: string; patientId: string; firstName: string; lastName: string }

const priorityOpts = [{ value: "routine", label: "Routine" }, { value: "urgent", label: "Urgent" }, { value: "stat", label: "STAT (Critical)" }];
const testOpts = [{ value: "", label: "Select test" }, ...LAB_TESTS.map(t => ({ value: t, label: t }))];
const statusOpts = [{ value: "all", label: "All" }, { value: "pending", label: "Pending" }, { value: "in_progress", label: "In Progress" }, { value: "completed", label: "Completed" }];

export function NurseLabsClient({ labRequests: initial, patients, userId }: { labRequests: LabRequest[]; patients: Patient[]; userId: string }) {
  const [labRequests, setLabRequests] = useState(initial);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [submitting, startSubmit] = useTransition();
  const router = useRouter();

  const patientOpts = [{ value: "", label: "Select patient" }, ...patients.map(p => ({ value: p.patientId, label: `${p.firstName} ${p.lastName} (${p.patientId})` }))];

  const filtered = labRequests.filter(l => {
    const name = l.patient ? `${l.patient.firstName} ${l.patient.lastName} ${l.patient.patientId}` : "";
    return `${name} ${l.labId} ${l.testName}`.toLowerCase().includes(search.toLowerCase())
      && (statusFilter === "all" || l.status === statusFilter);
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startSubmit(async () => {
      const result = await createLabRequest(formData);
      if (result.success) {
        toast.success("Lab request created!", { description: result.message });
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        toast.error("Failed", { description: result.message });
      }
    });
  };

  const priorityColor = (p: string) => p === "stat" ? "text-red-400 bg-red-500/10 border-red-500/20" : p === "urgent" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-teal-400 bg-teal-500/10 border-teal-500/20";

  return (
    <div>
      <PageHeader title="Lab Requests" subtitle="Request and track laboratory tests" icon={<FlaskConical className="w-5 h-5 text-teal-400" />} />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 flex items-center justify-center"><Plus className="w-4 h-4 text-teal-400" /></div>
            <h3 className="font-semibold text-slate-200">New Lab Request</h3>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <Select label="Patient *" name="patientId" options={patientOpts} required />
            <Select label="Test *" name="testName" options={testOpts} required />
            <Select label="Priority *" name="priority" options={priorityOpts} required />
            <Button type="submit" loading={submitting} className="w-full" icon={<FlaskConical className="w-4 h-4" />}>Submit Request</Button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <div className="flex gap-3 mb-5">
              <Input placeholder="Search requests..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} />
              <Select options={statusOpts} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
            </div>
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-10">
                  <FlaskConical className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                  <p className="text-slate-500 text-sm">No lab requests found</p>
                </div>
              ) : filtered.map((req, i) => (
                <motion.div key={req._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="p-4 rounded-xl bg-surface-2 border border-[#1e3252] hover:border-teal-500/20 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-violet-400">{req.labId}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${priorityColor(req.priority)}`}>{req.priority}</span>
                    </div>
                    <StatusBadge status={req.status.replace("_"," ")} />
                  </div>
                  <p className="font-semibold text-slate-200 text-sm mb-1">{req.testName}</p>
                  <p className="text-xs text-slate-500">
                    {req.patient ? `${req.patient.firstName} ${req.patient.lastName} · ${req.patient.patientId}` : "—"}
                    {" · "}
                    {req.requestedBy ? `Req. by ${req.requestedBy.firstName}` : ""}
                    {" · "}{formatTimeAgo(req.createdAt)}
                  </p>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
