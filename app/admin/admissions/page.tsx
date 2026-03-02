// app/admin/admissions/page.tsx – Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import AdmissionModel from "@/models/Admission";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminAdmissionsClient } from "./AdminAdmissionsClient";

async function getData() {
  await connectDB();
  const [total, admitted, discharged, admissions] = await Promise.all([
    AdmissionModel.countDocuments(),
    AdmissionModel.countDocuments({ status: "admitted" }),
    AdmissionModel.countDocuments({ status: "discharged" }),
    AdmissionModel.find()
      .populate("patient", "firstName lastName patientId gender phone dob")
      .populate("admittingDoctor", "firstName lastName specialty")
      .populate("admittedBy", "firstName lastName role")
      .sort({ admittedAt: -1 })
      .limit(100)
      .lean(),
  ]);
  return { stats: { total, admitted, discharged }, admissions: JSON.parse(JSON.stringify(admissions)) };
}

export default async function AdminAdmissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login");
  const data = await getData();
  return (
    <DashboardLayout role="admin">
      <AdminAdmissionsClient stats={data.stats} admissions={data.admissions} />
    </DashboardLayout>
  );
}
