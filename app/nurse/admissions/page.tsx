// app/nurse/admissions/page.tsx – Server Component: dedicated admissions page
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import AdmissionModel from "@/models/Admission";
import PatientModel from "@/models/Patient";
import UserModel from "@/models/User";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NurseAdmissionsClient } from "./NurseAdmissionsClient";

async function getData() {
  await connectDB();
  const [admissions, doctors, stats] = await Promise.all([
    AdmissionModel.find()
      .populate("patient", "firstName lastName patientId gender dob phone status")
      .populate("admittingDoctor", "firstName lastName specialty")
      .populate("admittedBy", "firstName lastName role")
      .populate("dischargedBy", "firstName lastName")
      .sort({ admittedAt: -1 })
      .limit(100)
      .lean(),
    UserModel.find({ role: "doctor", status: "active" })
      .select("_id firstName lastName specialty")
      .lean(),
    Promise.all([
      AdmissionModel.countDocuments({ status: "admitted" }),
      AdmissionModel.countDocuments({ status: "discharged" }),
      AdmissionModel.countDocuments(),
    ]),
  ]);

  return {
    admissions: JSON.parse(JSON.stringify(admissions)),
    doctors: JSON.parse(JSON.stringify(doctors)),
    stats: { admitted: stats[0], discharged: stats[1], total: stats[2] },
  };
}

export default async function NurseAdmissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["nurse", "admin"].includes(session.user.role))
    redirect("/nurse/login");

  const data = await getData();

  return (
    <DashboardLayout role="nurse">
      <NurseAdmissionsClient
        admissions={data.admissions}
        doctors={data.doctors}
        stats={data.stats}
        nurseId={session.user.id}
      />
    </DashboardLayout>
  );
}
