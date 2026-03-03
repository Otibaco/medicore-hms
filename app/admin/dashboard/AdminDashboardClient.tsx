"use client";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserPlus, TrendingUp, BedDouble, Activity,
  Shield, Trash2, Eye, Search, Hash, Mail, Phone, Lock,
  RefreshCw, CheckCircle, XCircle
} from "lucide-react";
import { Card, StatCard } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge, RoleBadge, StatusBadge } from "@/components/ui/Badge";
import { createUser, deactivateUser, reactivateUser } from "@/actions/users";
import { generateStaffCode, formatNaira, formatDateTime, formatTimeAgo } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  greeting: string;
  today: string;
  firstName: string;
  stats: {
    totalUsers: number;
    totalPatients: number;
    activeAdmissions: number;
    todayRegistrations: number;
    pendingInvoices: number;
    totalRevenue: number;
    monthlyRevenue: number;
  };
  staffBreakdown: Record<string, number>;
  recentPatients: Array<{
    _id: string;
    patientId: string;
    firstName: string;
    lastName: string;
    status: string;
    paymentType: string;
    createdAt: string;
    registeredBy?: { firstName: string; lastName: string };
  }>;
  recentAuditLogs: Array<{
    _id: string;
    action: string;
    resource: string;
    createdAt: string;
    actor?: { firstName: string; lastName: string; role: string };
  }>;
  initialUsers: Array<{
    _id: string;
    staffCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    createdAt: string;
  }>;
}

const roleOptions = [
  { value: "", label: "Select role" },
  { value: "admin", label: "Admin" },
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "receptionist", label: "Receptionist" },
];

export function AdminDashboardClient({
  greeting, today, firstName, stats, staffBreakdown, recentPatients, recentAuditLogs, initialUsers,
}: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [generatedCode, setGeneratedCode] = useState("");
  const [submitting, startSubmit] = useTransition();
  const [deactivating, startDeactivate] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<"overview" | "users">("overview");

  const filteredUsers = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email} ${u.role} ${u.staffCode}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!generatedCode) {
      toast.error("Generate staff code", { description: "Click the Generate button first." });
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.set("staffCode", generatedCode);

    startSubmit(async () => {
      const result = await createUser(formData);

      if (result.success && result.data) {
        const normalizedUser = {
          ...result.data,
          createdAt:
            typeof result.data.createdAt === "string"
              ? result.data.createdAt
              : new Date(result.data.createdAt).toISOString(),
        };

        setUsers((prev) => [normalizedUser, ...prev]);

        setGeneratedCode("");
        (e.target as HTMLFormElement).reset();

        toast.success("Staff account created!", {
          description: result.message,
          duration: 5000,
        });
      } else {
        toast.error("Failed to create user", {
          description: result.message,
        });
      }
    });
  };

  const handleToggleStatus = (userId: string, currentStatus: string, name: string) => {
    startDeactivate(async () => {
      const action = currentStatus === "active" ? deactivateUser : reactivateUser;
      const result = await action(userId);
      if (result.success) {
        setUsers((p) =>
          p.map((u) =>
            u._id === userId ? { ...u, status: currentStatus === "active" ? "inactive" : "active" } : u
          )
        );
        toast.success(result.message, { description: name });
      } else {
        toast.error(result.message);
      }
    });
  };

  const totalStaff = Object.values(staffBreakdown).reduce((a, b) => a + b, 0) || 1;

  return (
    <div>
      <div className="mb-8">
        <p className="text-slate-500 text-sm mb-1">{greeting}, {firstName}!</p>
        <h1 className="font-serif text-3xl font-bold text-slate-100">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">{today} · System Administration</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Active Staff" value={stats.totalUsers.toString()} change={`${staffBreakdown.doctor ?? 0} doctors`} changeType="up" icon={<Users className="w-5 h-5" />} glow="teal" />
        <StatCard title="Total Patients" value={stats.totalPatients.toString()} change={`+${stats.todayRegistrations} today`} changeType="up" icon={<BedDouble className="w-5 h-5" />} glow="gold" />
        <StatCard title="Active Admissions" value={stats.activeAdmissions.toString()} change={`${stats.pendingInvoices} pending invoices`} changeType="neutral" icon={<Activity className="w-5 h-5" />} glow="purple" />
        <StatCard title="Monthly Revenue" value={formatNaira(stats.monthlyRevenue)} change={`Total: ${formatNaira(stats.totalRevenue)}`} changeType="up" icon={<TrendingUp className="w-5 h-5" />} glow="rose" />
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 p-1 bg-surface rounded-xl border border-border w-fit mb-6">
        {(["overview", "users"] as const).map((s) => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${activeSection === s ? "bg-surface-2 text-slate-200 border border-border" : "text-slate-500 hover:text-slate-300"
              }`}>
            {s === "overview" ? "Overview" : "User Management"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSection === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              {/* Patient stats */}
              <Card>
                <h3 className="font-semibold text-slate-200 mb-5 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-400" /> Patient Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: "Total Patients", value: stats.totalPatients, color: "text-teal-400" },
                    { label: "Admitted Today", value: stats.todayRegistrations, color: "text-blue-400" },
                    { label: "Active Admissions", value: stats.activeAdmissions, color: "text-violet-400" },
                    { label: "Pending Invoices", value: stats.pendingInvoices, color: "text-amber-400" },
                    { label: "Total Staff", value: stats.totalUsers, color: "text-emerald-400" },
                    { label: "Monthly Rev", value: formatNaira(stats.monthlyRevenue), color: "text-rose-400" },
                  ].map((item) => (
                    <div key={item.label} className="p-4 bg-surface-2 rounded-xl border border-border text-center">
                      <p className={`font-serif text-2xl font-bold mb-1 ${item.color}`}>{item.value}</p>
                      <p className="text-xs text-slate-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent patients */}
              <Card>
                <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <BedDouble className="w-5 h-5 text-violet-400" /> Recent Patients
                </h3>
                {recentPatients.length === 0 ? (
                  <p className="text-slate-600 text-sm text-center py-8">No patients registered yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {["Patient", "ID", "Payment", "Registered By", "Status"].map((h) => (
                            <th key={h} className="text-left text-xs text-slate-600 pb-3 pr-4 font-semibold uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {recentPatients.map((p) => (
                          <tr key={p._id} className="hover:bg-surface-2/50 transition-colors">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-surface-3 border border-border flex items-center justify-center text-[10px] font-bold text-slate-400">
                                  {p.firstName[0]}{p.lastName[0]}
                                </div>
                                <span className="text-slate-200 font-medium">{p.firstName} {p.lastName}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-4 font-mono text-[11px] text-teal-400">{p.patientId}</td>
                            <td className="py-3 pr-4"><Badge variant="blue">{p.paymentType.toUpperCase()}</Badge></td>
                            <td className="py-3 pr-4 text-slate-400 text-xs">{p.registeredBy ? `${p.registeredBy.firstName} ${p.registeredBy.lastName}` : "—"}</td>
                            <td className="py-3 pr-4"><StatusBadge status={p.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>

            {/* Activity log + staff breakdown */}
            <Card>
              <h3 className="font-semibold text-slate-200 mb-5 flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-400" /> Recent Activity
              </h3>
              <div className="space-y-3">
                {recentAuditLogs.length === 0 ? (
                  <p className="text-slate-600 text-xs text-center py-4">No activity yet.</p>
                ) : recentAuditLogs.map((log, i) => (
                  <motion.div key={log._id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-teal-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 capitalize">{log.action.replace(/_/g, " ").toLowerCase()}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : "System"} · {formatTimeAgo(log.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-border">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Staff by Role</h4>
                {(["admin", "doctor", "nurse", "receptionist"] as const).map((role) => {
                  const count = staffBreakdown[role] ?? 0;
                  const pct = Math.round((count / totalStaff) * 100);
                  return (
                    <div key={role} className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 capitalize">{role}</span>
                        <span className="text-slate-500">{count}</span>
                      </div>
                      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${role === "admin" ? "bg-amber-500" : role === "doctor" ? "bg-teal-500" : role === "nurse" ? "bg-violet-500" : "bg-blue-500"}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {activeSection === "users" && (
          <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid lg:grid-cols-2 gap-6">
            {/* Create User Form */}
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-200">Create Staff Account</h2>
                  <p className="text-xs text-slate-500">Add a new staff member to the system</p>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="First Name *" name="firstName" placeholder="Emeka" required />
                  <Input label="Last Name *" name="lastName" placeholder="Okafor" required />
                </div>
                <Input label="Email *" name="email" type="email" placeholder="staff@medicore.ng" icon={<Mail className="w-3.5 h-3.5" />} required />
                <Input label="Phone *" name="phone" type="tel" placeholder="08012345678" icon={<Phone className="w-3.5 h-3.5" />} required />
                <Select label="Role *" name="role" options={roleOptions} required />
                <Input label="Department" name="department" placeholder="e.g. Cardiology, Nursing" />
                <Input label="Title" name="title" placeholder="e.g. Dr., RN, Ms." />
                <Input label="Password *" name="password" type="password" placeholder="Min 8 chars, uppercase, number" icon={<Lock className="w-3.5 h-3.5" />} required />

                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1.5">Staff Code</label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center px-4 py-2.5 rounded-xl bg-surface-3 border border-border">
                      <Hash className="w-4 h-4 text-slate-600 mr-2" />
                      <span className={`font-mono text-sm ${generatedCode ? "text-amber-400 font-semibold" : "text-slate-600"}`}>
                        {generatedCode || "Click Generate →"}
                      </span>
                    </div>
                    <Button type="button" variant="secondary" onClick={() => setGeneratedCode(generateStaffCode())} icon={<RefreshCw className="w-4 h-4" />}>
                      Generate
                    </Button>
                  </div>
                </div>

                <Button type="submit" loading={submitting} className="w-full" icon={<UserPlus className="w-4 h-4" />}>
                  Create Staff Account
                </Button>
              </form>
            </Card>

            {/* Users Table */}
            <Card>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/15 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200">All Staff</h3>
                    <p className="text-xs text-slate-500">{users.length} accounts</p>
                  </div>
                </div>
                <Badge variant="teal">{users.filter(u => u.status === "active").length} Active</Badge>
              </div>

              <div className="mb-4">
                <Input placeholder="Search staff..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} icon={<Search className="w-4 h-4" />} />
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredUsers.map((user, i) => (
                  <motion.div key={user._id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border hover:border-amber-500/20 transition-all group">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${user.role === "admin" ? "bg-amber-500/15 text-amber-300 border border-amber-500/20" :
                        user.role === "doctor" ? "bg-teal-500/15 text-teal-300 border border-teal-500/20" :
                          user.role === "nurse" ? "bg-violet-500/15 text-violet-300 border border-violet-500/20" :
                            "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                      }`}>
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-200 truncate">{user.firstName} {user.lastName}</p>
                        <StatusBadge status={user.status} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-amber-400/70">{user.staffCode}</span>
                        <span className="text-slate-700">·</span>
                        <RoleBadge role={user.role} />
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleStatus(user._id, user.status, `${user.firstName} ${user.lastName}`)}
                      disabled={deactivating}
                      className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${user.status === "active"
                          ? "text-slate-600 hover:text-red-400 hover:bg-red-500/10"
                          : "text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/10"
                        }`}
                      title={user.status === "active" ? "Deactivate" : "Reactivate"}
                    >
                      {user.status === "active" ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                  </motion.div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-10 text-slate-600">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No staff found</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
