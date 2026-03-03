"use server";
// actions/admissions.ts
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import AdmissionModel from "@/models/Admission";
import PatientModel from "@/models/Patient";
import NotificationModel from "@/models/Notification";
import { withAuth } from "@/lib/auth-guard";
import { createAdmissionSchema, dischargePatientSchema } from "@/lib/validations";
import { generateAdmissionId } from "@/lib/utils";
import { audit } from "@/lib/audit";
import { ActionResult, IAdmission } from "@/types";

export async function getAdmissions(status?: string): Promise<ActionResult<IAdmission[]>> {
  return withAuth(["admin", "doctor", "nurse"], async () => {
    await connectDB();
    const filter = status && status !== "all" ? { status } : {};
    const admissions = await AdmissionModel.find(filter)
      .populate("patient", "firstName lastName patientId gender phone")
      .populate("admittingDoctor", "firstName lastName specialty")
      .populate("admittedBy", "firstName lastName role")
      .sort({ admittedAt: -1 })
      .limit(200)
      .lean();
    return { success: true, message: "Admissions fetched", data: admissions as unknown as IAdmission[] };
  });
}

export async function admitPatient(formData: FormData): Promise<ActionResult<IAdmission>> {
  return withAuth(["admin", "nurse"], async (currentUser) => {
    const raw = {
      patientId: (formData.get("patientId") as string)?.trim().toUpperCase(),
      admittingDoctorId: formData.get("admittingDoctorId") as string,
      ward: formData.get("ward") as string,
      bedNumber: (formData.get("bedNumber") as string) || undefined,
      ailments: (formData.get("ailments") as string)?.trim(),
      labTests: formData.getAll("labTests") as string[],
      nursingNotes: (formData.get("nursingNotes") as string)?.trim() || undefined,
    };

    const result = createAdmissionSchema.safeParse(raw);
    if (!result.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    await connectDB();

    const patient = await PatientModel.findOne({ patientId: result.data.patientId });
    if (!patient) return { success: false, message: "Patient not found. Please check the Patient ID." };
    if (patient.status === "admitted") {
      return { success: false, message: "This patient is already admitted." };
    }

    const admissionId = generateAdmissionId();

    const admission = await AdmissionModel.create({
      admissionId,
      patient: patient._id,
      admittingDoctor: result.data.admittingDoctorId,
      ward: result.data.ward,
      bedNumber: result.data.bedNumber,
      ailments: result.data.ailments,
      labTests: result.data.labTests,
      nursingNotes: result.data.nursingNotes,
      admittedBy: currentUser.id,
    });

    // Update patient status
    await PatientModel.findByIdAndUpdate(patient._id, { status: "admitted" });

    // Notify the admitting doctor
    await NotificationModel.create({
      recipient: result.data.admittingDoctorId,
      title: "New Patient Admitted",
      message: `${patient.firstName} ${patient.lastName} (${patient.patientId}) has been admitted to ${result.data.ward}. Presenting: ${result.data.ailments}`,
      severity: "info",
      category: "admissions",
      actionUrl: `/doctor/patients`,
    });

    await audit({
      actor: currentUser,
      action: "ADMIT_PATIENT",
      resource: "admissions",
      resourceId: admission._id.toString(),
      details: { admissionId, patientId: result.data.patientId, ward: result.data.ward },
    });

    revalidatePath("/nurse/admissions");
    revalidatePath("/admin/admissions");

    return {
      success: true,
      message: `Patient admitted successfully. Admission ID: ${admissionId}`,
      data: admission as unknown as IAdmission,
    };
  });
}

export async function dischargePatient(formData: FormData): Promise<ActionResult> {
  return withAuth(["admin", "doctor", "nurse"], async (currentUser) => {
    const raw = {
      admissionId: formData.get("admissionId") as string,
      dischargeNotes: (formData.get("dischargeNotes") as string)?.trim() || undefined,
    };

    const result = dischargePatientSchema.safeParse(raw);
    if (!result.success) {
      return { success: false, message: "Invalid data." };
    }

    await connectDB();

    const admission = await AdmissionModel.findOne({ admissionId: result.data.admissionId });
    if (!admission) return { success: false, message: "Admission record not found." };
    if (admission.status === "discharged") return { success: false, message: "Patient already discharged." };

    await AdmissionModel.findByIdAndUpdate(admission._id, {
      status: "discharged",
      dischargedAt: new Date(),
      dischargedBy: currentUser.id,
    });

    await PatientModel.findByIdAndUpdate(admission.patient, { status: "discharged" });

    await audit({
      actor: currentUser,
      action: "DISCHARGE_PATIENT",
      resource: "admissions",
      resourceId: admission._id.toString(),
      details: { admissionId: result.data.admissionId },
    });

    revalidatePath("/nurse/admissions");
    revalidatePath("/admin/admissions");
    revalidatePath("/doctor/patients");

    return { success: true, message: "Patient discharged successfully." };
  });
}
