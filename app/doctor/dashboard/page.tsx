// app/doctor/dashboard/page.tsx – Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import AdmissionModel from "@/models/Admission";
import LabRequestModel from "@/models/LabRequest";
import DiagnosisModel from "@/models/Diagnosis";
import PatientModel from "@/models/Patient";
import VitalsModel from "@/models/Vitals";
import UserModel from "@/models/User";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DoctorDashboardClient } from "./DoctorDashboardClient";
import { getTimeGreeting, formatDate } from "@/lib/utils";

async function getDoctorData(doctorId: string) {
  await connectDB();

  const [
    myAdmissions,
    pendingLabs,
    todayDiagnoses,
    recentPatients,
    doctors,
  ] = await Promise.all([
    AdmissionModel.find({ admittingDoctor: doctorId, status: "admitted" })
      .populate("patient", "firstName lastName patientId gender dob phone address ailments status")
      .sort({ admittedAt: -1 })
      .lean(),
    LabRequestModel.countDocuments({ requestedBy: doctorId, status: { $in: ["pending", "in_progress"] } }),
    DiagnosisModel.countDocuments({
      doctor: doctorId,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
    PatientModel.find({ status: { $in: ["active", "admitted"] } })
      .select("_id patientId firstName lastName status gender dob")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    UserModel.find({ role: "doctor", status: "active" })
      .select("_id firstName lastName specialty")
      .lean(),
  ]);

  return {
    stats: {
      myPatients: myAdmissions.length,
      pendingLabs,
      todayDiagnoses,
    },
    myAdmissions: JSON.parse(JSON.stringify(myAdmissions)),
    recentPatients: JSON.parse(JSON.stringify(recentPatients)),
    doctors: JSON.parse(JSON.stringify(doctors)),
  };
}

export default async function DoctorDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "doctor") redirect("/doctor/login");

  const data = await getDoctorData(session.user.id);
  const greeting = getTimeGreeting();
  const today = formatDate(new Date());
  const firstName = session.user.name.split(" ").pop() ?? session.user.name;

  return (
    <DashboardLayout role="doctor">
      <DoctorDashboardClient
        greeting={greeting}
        today={today}
        firstName={firstName}
        doctorId={session.user.id}
        stats={data.stats}
        myAdmissions={data.myAdmissions}
        recentPatients={data.recentPatients}
      />
    </DashboardLayout>
  );
}
