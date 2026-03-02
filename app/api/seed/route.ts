// app/api/seed/route.ts – ONE-TIME SEED ROUTE (disable after first run)
// POST /api/seed with { secret: "SEED_SECRET" }
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import SettingsModel from "@/models/Settings";
import NotificationModel from "@/models/Notification";
import { generateStaffCode } from "@/lib/utils";

const SEED_SECRET = process.env.SEED_SECRET;

export async function POST(req: NextRequest) {
  // Protect the seed endpoint
  if (!SEED_SECRET) {
    return NextResponse.json({ error: "Seeding not configured." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  if (body.secret !== SEED_SECRET) {
    return NextResponse.json({ error: "Invalid seed secret." }, { status: 401 });
  }

  await connectDB();

  // Check if already seeded
  const existingAdmin = await UserModel.findOne({ role: "admin" });
  if (existingAdmin) {
    return NextResponse.json({
      message: "Database already seeded.",
      adminEmail: existingAdmin.email,
    });
  }

  const adminCode = generateStaffCode();

  // Create default admin
  const admin = await UserModel.create({
    staffCode: adminCode,
    firstName: "System",
    lastName: "Administrator",
    email: "admin@medicore.ng",
    phone: "08000000001",
    role: "admin",
    status: "active",
    password: process.env.DEFAULT_ADMIN_PASSWORD ?? "MediCore@2026",
    department: "Administration",
    title: "System Administrator",
  });

  // Create demo doctor
  const doctorCode = generateStaffCode();
  const doctor = await UserModel.create({
    staffCode: doctorCode,
    firstName: "Chukwuemeka",
    lastName: "Okafor",
    email: "doctor@medicore.ng",
    phone: "08000000002",
    role: "doctor",
    status: "active",
    password: "MediCore@2026",
    department: "General Practice",
    title: "Dr.",
    specialty: "General Medicine",
  });

  // Create demo nurse
  const nurseCode = generateStaffCode();
  await UserModel.create({
    staffCode: nurseCode,
    firstName: "Amaka",
    lastName: "Eze",
    email: "nurse@medicore.ng",
    phone: "08000000003",
    role: "nurse",
    status: "active",
    password: "MediCore@2026",
    department: "Nursing",
    title: "RN",
  });

  // Create demo receptionist
  const receptionCode = generateStaffCode();
  await UserModel.create({
    staffCode: receptionCode,
    firstName: "Folake",
    lastName: "Adeleke",
    email: "receptionist@medicore.ng",
    phone: "08000000004",
    role: "receptionist",
    status: "active",
    password: "MediCore@2026",
    department: "Front Desk",
    title: "Ms.",
  });

  // Create hospital settings
  await SettingsModel.findOneAndUpdate(
    {},
    {
      hospitalName: "MediCore General Hospital",
      hospitalAddress: "14 Adeola Odeku Street, Victoria Island",
      hospitalPhone: "01-2345678",
      hospitalEmail: "info@medicore.ng",
      state: "Lagos",
      lga: "Eti-Osa",
      rcNumber: "RC-123456",
      nhisCode: "NHIS-MC-001",
      currency: "NGN",
      timezone: "Africa/Lagos",
      defaultConsultationFeeKobo: 500000, // ₦5,000
      admissionFeeKobo: 2000000, // ₦20,000
      updatedBy: admin._id,
    },
    { upsert: true }
  );

  // Seed a welcome notification for admin
  await NotificationModel.create({
    recipient: admin._id,
    title: "Welcome to MediCore HMS",
    message: "Your hospital management system is set up and ready. Start by adding staff members and registering patients.",
    severity: "success",
    category: "system",
  });

  // Seed notification for doctor
  await NotificationModel.create({
    recipient: doctor._id,
    title: "Welcome, Dr. Okafor",
    message: "Your MediCore account is ready. You can now view your patients and manage diagnoses.",
    severity: "info",
    category: "system",
  });

  return NextResponse.json({
    message: "✅ MediCore database seeded successfully!",
    credentials: {
      admin: { email: "admin@medicore.ng", password: process.env.DEFAULT_ADMIN_PASSWORD ?? "MediCore@2026", staffCode: adminCode },
      doctor: { email: "doctor@medicore.ng", password: "MediCore@2026", staffCode: doctorCode },
      nurse: { email: "nurse@medicore.ng", password: "MediCore@2026", staffCode: nurseCode },
      receptionist: { email: "receptionist@medicore.ng", password: "MediCore@2026", staffCode: receptionCode },
    },
    note: "⚠️ Change all passwords immediately after first login. Delete or protect this endpoint in production.",
  });
}
