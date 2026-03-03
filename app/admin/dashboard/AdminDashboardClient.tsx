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
    <div className="w-full min-h-screen px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <p className="text-slate-500 text-xs sm:text-sm mb-1">{greeting}, {firstName}!</p>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-100">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1 text-xs sm:text-sm">{today} · System Administration</p>
      </div>

      {/* Stats Grid — 1 col mobile, 2 col sm, 4 col lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
        <StatCard
          title="Active Staff"
          value={stats.totalUsers.toString()}
          change={`${staffBreakdown.doctor ?? 0} doctors`}
          changeType="up"
          icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />}
          glow="teal"
        />
        <StatCard
          title="Total Patients"
          value={stats.totalPatients.toString()}
          change={`+${stats.todayRegistrations} today`}
          changeType="up"
          icon={<BedDouble className="w-4 h-4 sm:w-5 sm:h-5" />}
          glow="gold"
        />
        <StatCard
          title="Active Admissions"
          value={stats.activeAdmissions.toString()}
          change={`${stats.pendingInvoices} pending invoices`}
          changeType="neutral"
          icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5" />}
          glow="purple"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatNaira(stats.monthlyRevenue)}
          change={`Total: ${formatNaira(stats.totalRevenue)}`}
          changeType="up"
          icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />}
          glow="rose"
        />
      </div>

      {/* Section Tabs — full width on mobile, auto-width on sm+ */}
      <div className="flex gap-1 p-1 bg-surface rounded-xl border border-[#1e3252] w-full sm:w-fit mb-5 sm:mb-6">
        {(["overview", "users"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`flex-1 sm:flex-none whitespace-nowrap px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium capitalize transition-all duration-200 ${activeSection === s
              ? "bg-surface-2 text-slate-200 border border-[#1e3252]"
              : "text-slate-500 hover:text-slate-300"
              }`}
          >
            {s === "overview" ? "Overview" : "User Management"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── OVERVIEW ── */}
        {activeSection === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6"
          >
            {/* Left column */}
<div className="lg:col-span-2 space-y-5">
  {/* Patient Overview */}
  <Card>
    <h3 className="font-semibold text-slate-200 mb-4 sm:mb-5 flex items-center gap-2 text-sm sm:text-base">
      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400 flex-shrink-0" />
      Patient Overview
    </h3>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[
        { label: "Total Patients", value: stats.totalPatients, color: "text-teal-400" },
        { label: "Admitted Today", value: stats.todayRegistrations, color: "text-blue-400" },
        { label: "Active Admissions", value: stats.activeAdmissions, color: "text-violet-400" },
        { label: "Pending Invoices", value: stats.pendingInvoices, color: "text-amber-400" },
        { label: "Total Staff", value: stats.totalUsers, color: "text-emerald-400" },
        { label: "Monthly Rev", value: formatNaira(stats.monthlyRevenue), color: "text-rose-400" },
      ].map((item) => (
        <div
          key={item.label}
          className="p-3 sm:p-4 bg-surface-2 rounded-xl border border-[#1e3252] text-center flex flex-col justify-center min-w-0"
        >
          {/* Smart font scaling: smaller on mobile to prevent break-all/wrapping */}
          <p className={`text-base xs:text-lg sm:text-2xl font-bold mb-1 truncate ${item.color}`}>
            {item.value}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  </Card>

  {/* Recent Patients */}
  <Card>
    <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2 text-sm sm:text-base">
      <BedDouble className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 flex-shrink-0" />
      Recent Patients
    </h3>
    {recentPatients.length === 0 ? (
      <p className="text-slate-600 text-sm text-center py-8">No patients registered yet.</p>
    ) : (
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full text-xs sm:text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-[#1e3252]">
              {["Patient", "ID", "Payment", "Registered By", "Status"].map((h) => (
                <th
                  key={h}
                  className="text-left text-[10px] sm:text-xs text-slate-600 pb-3 pr-3 sm:pr-4 font-semibold whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e3252]">
            {recentPatients.map((p) => (
              <tr key={p._id} className="hover:bg-surface-2/50 transition-colors">
                <td className="py-3 pr-3 sm:pr-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-surface-3 border border-[#1e3252] flex items-center justify-center text-[10px] font-bold text-slate-400 flex-shrink-0">
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <span className="text-slate-200 font-medium whitespace-nowrap overflow-hidden text-ellipsis text-[11px] sm:text-sm">
                      {p.firstName} {p.lastName}
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-3 sm:pr-4 whitespace-nowrap">
                  <span className="text-[10px] sm:text-[11px] text-teal-400">
                    {p.patientId}
                  </span>
                </td>
                <td className="py-3 pr-3 sm:pr-4">
                  <Badge variant="blue" className="text-[9px] sm:text-[10px]">
                    {p.paymentType}
                  </Badge>
                </td>
                <td className="py-3 pr-3 sm:pr-4 text-slate-400 text-[10px] sm:text-xs whitespace-nowrap">
                  {p.registeredBy
                    ? `${p.registeredBy.firstName} ${p.registeredBy.lastName}`
                    : "—"}
                </td>
                <td className="py-3">
                  <StatusBadge status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </Card>
</div>

            {/* Right column: Activity + Staff by Role */}
            <Card>
              <h3 className="font-semibold text-slate-200 mb-4 sm:mb-5 flex items-center gap-2 text-sm sm:text-base">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentAuditLogs.length === 0 ? (
                  <p className="text-slate-600 text-xs text-center py-4">No activity yet.</p>
                ) : (
                  recentAuditLogs.map((log, i) => (
                    <motion.div
                      key={log._id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-teal-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 capitalize leading-snug">
                          {log.action.replace(/_/g, " ").toLowerCase()}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {log.actor
                            ? `${log.actor.firstName} ${log.actor.lastName}`
                            : "System"}{" "}
                          · {formatTimeAgo(log.createdAt)}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-[#1e3252]">
                <h4 className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Staff by Role
                </h4>
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
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${role === "admin"
                            ? "bg-amber-500"
                            : role === "doctor"
                              ? "bg-teal-500"
                              : role === "nurse"
                                ? "bg-violet-500"
                                : "bg-blue-500"
                            }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── USER MANAGEMENT ── */}
        {activeSection === "users" && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6"
          >
            {/* Create User Form */}
            <Card>
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-200 text-sm sm:text-base">Create Staff Account</h2>
                  <p className="text-[10px] sm:text-xs text-slate-500">Add a new staff member to the system</p>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="First Name *" name="firstName" placeholder="Emeka" required />
                  <Input label="Last Name *" name="lastName" placeholder="Okafor" required />
                </div>

                <Input
                  label="Email *"
                  name="email"
                  type="email"
                  placeholder="staff@medicore.ng"
                  icon={<Mail className="w-3.5 h-3.5" />}
                  required
                />
                <Input
                  label="Phone *"
                  name="phone"
                  type="tel"
                  placeholder="08012345678"
                  icon={<Phone className="w-3.5 h-3.5" />}
                  required
                />
                <Select label="Role *" name="role" options={roleOptions} required />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Department" name="department" placeholder="e.g. Cardiology, Nursing" />
                  <Input label="Title" name="title" placeholder="e.g. Dr., RN, Ms." />
                </div>

                <Input
                  label="Password *"
                  name="password"
                  type="password"
                  placeholder="Min 8 chars, uppercase, number"
                  icon={<Lock className="w-3.5 h-3.5" />}
                  required
                />

                <div>
                  <label className="text-xs sm:text-sm font-medium text-slate-300 block mb-1.5">
                    Staff Code
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-surface-3 border border-[#1e3252] min-w-0">
                      <Hash className="w-3.5 h-3.5 text-slate-600 mr-2 flex-shrink-0" />
                      <span
                        className={`font-mono text-xs sm:text-sm truncate ${generatedCode ? "text-amber-400 font-semibold" : "text-slate-600"
                          }`}
                      >
                        {generatedCode || "Click Generate →"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setGeneratedCode(generateStaffCode())}
                      icon={<RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  loading={submitting}
                  className="w-full"
                  icon={<UserPlus className="w-4 h-4" />}
                >
                  Create Staff Account
                </Button>
              </form>
            </Card>

            {/* Users Table */}
            <Card className="p-3 sm:p-5">
              {/* Header Section: Improved spacing for small screens */}
              <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-500/15 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <h3 className="font-bold text-slate-200 text-sm sm:text-base leading-tight truncate">
                      All Staff
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                      {users.length} accounts
                    </p>
                  </div>
                </div>
                <Badge variant="teal" className="flex-shrink-0 text-[10px] sm:text-xs px-2 py-0.5">
                  {users.filter((u) => u.status === "active").length} Active
                </Badge>
              </div>

              {/* Search Bar: Full width and accessible height */}
              <div className="mb-4">
                <Input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="w-4 h-4 text-slate-400" />}
                  className="bg-surface-2 border-[#1e3252] focus:border-teal-500/50 h-10 text-sm"
                />
              </div>

              {/* Staff List Container: Optimized scroll and spacing */}
              <div className="space-y-3 max-h-[450px] sm:max-h-[550px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {filteredUsers.map((user, i) => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-[#1e3252] hover:border-teal-500/30 transition-all group active:scale-[0.98] sm:active:scale-100"
                  >
                    {/* Avatar: Larger touch area/visibility */}
                    <div
                      className={`w-10 h-10 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-inner ${user.role === "admin"
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                          : user.role === "doctor"
                            ? "bg-teal-500/15 text-teal-300 border border-teal-500/20"
                            : user.role === "nurse"
                              ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                              : "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                        }`}
                    >
                      {user.firstName[0]}{user.lastName[0]}
                    </div>

                    {/* User Info: Better alignment and wrap-handling */}
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <p className="text-sm font-semibold text-slate-100 truncate max-w-[120px] sm:max-w-none">
                          {user.firstName} {user.lastName}
                        </p>
                        <div className="scale-90 origin-left">
                          <StatusBadge status={user.status} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-amber-400/80 tracking-wider">
                          {user.staffCode}
                        </span>
                        <span className="text-slate-700 text-[10px]">•</span>
                        <RoleBadge role={user.role} />
                      </div>
                    </div>

                    {/* Action Button: Always visible on mobile for UX, hover on desktop */}
                    <button
                      onClick={() =>
                        handleToggleStatus(
                          user._id,
                          user.status,
                          `${user.firstName} ${user.lastName}`
                        )
                      }
                      disabled={deactivating}
                      className={`p-2.5 rounded-lg transition-all flex-shrink-0 
            ${user.status === "active"
                          ? "text-slate-500 hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/20"
                          : "text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 active:bg-emerald-500/20"
                        } 
            lg:opacity-0 lg:group-hover:opacity-100 opacity-100`}
                      title={user.status === "active" ? "Deactivate" : "Reactivate"}
                    >
                      {user.status === "active" ? (
                        <XCircle className="w-5 h-5 sm:w-4 sm:h-4" />
                      ) : (
                        <CheckCircle className="w-5 h-5 sm:w-4 sm:h-4" />
                      )}
                    </button>
                  </motion.div>
                ))}

                {/* Empty State */}
                {filteredUsers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-slate-600 opacity-40" />
                    </div>
                    <h4 className="text-slate-300 font-medium text-sm">No results found</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                      Try adjusting your search to find the staff member.
                    </p>
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
