// app/nurse/labs/page.tsx – Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import LabRequestModel from "@/models/LabRequest";
import PatientModel from "@/models/Patient";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NurseLabsClient } from "./NurseLabsClient";

async function getData(nurseId: string) {
  await connectDB();
  const [labRequests, patients] = await Promise.all([
    LabRequestModel.find()
      .populate("patient", "firstName lastName patientId")
      .populate("requestedBy", "firstName lastName role")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    PatientModel.find({ status: { $in: ["active","admitted"] } }).select("_id patientId firstName lastName").lean(),
  ]);
  return { labRequests: JSON.parse(JSON.stringify(labRequests)), patients: JSON.parse(JSON.stringify(patients)) };
}

export default async function NurseLabsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["nurse","admin","doctor"].includes(session.user.role)) redirect("/nurse/login");
  const data = await getData(session.user.id);
  return (
    <DashboardLayout role={session.user.role as "nurse"}>
      <NurseLabsClient labRequests={data.labRequests} patients={data.patients} userId={session.user.id} />
    </DashboardLayout>
  );
}
