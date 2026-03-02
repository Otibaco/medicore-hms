// app/receptionist/invoices/page.tsx – Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import InvoiceModel from "@/models/Invoice";
import PatientModel from "@/models/Patient";
import SettingsModel from "@/models/Settings";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { InvoicesClient } from "./InvoicesClient";

async function getData() {
  await connectDB();
  const [invoices, patients, settings] = await Promise.all([
    InvoiceModel.find()
      .populate("patient", "firstName lastName patientId phone")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),
    PatientModel.find({ status: { $in: ["active","admitted"] } }).select("_id patientId firstName lastName").lean(),
    SettingsModel.findOne().lean(),
  ]);
  return {
    invoices: JSON.parse(JSON.stringify(invoices)),
    patients: JSON.parse(JSON.stringify(patients)),
    consultationFeeKobo: (settings as { defaultConsultationFeeKobo: number } | null)?.defaultConsultationFeeKobo ?? 500000,
  };
}

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin","receptionist"].includes(session.user.role)) redirect("/receptionist/login");
  const data = await getData();
  return (
    <DashboardLayout role={session.user.role as "receptionist" | "admin"}>
      <InvoicesClient invoices={data.invoices} patients={data.patients} userId={session.user.id} consultationFeeKobo={data.consultationFeeKobo} />
    </DashboardLayout>
  );
}
