// app/admin/dashboard/page.tsx – Server Component, real DB data
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import PatientModel from "@/models/Patient";
import AdmissionModel from "@/models/Admission";
import InvoiceModel from "@/models/Invoice";
import AuditLogModel from "@/models/AuditLog";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminDashboardClient } from "./AdminDashboardClient";
import { formatNaira, getTimeGreeting } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

async function getAdminData() {
  await connectDB();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalPatients,
    activeAdmissions,
    todayRegistrations,
    pendingInvoices,
    revenueAgg,
    monthlyRevenueAgg,
    staffByRole,
    recentPatients,
    recentAuditLogs,
    users,
  ] = await Promise.all([
    UserModel.countDocuments({ status: "active" }),
    PatientModel.countDocuments(),
    AdmissionModel.countDocuments({ status: "admitted" }),
    PatientModel.countDocuments({ createdAt: { $gte: startOfToday } }),
    InvoiceModel.countDocuments({ status: { $in: ["pending", "overdue"] } }),
    InvoiceModel.aggregate([
      { $match: { status: { $in: ["paid", "partial"] } } },
      { $group: { _id: null, total: { $sum: "$amountPaidKobo" } } },
    ]),
    InvoiceModel.aggregate([
      { $match: { status: { $in: ["paid", "partial"] }, updatedAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amountPaidKobo" } } },
    ]),
    UserModel.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
    PatientModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("registeredBy", "firstName lastName")
      .lean(),
    AuditLogModel.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("actor", "firstName lastName role")
      .lean(),
    UserModel.find({ status: "active" })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const totalRevenue = revenueAgg[0]?.total ?? 0;
  const monthlyRevenue = monthlyRevenueAgg[0]?.total ?? 0;

  // Staff breakdown
  const staffBreakdown: Record<string, number> = { admin: 0, doctor: 0, nurse: 0, receptionist: 0 };
  staffByRole.forEach((r: { _id: string; count: number }) => {
    staffBreakdown[r._id] = r.count;
  });

  return {
    stats: {
      totalUsers,
      totalPatients,
      activeAdmissions,
      todayRegistrations,
      pendingInvoices,
      totalRevenue,
      monthlyRevenue,
    },
    staffBreakdown,
    recentPatients: JSON.parse(JSON.stringify(recentPatients)),
    recentAuditLogs: JSON.parse(JSON.stringify(recentAuditLogs)),
    users: JSON.parse(JSON.stringify(users)),
  };
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login");

  const data = await getAdminData();
  const greeting = getTimeGreeting();
  const today = formatDate(new Date());
  const firstName = session.user.name.split(" ")[0];

  return (
    <DashboardLayout role="admin">
      <AdminDashboardClient
        greeting={greeting}
        today={today}
        firstName={firstName}
        stats={data.stats}
        staffBreakdown={data.staffBreakdown}
        recentPatients={data.recentPatients}
        recentAuditLogs={data.recentAuditLogs}
        initialUsers={data.users}
      />
    </DashboardLayout>
  );
}
