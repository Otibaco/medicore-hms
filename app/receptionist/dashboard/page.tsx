// app/receptionist/dashboard/page.tsx – Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import PatientModel from "@/models/Patient";
import InvoiceModel from "@/models/Invoice";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReceptionistDashboardClient } from "./ReceptionistDashboardClient";
import { getTimeGreeting, formatDate } from "@/lib/utils";

async function getReceptionistData() {
  await connectDB();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [
    todayRegistrations,
    totalPatients,
    pendingInvoices,
    todayRevenueAgg,
    recentInvoices,
    recentPatients,
  ] = await Promise.all([
    PatientModel.countDocuments({ createdAt: { $gte: startOfToday } }),
    PatientModel.countDocuments(),
    // pending / overdue invoices count
    InvoiceModel.countDocuments({ status: { $in: ["pending", "overdue"] } }),
    // compute revenue from payments recorded today
    // the aggregation matches invoices whose status is paid/partial and
    // whose updatedAt timestamp (which changes whenever a payment is logged
    // or the invoice is created with an initial payment) falls on or after
    // the start of the day. this ensures the receptionist dashboard only
    // shows money that actually hit the system today.  partial payments are
    // included at the time they were recorded, and full payments set via the
    // optional "amount paid now" field are also captured.
    InvoiceModel.aggregate([
      { $match: { status: { $in: ["paid", "partial"] }, updatedAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: "$amountPaidKobo" } } },
    ]),
    InvoiceModel.find()
      .populate("patient", "firstName lastName patientId phone")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    PatientModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return {
    stats: {
      todayRegistrations,
      totalPatients,
      pendingInvoices,
      todayRevenue: todayRevenueAgg[0]?.total ?? 0,
    },
    recentInvoices: JSON.parse(JSON.stringify(recentInvoices)),
    recentPatients: JSON.parse(JSON.stringify(recentPatients)),
  };
}

export default async function ReceptionistDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "receptionist") redirect("/receptionist/login");

  const data = await getReceptionistData();
  const greeting = getTimeGreeting();
  const today = formatDate(new Date());
  const firstName = session.user.name.split(" ")[0];
  const userId = session.user.id;

  return (
    <DashboardLayout role="receptionist">
      <ReceptionistDashboardClient
        greeting={greeting}
        today={today}
        firstName={firstName}
        userId={userId}
        stats={data.stats}
        recentInvoices={data.recentInvoices}
        recentPatients={data.recentPatients}
      />
    </DashboardLayout>
  );
}
