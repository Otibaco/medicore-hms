// app/doctor/diagnoses/page.tsx – Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import DiagnosisModel from "@/models/Diagnosis";
import PatientModel from "@/models/Patient";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DoctorDiagnosesClient } from "./DoctorDiagnosesClient";

async function getData(doctorId: string) {
  await connectDB();
  const [diagnoses, patients] = await Promise.all([
    DiagnosisModel.find({ doctor: doctorId })
      .populate("patient", "firstName lastName patientId gender")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    PatientModel.find({ status: { $in: ["active","admitted"] } })
      .select("_id patientId firstName lastName")
      .lean(),
  ]);
  return { diagnoses: JSON.parse(JSON.stringify(diagnoses)), patients: JSON.parse(JSON.stringify(patients)) };
}

export default async function DoctorDiagnosesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["doctor","admin"].includes(session.user.role)) redirect("/doctor/login");
  const data = await getData(session.user.id);
  return (
    <DashboardLayout role={session.user.role as "doctor"}>
      <DoctorDiagnosesClient diagnoses={data.diagnoses} patients={data.patients} />
    </DashboardLayout>
  );
}
