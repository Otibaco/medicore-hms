"use client";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Search, Mail, Phone, Lock, Hash, RefreshCw, Shield, CheckCircle, XCircle, Filter } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, RoleBadge, StatusBadge } from "@/components/ui/Badge";
import { createUser, deactivateUser, reactivateUser } from "@/actions/users";
import { generateStaffCode, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const roleOpts = [{ value: "", label: "Select role" }, ...["admin","doctor","nurse","receptionist"].map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))];
const statusFilter = [{ value: "all", label: "All Status" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }];

interface User {
  _id: string; staffCode: string; firstName: string; lastName: string;
  email: string; phone: string; role: string; status: string;
  department?: string; title?: string; specialty?: string; createdAt: string;
}

export function AdminUsersClient({ initialUsers, currentUserId }: { initialUsers: User[]; currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [code, setCode] = useState("");
  const [submitting, startSubmit] = useTransition();
  const [toggling, startToggle] = useTransition();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const filtered = users.filter((u) => {
    const matchSearch = `${u.firstName} ${u.lastName} ${u.email} ${u.role} ${u.staffCode}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusF === "all" || u.status === statusF;
    return matchSearch && matchRole && matchStatus;
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!code) { toast.error("Generate a staff code first."); return; }
    const formData = new FormData(e.currentTarget);
    startSubmit(async () => {
      const result = await createUser(formData);
      if (result.success && result.data) {
        setUsers((p) => [result.data!, ...p]);
        setCode("");
        setShowForm(false);
        (e.target as HTMLFormElement).reset();
        toast.success("Staff created!", { description: result.message });
        router.refresh();
      } else {
        toast.error("Failed", { description: result.message });
      }
    });
  };

  const handleToggle = (userId: string, status: string, name: string) => {
    if (userId === currentUserId) { toast.error("Cannot deactivate your own account."); return; }
    startToggle(async () => {
      const action = status === "active" ? deactivateUser : reactivateUser;
      const result = await action(userId);
      if (result.success) {
        setUsers((p) => p.map((u) => u._id === userId ? { ...u, status: status === "active" ? "inactive" : "active" } : u));
        toast.success(result.message, { description: name });
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div>
      <PageHeader title="User Management" subtitle="Create and manage staff accounts" icon={<Shield className="w-5 h-5 text-amber-400" />}
        actions={<Button onClick={() => setShowForm(!showForm)} icon={<UserPlus className="w-4 h-4" />}>{showForm ? "Cancel" : "New Staff"}</Button>} />

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <Card>
              <h3 className="font-semibold text-slate-200 mb-5 flex items-center gap-2"><UserPlus className="w-4 h-4 text-amber-400" /> Create New Staff Account</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="First Name *" name="firstName" placeholder="Emeka" required />
                  <Input label="Last Name *" name="lastName" placeholder="Okafor" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Email *" name="email" type="email" placeholder="staff@medicore.ng" required icon={<Mail className="w-3.5 h-3.5" />} />
                  <Input label="Phone *" name="phone" placeholder="08012345678" required icon={<Phone className="w-3.5 h-3.5" />} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Role *" name="role" options={roleOpts} required />
                  <Input label="Department" name="department" placeholder="e.g. Cardiology" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Title" name="title" placeholder="Dr., RN, Ms." />
                  <Input label="Specialty (Doctors)" name="specialty" placeholder="e.g. Cardiology" />
                </div>
                <Input label="Password *" name="password" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" required icon={<Lock className="w-3.5 h-3.5" />} />
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1.5">Staff Code *</label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center px-4 py-2.5 rounded-xl bg-surface-3 border border-border">
                      <Hash className="w-4 h-4 text-slate-600 mr-2" />
                      <span className={`font-mono text-sm ${code ? "text-amber-400 font-semibold" : "text-slate-600"}`}>{code || "Click Generate"}</span>
                    </div>
                    <Button type="button" variant="secondary" onClick={() => setCode(generateStaffCode())} icon={<RefreshCw className="w-4 h-4" />}>Generate</Button>
                  </div>
                </div>
                <input type="hidden" name="staffCode" value={code} />
                <div className="flex gap-3">
                  <Button type="submit" loading={submitting} icon={<UserPlus className="w-4 h-4" />}>Create Account</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} />
          <Select options={[{ value: "all", label: "All Roles" }, ...["admin","doctor","nurse","receptionist"].map(r => ({ value: r, label: r.charAt(0).toUpperCase()+r.slice(1) }))]} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} />
          <Select options={statusFilter} value={statusF} onChange={(e) => setStatusF(e.target.value)} />
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">{filtered.length} staff members</p>
          <Badge variant="teal">{users.filter(u => u.status === "active").length} Active</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Name", "Code", "Role", "Department", "Status", "Joined", "Action"].map(h => (
                  <th key={h} className="text-left text-xs text-slate-600 pb-3 pr-4 font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((user, i) => (
                <motion.tr key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-surface-2/50 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${user.role === "admin" ? "bg-amber-500/15 text-amber-300" : user.role === "doctor" ? "bg-teal-500/15 text-teal-300" : user.role === "nurse" ? "bg-violet-500/15 text-violet-300" : "bg-blue-500/15 text-blue-300"}`}>
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-slate-600">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-amber-400">{user.staffCode}</td>
                  <td className="py-3 pr-4"><RoleBadge role={user.role} /></td>
                  <td className="py-3 pr-4 text-slate-400 text-xs">{user.department ?? "—"}</td>
                  <td className="py-3 pr-4"><StatusBadge status={user.status} /></td>
                  <td className="py-3 pr-4 text-slate-500 text-xs">{formatDate(user.createdAt)}</td>
                  <td className="py-3 pr-4">
                    <button onClick={() => handleToggle(user._id, user.status, `${user.firstName} ${user.lastName}`)} disabled={toggling || user._id === currentUserId}
                      className={`p-1.5 rounded-lg transition-all ${user.status === "active" ? "text-slate-500 hover:text-red-400 hover:bg-red-500/10" : "text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10"} disabled:opacity-30`}
                      title={user.status === "active" ? "Deactivate" : "Reactivate"}>
                      {user.status === "active" ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">No staff found matching your search</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
