"use client";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { formatDate, calculateAge, NIGERIAN_STATES, BLOOD_GROUPS, GENOTYPES } from "@/lib/utils";
import { registerPatient } from "@/actions/patients";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Patient {
  _id: string; patientId: string; firstName: string; lastName: string;
  gender: string; dob?: string; phone: string; state: string; status: string; paymentType: string; createdAt: string;
}

const genderOpts = [{ value:"", label:"Select gender" }, { value:"male", label:"Male" }, { value:"female", label:"Female" }, { value:"other", label:"Other" }];
const paymentOpts = [{ value:"", label:"Select payment" }, { value:"cash", label:"Cash" }, { value:"insurance", label:"Insurance" }, { value:"nhis", label:"NHIS" }, { value:"company", label:"Company" }];
const stateOpts = [{ value:"", label:"Select state" }, ...NIGERIAN_STATES.map(s => ({ value:s, label:s }))];
const statusOpts = [{ value:"all", label:"All Status" }, ...["active","admitted","discharged","deceased"].map(s => ({ value:s, label:s.charAt(0).toUpperCase()+s.slice(1) }))];

export function ReceptionistPatientsClient({ patients: initial, userId }: { patients: Patient[]; userId: string }) {
  const [patients, setPatients] = useState(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [submitting, startSubmit] = useTransition();
  const router = useRouter();

  const filtered = patients.filter(p => {
    const matchSearch = `${p.firstName} ${p.lastName} ${p.patientId} ${p.phone}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startSubmit(async () => {
      const result = await registerPatient(formData);
      if (result.success && result.data) {
        toast.success("Patient registered!", { description: result.message });
        setPatients(p => [result.data as unknown as Patient, ...p]);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        toast.error("Failed", { description: result.message });
      }
    });
  };

  return (
    <div>
      <PageHeader title="Register Patient" subtitle={`${patients.length} total patients in system`} icon={<UserPlus className="w-5 h-5 text-blue-400" />} />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-slate-200 mb-5">New Patient Registration</h3>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name *" name="firstName" placeholder="Emeka" required />
              <Input label="Last Name *" name="lastName" placeholder="Okonkwo" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date of Birth *" name="dob" type="date" required />
              <Select label="Gender *" name="gender" options={genderOpts} required />
            </div>
            <Input label="Phone *" name="phone" placeholder="08012345678" required />
            <Input label="Email" name="email" type="email" placeholder="optional" />
            <Input label="Address *" name="address" placeholder="Street address" required />
            <div className="grid grid-cols-2 gap-3">
              <Select label="State *" name="state" options={stateOpts} required />
              <Input label="LGA *" name="lga" placeholder="LGA" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Blood Group" name="bloodGroup" options={[{value:"",label:"Select"}, ...BLOOD_GROUPS.map(g=>({value:g,label:g}))]} />
              <Select label="Genotype" name="genotype" options={[{value:"",label:"Select"}, ...GENOTYPES.map(g=>({value:g,label:g}))]} />
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-3">Emergency Contact</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Name *" name="emergencyContactName" required />
                <Input label="Phone *" name="emergencyContactPhone" required />
              </div>
              <Input label="Relationship *" name="emergencyContactRelationship" placeholder="e.g. Spouse" required />
            </div>
            <Select label="Payment Type *" name="paymentType" options={paymentOpts} required />
            <Button type="submit" loading={submitting} className="w-full" icon={<UserPlus className="w-4 h-4" />}>Register Patient</Button>
          </form>
        </Card>

        <Card>
          <div className="flex gap-3 mb-4">
            <Input placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} />
            <Select options={statusOpts} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
          </div>
          <p className="text-xs text-slate-500 mb-3">{filtered.length} patients</p>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-10"><Users className="w-10 h-10 mx-auto text-slate-700 mb-2" /><p className="text-slate-500 text-sm">No patients found</p></div>
            ) : filtered.map((p, i) => (
              <motion.div key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border hover:border-teal-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-3 border border-border flex items-center justify-center text-[10px] font-bold text-slate-400">{p.firstName[0]}{p.lastName[0]}</div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{p.firstName} {p.lastName}</p>
                    <p className="text-[10px] font-mono text-teal-400">{p.patientId} · {p.dob ? `Age ${calculateAge(p.dob)}` : ""}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={p.status} />
                  <span className="text-[10px] text-slate-600">{p.state}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
