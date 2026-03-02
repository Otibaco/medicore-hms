"use client";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, FileText, Receipt, CheckCircle2, Phone,
  MapPin, Calendar, Hash, Users, TrendingUp, Clock,
  Building, CreditCard, AlertCircle
} from "lucide-react";
import { Card, StatCard } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { registerPatient } from "@/actions/patients";
import { markInvoicePaid } from "@/actions/invoices";
import { formatNaira, formatTimeAgo, NIGERIAN_STATES, BLOOD_GROUPS, GENOTYPES } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Invoice {
  _id: string; invoiceId: string; totalKobo: number; amountPaidKobo: number;
  paymentType: string; status: string; createdAt: string;
  patient?: { firstName: string; lastName: string; patientId: string; phone: string };
}

interface Patient { _id: string; patientId: string; firstName: string; lastName: string; status: string; paymentType: string; createdAt: string }

interface Props {
  greeting: string; today: string; firstName: string; userId: string;
  stats: { todayRegistrations: number; totalPatients: number; pendingInvoices: number; todayRevenue: number };
  recentInvoices: Invoice[];
  recentPatients: Patient[];
}

const paymentOptions = [
  { value: "", label: "Select payment type" },
  { value: "cash", label: "Cash" },
  { value: "insurance", label: "Insurance" },
  { value: "nhis", label: "NHIS" },
  { value: "transfer", label: "Transfer" },
  { value: "company", label: "Company" },
];

const genderOptions = [
  { value: "", label: "Select gender" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const stateOptions = [
  { value: "", label: "Select state" },
  ...NIGERIAN_STATES.map((s) => ({ value: s, label: s })),
];

export function ReceptionistDashboardClient({ greeting, today, firstName, userId, stats, recentInvoices: initialInvoices, recentPatients: initialPatients }: Props) {
  const [recentPatients, setRecentPatients] = useState(initialPatients);
  const [recentInvoices, setRecentInvoices] = useState(initialInvoices);
  const [newPatientPreview, setNewPatientPreview] = useState<{ patientId: string; fullName: string; paymentType: string } | null>(null);
  const [submitting, startSubmit] = useTransition();
  const router = useRouter();

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startSubmit(async () => {
      const result = await registerPatient(formData);
      if (result.success && result.data) {
        const patient = result.data as unknown as Patient;
        setNewPatientPreview({
          patientId: patient.patientId,
          fullName: `${patient.firstName} ${patient.lastName}`,
          paymentType: patient.paymentType,
        });
        setRecentPatients((p) => [patient, ...p].slice(0, 5));
        toast.success("Patient registered!", { description: result.message, duration: 5000 });
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        toast.error("Registration failed", { description: result.message });
      }
    });
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-slate-500 text-sm mb-1">{greeting}, {firstName}!</p>
        <h1 className="font-serif text-3xl font-bold text-slate-100">Receptionist Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">{today} · Front Desk Operations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Today's Registrations" value={stats.todayRegistrations.toString()} change="Registered today" changeType="up" icon={<UserPlus className="w-5 h-5" />} glow="teal" />
        <StatCard title="Pending Invoices" value={stats.pendingInvoices.toString()} change="Awaiting payment" changeType={stats.pendingInvoices > 5 ? "down" : "neutral"} icon={<Receipt className="w-5 h-5" />} glow="gold" />
        <StatCard title="Today's Revenue" value={formatNaira(stats.todayRevenue)} change="Payments today" changeType="up" icon={<TrendingUp className="w-5 h-5" />} glow="purple" />
        <StatCard title="Total Patients" value={stats.totalPatients.toString()} change="All records" changeType="neutral" icon={<Users className="w-5 h-5" />} glow="rose" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Registration Form */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-200">Register New Patient</h2>
              <p className="text-xs text-slate-500">Complete form to register and generate patient ID</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name *" name="firstName" placeholder="Emeka" required />
              <Input label="Last Name *" name="lastName" placeholder="Okonkwo" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date of Birth *" name="dob" type="date" required icon={<Calendar className="w-3.5 h-3.5" />} />
              <Select label="Gender *" name="gender" options={genderOptions} required />
            </div>
            <Input label="Phone Number *" name="phone" type="tel" placeholder="08012345678" icon={<Phone className="w-3.5 h-3.5" />} required />
            <Input label="Email" name="email" type="email" placeholder="patient@email.com (optional)" />
            <Input label="Address *" name="address" placeholder="12 Adeola Street, Victoria Island" icon={<MapPin className="w-3.5 h-3.5" />} required />
            <div className="grid grid-cols-2 gap-3">
              <Select label="State *" name="state" options={stateOptions} required />
              <Input label="LGA *" name="lga" placeholder="Eti-Osa" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Blood Group" name="bloodGroup" options={[{ value: "", label: "Select" }, ...BLOOD_GROUPS.map(g => ({ value: g, label: g }))]} />
              <Select label="Genotype" name="genotype" options={[{ value: "", label: "Select" }, ...GENOTYPES.map(g => ({ value: g, label: g }))]} />
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Emergency Contact</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Name *" name="emergencyContactName" placeholder="Contact name" required />
                <Input label="Phone *" name="emergencyContactPhone" placeholder="08012345678" required />
              </div>
              <Input label="Relationship *" name="emergencyContactRelationship" placeholder="e.g. Spouse, Parent" required />
            </div>
            <Select label="Payment Type *" name="paymentType" options={paymentOptions} required />
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={submitting} className="flex-1" icon={<FileText className="w-4 h-4" />}>
                Register Patient
              </Button>
              <Button type="button" variant="secondary" onClick={() => setNewPatientPreview(null)}>Clear</Button>
            </div>
          </form>
        </Card>

        {/* Right column */}
        <div className="space-y-5">
          {/* New patient confirmation */}
          <AnimatePresence>
            {newPatientPreview && (
              <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.97 }}>
                <Card glow="teal" className="relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-teal-400 to-teal-600" />
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-teal-400" />
                    <span className="font-semibold text-teal-300 text-sm">Patient Registered Successfully</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-xs text-slate-500 flex items-center gap-1.5"><Hash className="w-3 h-3" /> Patient ID</span>
                      <span className="font-mono text-teal-400 font-bold">{newPatientPreview.patientId}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-xs text-slate-500">Full Name</span>
                      <span className="text-slate-200 font-medium">{newPatientPreview.fullName}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-xs text-slate-500">Payment</span>
                      <Badge variant="blue">{newPatientPreview.paymentType.toUpperCase()}</Badge>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button size="sm" onClick={() => router.push(`/receptionist/invoices?patientId=${newPatientPreview.patientId}`)}>
                      Create Invoice
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent Registrations */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-teal-500/15 flex items-center justify-center">
                <Clock className="w-4 h-4 text-teal-400" />
              </div>
              <h3 className="font-semibold text-slate-200">Recent Registrations</h3>
            </div>
            {recentPatients.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-6">No patients registered yet.</p>
            ) : (
              <div className="space-y-2">
                {recentPatients.map((p, i) => (
                  <motion.div key={p._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border hover:border-teal-500/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-3 border border-border flex items-center justify-center">
                        <span className="font-mono text-[10px] text-teal-400 font-bold">{p.patientId}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-slate-600 capitalize">{p.paymentType} · {formatTimeAgo(p.createdAt)}</p>
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Invoices */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="font-semibold text-slate-200">Recent Invoices</h3>
            </div>
            {recentInvoices.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-6">No invoices yet.</p>
            ) : (
              <div className="space-y-2">
                {recentInvoices.map((inv, i) => (
                  <motion.div key={inv._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border hover:border-amber-500/20 transition-all cursor-pointer"
                    onClick={() => toast.info(`Invoice ${inv.invoiceId}`, { description: `Total: ${formatNaira(inv.totalKobo)} · Paid: ${formatNaira(inv.amountPaidKobo)}` })}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-3 border border-border flex items-center justify-center">
                        <span className="text-[9px] text-amber-400 font-mono font-bold truncate px-1">{inv.invoiceId}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">
                          {inv.patient ? `${inv.patient.firstName} ${inv.patient.lastName}` : "Unknown"}
                        </p>
                        <p className="text-xs text-slate-600 capitalize">{inv.paymentType} · {formatTimeAgo(inv.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="font-semibold text-sm text-slate-200">{formatNaira(inv.totalKobo)}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
