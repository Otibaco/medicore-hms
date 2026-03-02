// app/receptionist/patients/page.tsx – Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import PatientModel from "@/models/Patient";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReceptionistPatientsClient } from "./ReceptionistPatientsClient";

async function getPatients() {
  await connectDB();
  const patients = await PatientModel.find()
    .sort({ createdAt: -1 })
    .lean()
    .select("-__v");
  // Return serialized plain objects to avoid circular references
  return JSON.parse(JSON.stringify(patients));
}

export default async function ReceptionistPatientsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["receptionist","admin"].includes(session.user.role)) redirect("/receptionist/login");
  const patients = await getPatients();
  return (
    <DashboardLayout role={session.user.role as "receptionist"}>
      <ReceptionistPatientsClient patients={patients} userId={session.user.id} />
    </DashboardLayout>
  );
}
