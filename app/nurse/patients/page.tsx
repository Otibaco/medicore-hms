// app/nurse/patients/page.tsx – Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import PatientModel from "@/models/Patient";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NursePatientsClient } from "./NursePatientsClient";

async function getPatients() {
  await connectDB();
  const patients = await PatientModel.find()
    .sort({ createdAt: -1 })
    .populate("registeredBy", "firstName lastName")
    .lean();
  return JSON.parse(JSON.stringify(patients));
}

export default async function NursePatientsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["nurse","admin","doctor"].includes(session.user.role)) redirect("/nurse/login");
  const patients = await getPatients();
  return (
    <DashboardLayout role={session.user.role as "nurse"}>
      <NursePatientsClient patients={patients} />
    </DashboardLayout>
  );
}
