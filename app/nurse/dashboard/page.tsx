// app/nurse/dashboard/page.tsx – Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import AdmissionModel from "@/models/Admission";
import LabRequestModel from "@/models/LabRequest";
import PatientModel from "@/models/Patient";
import UserModel from "@/models/User";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NurseDashboardClient } from "./NurseDashboardClient";
import { getTimeGreeting, formatDate } from "@/lib/utils";

async function getNurseData() {
  await connectDB();

  const [
    currentAdmissions,
    pendingLabs,
    activePatients,
    admissions,
    doctors,
  ] = await Promise.all([
    AdmissionModel.countDocuments({ status: "admitted" }),
    LabRequestModel.countDocuments({ status: "pending" }),
    PatientModel.countDocuments({ status: { $in: ["active", "admitted"] } }),
    AdmissionModel.find({ status: "admitted" })
      .populate("patient", "firstName lastName patientId gender dob phone status")
      .populate("admittingDoctor", "firstName lastName specialty")
      .sort({ admittedAt: -1 })
      .limit(20)
      .lean(),
    UserModel.find({ role: "doctor", status: "active" })
      .select("_id firstName lastName specialty")
      .lean(),
  ]);

  return {
    stats: { currentAdmissions, pendingLabs, activePatients },
    admissions: JSON.parse(JSON.stringify(admissions)),
    doctors: JSON.parse(JSON.stringify(doctors)),
  };
}

export default async function NurseDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "nurse") redirect("/nurse/login");

  const data = await getNurseData();
  const greeting = getTimeGreeting();
  const today = formatDate(new Date());
  const firstName = session.user.name.split(" ")[0];

  return (
    <DashboardLayout role="nurse">
      <NurseDashboardClient
        greeting={greeting}
        today={today}
        firstName={firstName}
        nurseId={session.user.id}
        stats={data.stats}
        currentAdmissions={data.admissions}
        doctors={data.doctors}
      />
    </DashboardLayout>
  );
}
