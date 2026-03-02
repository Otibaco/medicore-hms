// app/doctor/labs/page.tsx – Server Component: real lab results from DB
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import LabRequestModel from "@/models/LabRequest";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DoctorLabsClient } from "./DoctorLabsClient";

async function getData(doctorId: string) {
  await connectDB();
  // Show all lab results; doctor can see results for their requested tests
  const [labRequests, stats] = await Promise.all([
    LabRequestModel.find()
      .populate("patient", "firstName lastName patientId gender phone")
      .populate("requestedBy", "firstName lastName role")
      .populate("completedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    Promise.all([
      LabRequestModel.countDocuments({ status: "pending" }),
      LabRequestModel.countDocuments({ status: "in_progress" }),
      LabRequestModel.countDocuments({ status: "completed" }),
      LabRequestModel.countDocuments({ status: "completed", results: { $exists: true } }),
    ]),
  ]);

  return {
    labRequests: JSON.parse(JSON.stringify(labRequests)),
    stats: {
      pending: stats[0],
      inProgress: stats[1],
      completed: stats[2],
      reviewed: stats[3],
    },
  };
}

export default async function DoctorLabsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["doctor", "admin"].includes(session.user.role))
    redirect("/doctor/login");

  const data = await getData(session.user.id);

  return (
    <DashboardLayout role="doctor">
      <DoctorLabsClient
        labRequests={data.labRequests}
        stats={data.stats}
        doctorId={session.user.id}
      />
    </DashboardLayout>
  );
}
