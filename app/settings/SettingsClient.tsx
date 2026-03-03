"use client";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { User, Bell, Shield, Palette, Database, Save, Eye, EyeOff, Building2, CheckCircle, Lock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn, koboToNaira, NIGERIAN_STATES } from "@/lib/utils";
import { updateSettings, changePassword } from "@/actions/settings";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const TABS = [
  { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
  { id: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
  { id: "system", label: "Hospital Settings", icon: <Building2 className="w-4 h-4" /> },
];

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b [#1e3252]-white/[0.04] last:border-0">
      <div>
        <p className="text-sm text-slate-200 font-medium">{label}</p>
        {description && <p className="text-xs text-slate-600 mt-0.5">{description}</p>}
      </div>
      <div onClick={() => onChange(!checked)} className={cn("relative w-10 h-5 rounded-full transition-all cursor-pointer", checked ? "bg-teal-500" : "bg-surface-3 border border-border")}>
        <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", checked ? "left-5" : "left-0.5")} />
      </div>
    </div>
  );
}

interface Props {
  currentUser: { _id: string; firstName: string; lastName: string; email: string; phone: string; role: string; staffCode: string; department?: string; title?: string; specialty?: string } | null;
  settings: { hospitalName: string; hospitalAddress: string; hospitalPhone: string; hospitalEmail: string; state: string; lga: string; rcNumber?: string; nhisCode?: string; defaultConsultationFeeKobo: number; admissionFeeKobo: number } | null;
  userRole: string;
}

const stateOptions = [{ value: "", label: "Select state" }, ...NIGERIAN_STATES.map(s => ({ value: s, label: s }))];

export function SettingsClient({ currentUser, settings, userRole }: Props) {
  const [activeTab, setActiveTab] = useState("profile");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingSettings, startSaveSettings] = useTransition();
  const [savingPassword, startSavePassword] = useTransition();
  const router = useRouter();

  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startSaveSettings(async () => {
      const result = await updateSettings(formData);
      if (result.success) {
        toast.success("Settings saved", { description: result.message });
        router.refresh();
      } else {
        toast.error("Failed to save", { description: result.message });
      }
    });
  };

  const handleChangePassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startSavePassword(async () => {
      const result = await changePassword(formData);
      if (result.success) {
        toast.success("Password changed", { description: result.message });
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error("Failed", { description: result.message });
      }
    });
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and system preferences" icon={<Database className="w-5 h-5 text-teal-400" />} />

      {/* Tab pills - Horizontal Scroll on Mobile, No Wrapping */}
<div className="mb-8 w-full">
  <div className="flex items-center gap-1 p-1 bg-surface rounded-xl border border-[#1e3252] overflow-x-auto overflow-y-hidden no-scrollbar whitespace-nowrap scroll-smooth">
    {TABS.filter(t => t.id !== "system" || userRole === "admin").map((tab) => {
      const isActive = activeTab === tab.id;
      return (
        <button 
          key={tab.id} 
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg text-[11px] sm:text-sm font-medium transition-all shrink-0", 
            isActive 
              ? "bg-surface-2 text-slate-200 border border-border shadow-sm" 
              : "text-slate-500 hover:text-slate-300"
          )}
        >
          {/* Ensure icons scale with the text */}
          <span className="[&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-4 sm:[&>svg]:h-4 flex-shrink-0">
            {tab.icon}
          </span>
          {tab.label}
        </button>
      );
    })}
  </div>
</div>

      <div className="max-w-2xl">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#1e3252]">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-xl font-bold text-white">
                  {currentUser ? `${currentUser.firstName[0]}${currentUser.lastName[0]}` : "?"}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100">{currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "—"}</h3>
                  <p className="text-sm text-slate-500 capitalize">{currentUser?.role ?? "—"}</p>
                  <p className="text-xs font-mono text-teal-400 mt-1">{currentUser?.staffCode ?? "—"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider">First Name</label>
                    <p className="text-sm text-slate-200 mt-1">{currentUser?.firstName ?? "—"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider">Last Name</label>
                    <p className="text-sm text-slate-200 mt-1">{currentUser?.lastName ?? "—"}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider">Email Address</label>
                  <p className="text-sm text-slate-200 mt-1">{currentUser?.email ?? "—"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider">Phone</label>
                    <p className="text-sm text-slate-200 mt-1">{currentUser?.phone ?? "—"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider">Department</label>
                    <p className="text-sm text-slate-200 mt-1">{currentUser?.department ?? "—"}</p>
                  </div>
                </div>
                {currentUser?.specialty && (
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider">Specialty</label>
                    <p className="text-sm text-slate-200 mt-1">{currentUser.specialty}</p>
                  </div>
                )}
                <p className="text-xs text-slate-600 pt-2">Contact your administrator to update profile information.</p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200">Change Password</h3>
                  <p className="text-xs text-slate-500">Keep your account secure with a strong password</p>
                </div>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <Input label="Current Password *" name="currentPassword" type={showCurrentPw ? "text" : "password"} placeholder="Enter current password" required
                  suffix={<button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="text-slate-500 hover:text-slate-300">{showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>} />
                <Input label="New Password *" name="newPassword" type={showNewPw ? "text" : "password"} placeholder="Min 8 chars, 1 uppercase, 1 number" required
                  suffix={<button type="button" onClick={() => setShowNewPw(!showNewPw)} className="text-slate-500 hover:text-slate-300">{showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>} />
                <Input label="Confirm New Password *" name="confirmPassword" type="password" placeholder="Re-enter new password" required />
                <Button type="submit" loading={savingPassword} icon={<Save className="w-4 h-4" />}>Change Password</Button>
              </form>
            </Card>
          </motion.div>
        )}

        {/* Hospital Settings (Admin only) */}
        {activeTab === "system" && userRole === "admin" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200">Hospital Configuration</h3>
                  <p className="text-xs text-slate-500">Settings applied system-wide</p>
                </div>
              </div>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <Input label="Hospital Name *" name="hospitalName" defaultValue={settings?.hospitalName ?? ""} placeholder="SalutemRapha General Hospital" required />
                <Input label="Hospital Address *" name="hospitalAddress" defaultValue={settings?.hospitalAddress ?? ""} placeholder="14 Adeola Odeku, Victoria Island" required />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Phone *" name="hospitalPhone" defaultValue={settings?.hospitalPhone ?? ""} placeholder="01-2345678" required />
                  <Input label="Email *" name="hospitalEmail" type="email" defaultValue={settings?.hospitalEmail ?? ""} placeholder="info@hospital.ng" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="State *" name="state" options={stateOptions} defaultValue={settings?.state ?? ""} required />
                  <Input label="LGA *" name="lga" defaultValue={settings?.lga ?? ""} placeholder="Eti-Osa" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="RC Number" name="rcNumber" defaultValue={settings?.rcNumber ?? ""} placeholder="RC-123456" />
                  <Input label="NHIS Code" name="nhisCode" defaultValue={settings?.nhisCode ?? ""} placeholder="NHIS-MC-001" />
                </div>
                <div className="border-t border-[#1e3252] pt-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Fee Configuration (₦)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Consultation Fee (₦) *" name="defaultConsultationFeeNaira" type="number" step="100" defaultValue={settings ? koboToNaira(settings.defaultConsultationFeeKobo).toString() : "5000"} required />
                    <Input label="Admission Fee (₦) *" name="admissionFeeNaira" type="number" step="100" defaultValue={settings ? koboToNaira(settings.admissionFeeKobo).toString() : "20000"} required />
                  </div>
                </div>
                <Button type="submit" loading={savingSettings} icon={<Save className="w-4 h-4" />}>Save Hospital Settings</Button>
              </form>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
