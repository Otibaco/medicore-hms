"use server";
// actions/reports.ts – Admin analytics
import connectDB from "@/lib/db";
import PatientModel from "@/models/Patient";
import AdmissionModel from "@/models/Admission";
import InvoiceModel from "@/models/Invoice";
import UserModel from "@/models/User";
import LabRequestModel from "@/models/LabRequest";
import { withAuth } from "@/lib/auth-guard";
import type { ActionResult } from "@/types";

export interface DashboardStats {
  totalPatients: number;
  totalAdmitted: number;
  totalDischarged: number;
  totalStaff: number;
  todayRegistrations: number;
  totalRevenuKobo: number;
  pendingLabRequests: number;
  monthlyAdmissions: { month: string; count: number }[];
  monthlyRevenue: { month: string; revenueKobo: number }[];
}

export async function getAdminDashboardStats(): Promise<ActionResult<DashboardStats>> {
  return withAuth(["admin"], async () => {
    await connectDB();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalPatients,
      totalAdmitted,
      totalDischarged,
      totalStaff,
      todayRegistrations,
      pendingLabRequests,
      revenueResult,
    ] = await Promise.all([
      PatientModel.countDocuments(),
      PatientModel.countDocuments({ status: "admitted" }),
      AdmissionModel.countDocuments({ status: "discharged" }),
      UserModel.countDocuments({ status: "active" }),
      PatientModel.countDocuments({ createdAt: { $gte: startOfToday } }),
      LabRequestModel.countDocuments({ status: "pending" }),
      InvoiceModel.aggregate([{ $group: { _id: null, total: { $sum: "$amountPaidKobo" } } }]),
    ]);

    // Monthly admissions (last 6 months)
    const monthlyAdmissionsRaw = await AdmissionModel.aggregate([
      { $match: { admittedAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$admittedAt" }, month: { $month: "$admittedAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Monthly revenue (last 6 months)
    const monthlyRevenueRaw = await InvoiceModel.aggregate([
      { $match: { status: { $in: ["paid", "partial"] }, updatedAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$updatedAt" }, month: { $month: "$updatedAt" } },
          revenueKobo: { $sum: "$amountPaidKobo" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    const monthlyAdmissions = monthlyAdmissionsRaw.map((m) => ({
      month: monthNames[m._id.month - 1],
      count: m.count,
    }));

    const monthlyRevenue = monthlyRevenueRaw.map((m) => ({
      month: monthNames[m._id.month - 1],
      revenueKobo: m.revenueKobo,
    }));

    return {
      success: true,
      message: "Dashboard stats fetched",
      data: {
        totalPatients,
        totalAdmitted,
        totalDischarged,
        totalStaff,
        todayRegistrations,
        totalRevenuKobo: revenueResult[0]?.total ?? 0,
        pendingLabRequests,
        monthlyAdmissions,
        monthlyRevenue,
      },
    };
  });
}

// Simpler dashboard stats for each role
export async function getRoleDashboardStats(role: string) {
  return withAuth(["admin", "doctor", "nurse", "receptionist"], async (currentUser) => {
    await connectDB();

    if (role === "receptionist") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const [todayPatients, pendingInvoices, totalPatients] = await Promise.all([
        PatientModel.countDocuments({ createdAt: { $gte: startOfToday } }),
        InvoiceModel.countDocuments({ status: "pending" }),
        PatientModel.countDocuments(),
      ]);
      return { success: true, message: "Stats", data: { todayPatients, pendingInvoices, totalPatients } };
    }

    if (role === "nurse") {
      const [currentAdmissions, pendingLabs, activePatients] = await Promise.all([
        AdmissionModel.countDocuments({ status: "admitted" }),
        LabRequestModel.countDocuments({ status: "pending" }),
        PatientModel.countDocuments({ status: { $in: ["active", "admitted"] } }),
      ]);
      return { success: true, message: "Stats", data: { currentAdmissions, pendingLabs, activePatients } };
    }

    if (role === "doctor") {
      const [myPatients, pendingLabs, completedDiagnoses] = await Promise.all([
        AdmissionModel.countDocuments({ admittingDoctor: currentUser.id, status: "admitted" }),
        LabRequestModel.countDocuments({ requestedBy: currentUser.id, status: { $in: ["pending", "in_progress"] } }),
        LabRequestModel.countDocuments({ requestedBy: currentUser.id, status: "completed" }),
      ]);
      return { success: true, message: "Stats", data: { myPatients, pendingLabs, completedDiagnoses } };
    }

    return { success: true, message: "Stats", data: {} };
  });
}
