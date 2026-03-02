// app/admin/patients/page.tsx – Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import PatientModel from "@/models/Patient";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPatientsClient } from "./AdminPatientsClient";

async function getPatients() {
  await connectDB();
  const patients = await PatientModel.find()
    .populate("registeredBy", "firstName lastName")
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(patients));
}

export default async function AdminPatientsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login");
  const patients = await getPatients();
  return (
    <DashboardLayout role="admin">
      <AdminPatientsClient patients={patients} />
    </DashboardLayout>
  );
}
