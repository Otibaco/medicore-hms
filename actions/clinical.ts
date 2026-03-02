"use server";
// actions/clinical.ts – Vitals, Diagnoses, Lab Requests
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import VitalsModel from "@/models/Vitals";
import DiagnosisModel from "@/models/Diagnosis";
import LabRequestModel from "@/models/LabRequest";
import PatientModel from "@/models/Patient";
import NotificationModel from "@/models/Notification";
import { withAuth } from "@/lib/auth-guard";
import {
  createVitalsSchema,
  createDiagnosisSchema,
  createLabRequestSchema,
  updateLabResultSchema,
} from "@/lib/validations";
import { generateLabId } from "@/lib/utils";
import { audit } from "@/lib/audit";
import type { ActionResult, IVitals, IDiagnosis, ILabRequest } from "@/types";

// ─── Vitals ───────────────────────────────────────────────────────────────────

export async function getVitals(patientMongoId: string): Promise<ActionResult<IVitals[]>> {
  return withAuth(["admin", "doctor", "nurse"], async () => {
    await connectDB();
    const vitals = await VitalsModel.find({ patient: patientMongoId })
      .populate("recordedBy", "firstName lastName role")
      .sort({ createdAt: -1 })
      .lean();
    return { success: true, message: "Vitals fetched", data: vitals as unknown as IVitals[] };
  });
}

export async function getRecentVitals(): Promise<ActionResult<IVitals[]>> {
  return withAuth(["admin", "doctor", "nurse"], async () => {
    await connectDB();
    const vitals = await VitalsModel.find()
      .populate("patient", "firstName lastName patientId")
      .populate("recordedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return { success: true, message: "Recent vitals fetched", data: vitals as unknown as IVitals[] };
  });
}

export async function recordVitals(formData: FormData): Promise<ActionResult<IVitals>> {
  return withAuth(["admin", "doctor", "nurse"], async (currentUser) => {
    const raw = {
      patientId: formData.get("patientId") as string,
      bloodPressureSystolic: formData.get("bloodPressureSystolic"),
      bloodPressureDiastolic: formData.get("bloodPressureDiastolic"),
      pulse: formData.get("pulse"),
      temperature: formData.get("temperature"),
      spo2: formData.get("spo2"),
      weight: formData.get("weight") || undefined,
      height: formData.get("height") || undefined,
      notes: (formData.get("notes") as string)?.trim() || undefined,
    };

    const result = createVitalsSchema.safeParse(raw);
    if (!result.success) {
      return { success: false, message: "Validation failed", errors: result.error.flatten().fieldErrors as Record<string, string[]> };
    }

    await connectDB();

    const patient = await PatientModel.findById(result.data.patientId).catch(() => null)
      || await PatientModel.findOne({ patientId: result.data.patientId.toUpperCase() });
    if (!patient) return { success: false, message: "Patient not found." };

    const { patientId: _pid, ...vitalsData } = result.data;

    // Critical SpO2 alert
    if (result.data.spo2 < 90) {
      await NotificationModel.create({
        recipientRole: "doctor",
        title: "⚠️ Critical SpO2 Alert",
        message: `${patient.firstName} ${patient.lastName} (${patient.patientId}) has SpO2 of ${result.data.spo2}% – immediate attention required.`,
        severity: "critical",
        category: "clinical",
        actionUrl: `/doctor/patients`,
      });
    }

    const vitals = await VitalsModel.create({
      ...vitalsData,
      patient: patient._id,
      recordedBy: currentUser.id,
    });

    await audit({
      actor: currentUser,
      action: "RECORD_VITALS",
      resource: "vitals",
      resourceId: vitals._id.toString(),
      details: { patientId: patient.patientId, spo2: result.data.spo2 },
    });

    revalidatePath("/doctor/vitals");
    revalidatePath("/doctor/patients");
    revalidatePath("/nurse/patients");

    return { success: true, message: "Vitals recorded successfully.", data: vitals as unknown as IVitals };
  });
}

// ─── Diagnosis ────────────────────────────────────────────────────────────────

export async function getDiagnoses(patientMongoId?: string): Promise<ActionResult<IDiagnosis[]>> {
  return withAuth(["admin", "doctor", "nurse"], async (currentUser) => {
    await connectDB();
    const filter: Record<string, unknown> = {};
    if (patientMongoId) filter.patient = patientMongoId;
    if (currentUser.role === "doctor") filter.doctor = currentUser.id;

    const diagnoses = await DiagnosisModel.find(filter)
      .populate("patient", "firstName lastName patientId gender")
      .populate("doctor", "firstName lastName specialty")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return { success: true, message: "Diagnoses fetched", data: diagnoses as unknown as IDiagnosis[] };
  });
}

export async function createDiagnosis(formData: FormData): Promise<ActionResult<IDiagnosis>> {
  return withAuth(["admin", "doctor"], async (currentUser) => {
    const raw = {
      patientId: formData.get("patientId") as string,
      diagnosisCode: (formData.get("diagnosisCode") as string)?.trim() || undefined,
      diagnosis: (formData.get("diagnosis") as string)?.trim(),
      clinicalNotes: (formData.get("clinicalNotes") as string)?.trim(),
      testResults: (formData.get("testResults") as string)?.trim() || undefined,
      prescription: (formData.get("prescription") as string)?.trim() || undefined,
      followUpDate: (formData.get("followUpDate") as string)?.trim() || undefined,
    };

    const result = createDiagnosisSchema.safeParse(raw);
    if (!result.success) {
      return { success: false, message: "Validation failed", errors: result.error.flatten().fieldErrors as Record<string, string[]> };
    }

    await connectDB();

    const patient = await PatientModel.findById(result.data.patientId).catch(() => null)
      || await PatientModel.findOne({ patientId: result.data.patientId.toUpperCase() });
    if (!patient) return { success: false, message: "Patient not found." };

    const { patientId: _pid, ...diagData } = result.data;

    const diagnosis = await DiagnosisModel.create({
      ...diagData,
      patient: patient._id,
      doctor: currentUser.id,
      followUpDate: diagData.followUpDate ? new Date(diagData.followUpDate) : undefined,
    });

    await audit({
      actor: currentUser,
      action: "CREATE_DIAGNOSIS",
      resource: "diagnoses",
      resourceId: diagnosis._id.toString(),
      details: { patientId: patient.patientId, diagnosis: result.data.diagnosis },
    });

    revalidatePath("/doctor/diagnoses");
    revalidatePath("/doctor/patients");

    return { success: true, message: "Diagnosis recorded successfully.", data: diagnosis as unknown as IDiagnosis };
  });
}

// ─── Lab Requests ─────────────────────────────────────────────────────────────

export async function getLabRequests(status?: string): Promise<ActionResult<ILabRequest[]>> {
  return withAuth(["admin", "doctor", "nurse"], async (currentUser) => {
    await connectDB();
    const filter: Record<string, unknown> = {};
    if (status && status !== "all") filter.status = status;
    if (currentUser.role === "nurse") filter.requestedBy = currentUser.id;

    const labs = await LabRequestModel.find(filter)
      .populate("patient", "firstName lastName patientId")
      .populate("requestedBy", "firstName lastName role")
      .populate("completedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return { success: true, message: "Lab requests fetched", data: labs as unknown as ILabRequest[] };
  });
}

export async function createLabRequest(formData: FormData): Promise<ActionResult<ILabRequest>> {
  return withAuth(["admin", "doctor", "nurse"], async (currentUser) => {
    const raw = {
      patientId: formData.get("patientId") as string,
      testName: formData.get("testName") as string,
      priority: formData.get("priority") as string,
    };

    const result = createLabRequestSchema.safeParse(raw);
    if (!result.success) {
      return { success: false, message: "Validation failed", errors: result.error.flatten().fieldErrors as Record<string, string[]> };
    }

    await connectDB();

    const patient = await PatientModel.findById(result.data.patientId).catch(() => null)
      || await PatientModel.findOne({ patientId: result.data.patientId.toUpperCase() });
    if (!patient) return { success: false, message: "Patient not found." };

    const labId = generateLabId();

    const labRequest = await LabRequestModel.create({
      labId,
      patient: patient._id,
      requestedBy: currentUser.id,
      testName: result.data.testName,
      priority: result.data.priority,
    });

    if (result.data.priority === "stat") {
      await NotificationModel.create({
        recipientRole: "admin",
        title: "🔴 STAT Lab Request",
        message: `STAT ${result.data.testName} for ${patient.firstName} ${patient.lastName} (${patient.patientId}).`,
        severity: "critical",
        category: "clinical",
      });
    }

    await audit({
      actor: currentUser,
      action: "REQUEST_LAB",
      resource: "lab_requests",
      resourceId: labRequest._id.toString(),
      details: { labId, testName: result.data.testName, priority: result.data.priority },
    });

    revalidatePath("/nurse/labs");
    revalidatePath("/doctor/labs");

    return { success: true, message: `Lab request ${labId} created.`, data: labRequest as unknown as ILabRequest };
  });
}

export async function updateLabResult(formData: FormData): Promise<ActionResult<ILabRequest>> {
  return withAuth(["admin", "doctor"], async (currentUser) => {
    const raw = {
      labRequestId: formData.get("labRequestId") as string,
      results: (formData.get("results") as string)?.trim(),
      resultNotes: (formData.get("resultNotes") as string)?.trim() || undefined,
      status: formData.get("status") as string,
    };

    const result = updateLabResultSchema.safeParse(raw);
    if (!result.success) {
      return { success: false, message: "Validation failed", errors: result.error.flatten().fieldErrors as Record<string, string[]> };
    }

    await connectDB();

    const labRequest = await LabRequestModel.findByIdAndUpdate(
      result.data.labRequestId,
      {
        results: result.data.results,
        resultNotes: result.data.resultNotes,
        status: result.data.status,
        completedBy: result.data.status === "completed" ? currentUser.id : undefined,
        completedAt: result.data.status === "completed" ? new Date() : undefined,
      },
      { new: true }
    );

    if (!labRequest) return { success: false, message: "Lab request not found." };

    await audit({
      actor: currentUser,
      action: "UPDATE_LAB_RESULT",
      resource: "lab_requests",
      resourceId: result.data.labRequestId,
    });

    revalidatePath("/doctor/labs");
    revalidatePath("/nurse/labs");

    return { success: true, message: "Lab results updated.", data: labRequest as unknown as ILabRequest };
  });
}
