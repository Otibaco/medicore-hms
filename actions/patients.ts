"use server";
// actions/patients.ts – Patient management
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import PatientModel from "@/models/Patient";
import NotificationModel from "@/models/Notification";
import { withAuth } from "@/lib/auth-guard";
import { createPatientSchema } from "@/lib/validations";
import { generatePatientId, sanitizeString } from "@/lib/utils";
import { audit } from "@/lib/audit";
import type { ActionResult, IPatient } from "@/types";

export async function getPatients(query?: string, status?: string): Promise<ActionResult<IPatient[]>> {
  return withAuth(["admin", "doctor", "nurse", "receptionist"], async () => {
    await connectDB();
    const filter: Record<string, unknown> = {};
    if (status && status !== "all") filter.status = status;
    if (query) {
      filter.$or = [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { patientId: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
      ];
    }
    const patients = await PatientModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("registeredBy", "firstName lastName")
      .lean();
    return { success: true, message: "Patients fetched", data: patients as unknown as IPatient[] };
  });
}

export async function getPatientById(patientId: string): Promise<ActionResult<IPatient>> {
  return withAuth(["admin", "doctor", "nurse", "receptionist"], async () => {
    await connectDB();
    const patient = await PatientModel.findOne({ patientId: patientId.toUpperCase() })
      .populate("registeredBy", "firstName lastName")
      .lean();
    if (!patient) return { success: false, message: "Patient not found." };
    return { success: true, message: "Patient found", data: patient as unknown as IPatient };
  });
}

export async function registerPatient(formData: FormData): Promise<ActionResult<IPatient>> {
  return withAuth(["admin", "receptionist"], async (currentUser) => {
    const raw = {
      firstName: sanitizeString(formData.get("firstName") as string),
      lastName: sanitizeString(formData.get("lastName") as string),
      dob: (formData.get("dob") as string)?.trim(),
      gender: formData.get("gender") as string,
      phone: (formData.get("phone") as string)?.trim(),
      email: (formData.get("email") as string)?.trim() || undefined,
      address: sanitizeString(formData.get("address") as string),
      state: (formData.get("state") as string)?.trim(),
      lga: sanitizeString((formData.get("lga") as string) ?? ""),
      bloodGroup: (formData.get("bloodGroup") as string) || undefined,
      genotype: (formData.get("genotype") as string) || undefined,
      allergies: (formData.get("allergies") as string)?.trim() || undefined,
      emergencyContactName: sanitizeString(formData.get("emergencyContactName") as string),
      emergencyContactPhone: (formData.get("emergencyContactPhone") as string)?.trim(),
      emergencyContactRelationship: sanitizeString(formData.get("emergencyContactRelationship") as string),
      paymentType: formData.get("paymentType") as string,
      insuranceNumber: (formData.get("insuranceNumber") as string)?.trim() || undefined,
      nhisNumber: (formData.get("nhisNumber") as string)?.trim() || undefined,
    };

    const result = createPatientSchema.safeParse(raw);
    if (!result.success) {
      return {
        success: false,
        message: "Validation failed. Please check the form.",
        errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    await connectDB();

    // Generate unique patient ID
    let patientId = generatePatientId();
    while (await PatientModel.exists({ patientId })) {
      patientId = generatePatientId();
    }

    const {
      emergencyContactName, emergencyContactPhone, emergencyContactRelationship,
      allergies, ...rest
    } = result.data;

    const patient = await PatientModel.create({
      ...rest,
      patientId,
      allergies: allergies ? allergies.split(",").map((a) => a.trim()).filter(Boolean) : [],
      emergencyContact: {
        name: emergencyContactName,
        phone: emergencyContactPhone,
        relationship: emergencyContactRelationship,
      },
      registeredBy: currentUser.id,
    });

    // Notify admins
    await NotificationModel.create({
      recipientRole: "admin",
      title: "New Patient Registered",
      message: `${patient.firstName} ${patient.lastName} (${patientId}) has been registered by ${currentUser.name}.`,
      severity: "info",
      category: "admissions",
    });

    await audit({
      actor: currentUser,
      action: "REGISTER_PATIENT",
      resource: "patients",
      resourceId: patient._id.toString(),
      details: { patientId, name: `${patient.firstName} ${patient.lastName}` },
    });

    revalidatePath("/receptionist/patients");
    revalidatePath("/admin/patients");

    return {
      success: true,
      message: `Patient registered successfully. Patient ID: ${patientId}`,
      data: patient as unknown as IPatient,
    };
  });
}

export async function updatePatientStatus(
  patientId: string,
  status: "active" | "admitted" | "discharged" | "deceased"
): Promise<ActionResult> {
  return withAuth(["admin", "doctor", "nurse"], async (currentUser) => {
    await connectDB();
    const patient = await PatientModel.findOneAndUpdate(
      { patientId },
      { status },
      { new: true }
    );
    if (!patient) return { success: false, message: "Patient not found." };

    await audit({
      actor: currentUser,
      action: "UPDATE_PATIENT_STATUS",
      resource: "patients",
      resourceId: patient._id.toString(),
      details: { patientId, status },
    });

    revalidatePath("/admin/patients");
    revalidatePath("/nurse/patients");
    return { success: true, message: `Patient status updated to ${status}.` };
  });
}
