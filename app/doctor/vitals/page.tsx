// app/doctor/vitals/page.tsx – Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import VitalsModel from "@/models/Vitals";
import PatientModel from "@/models/Patient";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DoctorVitalsClient } from "./DoctorVitalsClient";

async function getData(doctorId: string) {
  await connectDB();
  const [recentVitals, patients] = await Promise.all([
    VitalsModel.find()
      .populate("patient", "firstName lastName patientId")
      .populate("recordedBy", "firstName lastName role")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    PatientModel.find({ status: { $in: ["active","admitted"] } })
      .select("_id patientId firstName lastName")
      .lean(),
  ]);
  return { recentVitals: JSON.parse(JSON.stringify(recentVitals)), patients: JSON.parse(JSON.stringify(patients)) };
}

export default async function DoctorVitalsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["doctor","nurse","admin"].includes(session.user.role)) redirect("/doctor/login");
  const data = await getData(session.user.id);
  return (
    <DashboardLayout role={session.user.role as "doctor"}>
      <DoctorVitalsClient recentVitals={data.recentVitals} patients={data.patients} userId={session.user.id} />
    </DashboardLayout>
  );
}
