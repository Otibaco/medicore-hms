"use client";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, Plus, Trash2, Search, Filter, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { createInvoice, markInvoicePaid } from "@/actions/invoices";
import { formatNaira, koboToNaira, formatDate, formatTimeAgo } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Invoice {
  _id: string; invoiceId: string; totalKobo: number; amountPaidKobo: number;
  paymentType: string; status: string; createdAt: string;
  patient?: { firstName: string; lastName: string; patientId: string; phone: string };
}

interface Patient { _id: string; patientId: string; firstName: string; lastName: string }

const paymentOptions = [{ value: "", label: "Payment type" }, { value: "cash", label: "Cash" }, { value: "insurance", label: "Insurance" }, { value: "nhis", label: "NHIS" }, { value: "company", label: "Company" }];
const statusOpts = [{ value: "all", label: "All Status" }, { value: "pending", label: "Pending" }, { value: "paid", label: "Paid" }, { value: "partial", label: "Partial" }, { value: "overdue", label: "Overdue" }];

export function InvoicesClient({ invoices: initialInvoices, patients, userId, consultationFeeKobo }: {
  invoices: Invoice[]; patients: Patient[]; userId: string; consultationFeeKobo: number;
}) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [showNew, setShowNew] = useState(false);
  const [items, setItems] = useState([{ description: "Consultation", quantity: 1, unitPriceNaira: koboToNaira(consultationFeeKobo) }]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [submitting, startSubmit] = useTransition();
  const [paying, startPay] = useTransition();
  const router = useRouter();

  const filtered = invoices.filter(inv => {
    const name = inv.patient ? `${inv.patient.firstName} ${inv.patient.lastName} ${inv.patient.patientId}` : "";
    return `${name} ${inv.invoiceId}`.toLowerCase().includes(search.toLowerCase())
      && (statusFilter === "all" || inv.status === statusFilter);
  });

  const patientOptions = [{ value: "", label: "Select patient" }, ...patients.map(p => ({ value: p.patientId, label: `${p.firstName} ${p.lastName} (${p.patientId})` }))];

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("patientId", selectedPatientId);
    formData.set("paymentType", (e.currentTarget.querySelector('[name=paymentType]') as HTMLSelectElement)?.value ?? "cash");
    formData.set("items", JSON.stringify(items));
    startSubmit(async () => {
      const result = await createInvoice(formData);
      if (result.success) {
        toast.success("Invoice created!", { description: result.message });
        setShowNew(false);
        router.refresh();
      } else {
        toast.error("Failed", { description: result.message });
      }
    });
  };

  const handleMarkPaid = (invoiceId: string) => {
    const inv = invoices.find(i => i.invoiceId === invoiceId);
    if (!inv) return;
    const amountPaid = prompt(`Enter amount paid (₦):`);
    if (!amountPaid) return;
    const formData = new FormData();
    formData.set("invoiceId", invoiceId);
    formData.set("amountPaidNaira", amountPaid);
    startPay(async () => {
      const result = await markInvoicePaid(formData);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const totalAmt = items.reduce((s, i) => s + i.quantity * i.unitPriceNaira, 0);

  return (
    <div>
      <PageHeader title="Invoices & Billing" subtitle={`${invoices.length} total invoices`} icon={<Receipt className="w-5 h-5 text-amber-400" />}
        actions={<Button onClick={() => setShowNew(!showNew)} icon={<Plus className="w-4 h-4" />}>{showNew ? "Cancel" : "New Invoice"}</Button>} />

      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <Card>
              <h3 className="font-semibold text-slate-200 mb-5">Create New Invoice</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <Select label="Patient *" options={patientOptions} value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} required />
                <Select label="Payment Type *" name="paymentType" options={paymentOptions} required />
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-2">Invoice Items</label>
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <Input placeholder="Description" value={item.description} onChange={(e) => setItems(p => p.map((it, i) => i === idx ? { ...it, description: e.target.value } : it))} />
                      <Input placeholder="Qty" type="number" value={item.quantity.toString()} min={1} onChange={(e) => setItems(p => p.map((it, i) => i === idx ? { ...it, quantity: +e.target.value } : it))} className="w-20" />
                      <Input placeholder="Price (₦)" type="number" value={item.unitPriceNaira.toString()} min={0} onChange={(e) => setItems(p => p.map((it, i) => i === idx ? { ...it, unitPriceNaira: +e.target.value } : it))} className="w-32" />
                      {items.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => setItems(p => p.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4 text-red-400" /></Button>}
                    </div>
                  ))}
                  <Button type="button" variant="ghost" size="sm" onClick={() => setItems(p => [...p, { description: "", quantity: 1, unitPriceNaira: 0 }])} icon={<Plus className="w-3 h-3" />}>Add Item</Button>
                </div>
                <div className="flex justify-between items-center p-3 bg-surface-3 rounded-xl border border-[#1e3252]">
                  <span className="text-sm font-medium text-slate-300">Total</span>
                  <span className="font-serif text-xl font-bold text-amber-400">{formatNaira(totalAmt * 100)}</span>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" loading={submitting} icon={<CheckCircle2 className="w-4 h-4" />}>Generate Invoice</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} />
          <Select options={statusOpts} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e3252]">
                {["Invoice ID", "Patient", "Total", "Paid", "Payment", "Created", "Status", "Action"].map(h => (
                  <th key={h} className="text-left text-xs text-slate-600 pb-3 pr-4 font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((inv, i) => (
                <motion.tr key={inv._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-surface-2/50 transition-colors">
                  <td className="py-3 pr-4 font-mono text-xs text-amber-400">{inv.invoiceId}</td>
                  <td className="py-3 pr-4">
                    {inv.patient ? (
                      <div>
                        <p className="text-slate-200 font-medium text-xs">{inv.patient.firstName} {inv.patient.lastName}</p>
                        <p className="text-[10px] font-mono text-teal-400">{inv.patient.patientId}</p>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="py-3 pr-4 font-semibold text-slate-200">{formatNaira(inv.totalKobo)}</td>
                  <td className="py-3 pr-4 text-slate-400">{formatNaira(inv.amountPaidKobo)}</td>
                  <td className="py-3 pr-4"><Badge variant="blue">{inv.paymentType.toUpperCase()}</Badge></td>
                  <td className="py-3 pr-4 text-slate-500 text-xs">{formatTimeAgo(inv.createdAt)}</td>
                  <td className="py-3 pr-4"><StatusBadge status={inv.status} /></td>
                  <td className="py-3 pr-4">
                    {inv.status !== "paid" && (
                      <button onClick={() => handleMarkPaid(inv.invoiceId)} disabled={paying} className="text-xs px-2 py-1 rounded-lg bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 transition-all disabled:opacity-50">
                        Record Payment
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 mx-auto text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">No invoices found</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
