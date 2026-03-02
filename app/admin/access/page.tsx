"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Shield, Eye, Lock, Unlock, CheckCircle, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, RoleBadge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PERMISSIONS = [
  { id: "p1", action: "Register Patient", admin: true, doctor: false, nurse: true, receptionist: true },
  { id: "p2", action: "View Patient Records", admin: true, doctor: true, nurse: true, receptionist: true },
  { id: "p3", action: "Edit Patient Records", admin: true, doctor: true, nurse: false, receptionist: false },
  { id: "p4", action: "Create Diagnosis", admin: true, doctor: true, nurse: false, receptionist: false },
  { id: "p5", action: "Request Lab Tests", admin: true, doctor: true, nurse: true, receptionist: false },
  { id: "p6", action: "View Lab Results", admin: true, doctor: true, nurse: true, receptionist: false },
  { id: "p7", action: "Process Admissions", admin: true, doctor: false, nurse: true, receptionist: false },
  { id: "p8", action: "Generate Invoices", admin: true, doctor: false, nurse: false, receptionist: true },
  { id: "p9", action: "Manage Users", admin: true, doctor: false, nurse: false, receptionist: false },
  { id: "p10", action: "View Reports", admin: true, doctor: true, nurse: false, receptionist: false },
  { id: "p11", action: "System Settings", admin: true, doctor: false, nurse: false, receptionist: false },
  { id: "p12", action: "Delete Records", admin: true, doctor: false, nurse: false, receptionist: false },
];

type Role = "admin" | "doctor" | "nurse" | "receptionist";
const ROLES: Role[] = ["admin", "doctor", "nurse", "receptionist"];

const roleLabel: Record<Role, string> = { admin: "Admin", doctor: "Doctor", nurse: "Nurse", receptionist: "Receptionist" };

export default function AccessControlPage() {
  const [permissions, setPermissions] = useState(PERMISSIONS);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string, role: Role) => {
    if (role === "admin") { toast.error("Admin permissions cannot be modified"); return; }
    setPermissions(p => p.map(perm => perm.id === id ? { ...perm, [role]: !perm[role as keyof typeof perm] } : perm));
    toast.success("Permission updated", { description: "Changes will take effect on next login." });
  };

  const saveAll = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    toast.success("Access control saved", { description: "Permission matrix updated successfully.", duration: 4000 });
  };

  return (
    <DashboardLayout role="admin" pageTitle="Access Control">
      <PageHeader
        title="Access Control"
        subtitle="Manage role-based permissions across the system"
        actions={
          <Button onClick={saveAll} loading={saving} icon={<Shield className="w-4 h-4" />}>Save Changes</Button>
        }
      />

      <div className="grid sm:grid-cols-4 gap-4 mb-7">
        {ROLES.map(role => (
          <Card key={role}>
            <div className="flex items-center gap-2 mb-3">
              <RoleBadge role={roleLabel[role]} />
            </div>
            <p className="text-2xl font-bold font-serif text-slate-100 mb-0.5">
              {permissions.filter(p => p[role]).length}
            </p>
            <p className="text-xs text-slate-600">of {permissions.length} permissions</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider pb-3 pr-6">Permission</th>
                {ROLES.map(role => (
                  <th key={role} className="text-center text-[10px] font-semibold text-slate-600 uppercase tracking-wider pb-3 px-4">
                    <RoleBadge role={roleLabel[role]} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((perm, i) => (
                <motion.tr key={perm.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 pr-6">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-slate-300">{perm.action}</span>
                    </div>
                  </td>
                  {ROLES.map(role => {
                    const has = perm[role as keyof typeof perm] as boolean;
                    const isAdmin = role === "admin";
                    return (
                      <td key={role} className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => toggle(perm.id, role)}
                          disabled={isAdmin}
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all",
                            isAdmin ? "cursor-not-allowed" : "cursor-pointer hover:scale-110",
                            has
                              ? isAdmin ? "bg-amber-500/20 text-amber-400" : "bg-teal-500/20 text-teal-400 hover:bg-teal-500/30"
                              : "bg-white/[0.04] text-slate-700 hover:bg-white/[0.08]"
                          )}
                        >
                          {has ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3 h-3" />}
                        </button>
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-teal-500/20 border border-teal-500/30" /><span>Permitted</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-white/[0.04] border border-white/[0.08]" /><span>Restricted</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" /><span>Admin (locked)</span></div>
        </div>
      </Card>
    </DashboardLayout>
  );
}
