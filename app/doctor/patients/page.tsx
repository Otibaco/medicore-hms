// app/doctor/patients/page.tsx – Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import PatientModel from "@/models/Patient";
import VitalsModel from "@/models/Vitals";
import DiagnosisModel from "@/models/Diagnosis";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DoctorPatientsClient } from "./DoctorPatientsClient";

async function getData(doctorId: string) {
  await connectDB();
  const patients = await PatientModel.find({ status: { $in: ["active","admitted"] } }).sort({ createdAt: -1 }).lean();
  return { patients: JSON.parse(JSON.stringify(patients)) };
}

export default async function DoctorPatientsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["doctor","admin"].includes(session.user.role)) redirect("/doctor/login");
  const data = await getData(session.user.id);
  return (
    <DashboardLayout role={session.user.role as "doctor"}>
      <DoctorPatientsClient patients={data.patients} doctorId={session.user.id} />
    </DashboardLayout>
  );
}
