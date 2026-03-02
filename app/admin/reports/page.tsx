// app/admin/reports/page.tsx – Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import PatientModel from "@/models/Patient";
import AdmissionModel from "@/models/Admission";
import InvoiceModel from "@/models/Invoice";
import UserModel from "@/models/User";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminReportsClient } from "./AdminReportsClient";

async function getData() {
  await connectDB();
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [totalPatients, totalStaff, totalRevAgg, monthlyAdmRaw, monthlyRevRaw] = await Promise.all([
    PatientModel.countDocuments(),
    UserModel.countDocuments({ status: "active" }),
    InvoiceModel.aggregate([{ $group: { _id: null, total: { $sum: "$amountPaidKobo" } } }]),
    AdmissionModel.aggregate([
      { $match: { admittedAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$admittedAt" }, month: { $month: "$admittedAt" } }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    InvoiceModel.aggregate([
      { $match: { status: { $in: ["paid","partial"] }, updatedAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$updatedAt" }, month: { $month: "$updatedAt" } }, revenueKobo: { $sum: "$amountPaidKobo" } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyAdmissions = monthlyAdmRaw.map((m: { _id: { month: number }; count: number }) => ({ month: months[m._id.month-1], count: m.count }));
  const monthlyRevenue = monthlyRevRaw.map((m: { _id: { month: number }; revenueKobo: number }) => ({ month: months[m._id.month-1], revenueKobo: m.revenueKobo }));

  return {
    summary: { totalPatients, totalStaff, totalRevenue: totalRevAgg[0]?.total ?? 0 },
    monthlyAdmissions,
    monthlyRevenue,
  };
}

export default async function AdminReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login");
  const data = await getData();
  return (
    <DashboardLayout role="admin">
      <AdminReportsClient summary={data.summary} monthlyAdmissions={data.monthlyAdmissions} monthlyRevenue={data.monthlyRevenue} />
    </DashboardLayout>
  );
}
