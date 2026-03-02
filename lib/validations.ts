// lib/validations.ts – Zod schemas for all server actions
import { z } from "zod";

const phoneRegex = /^(\+234|0)[789]\d{9}$/;

// ─── User / Auth ──────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address").toLowerCase(),
  phone: z.string().regex(phoneRegex, "Enter a valid Nigerian phone number (e.g. 08012345678)"),
  role: z.enum(["doctor", "nurse", "receptionist", "admin"]),
  department: z.string().optional(),
  title: z.string().optional(),
  specialty: z.string().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().regex(phoneRegex).optional(),
  department: z.string().optional(),
  title: z.string().optional(),
  specialty: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── Patient ──────────────────────────────────────────────────────────────────

export const createPatientSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  dob: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date of birth"),
  gender: z.enum(["male", "female", "other"]),
  phone: z.string().regex(phoneRegex, "Enter a valid Nigerian phone number"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(5, "Address is required"),
  state: z.string().min(1, "State is required"),
  lga: z.string().min(1, "LGA is required"),
  bloodGroup: z.string().optional(),
  genotype: z.string().optional(),
  allergies: z.string().optional(), // comma-separated
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().regex(phoneRegex, "Enter a valid emergency contact phone"),
  emergencyContactRelationship: z.string().min(1, "Relationship is required"),
  paymentType: z.enum(["cash", "insurance", "nhis", "company"]),
  insuranceNumber: z.string().optional(),
  nhisNumber: z.string().optional(),
});

// ─── Admission ────────────────────────────────────────────────────────────────

export const createAdmissionSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  admittingDoctorId: z.string().min(1, "Admitting doctor is required"),
  ward: z.string().min(1, "Ward is required"),
  bedNumber: z.string().optional(),
  ailments: z.string().min(3, "Ailments / presenting complaints are required"),
  labTests: z.array(z.string()).optional().default([]),
  nursingNotes: z.string().optional(),
});

export const dischargePatientSchema = z.object({
  admissionId: z.string().min(1),
  dischargeNotes: z.string().optional(),
});

// ─── Vitals ───────────────────────────────────────────────────────────────────

export const createVitalsSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  bloodPressureSystolic: z.coerce.number().min(60).max(300),
  bloodPressureDiastolic: z.coerce.number().min(30).max(200),
  pulse: z.coerce.number().min(20).max(300),
  temperature: z.coerce.number().min(30).max(45),
  spo2: z.coerce.number().min(50).max(100),
  weight: z.coerce.number().min(0).max(500).optional(),
  height: z.coerce.number().min(0).max(300).optional(),
  notes: z.string().optional(),
});

// ─── Diagnosis ────────────────────────────────────────────────────────────────

export const createDiagnosisSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  diagnosisCode: z.string().optional(),
  diagnosis: z.string().min(3, "Diagnosis is required"),
  clinicalNotes: z.string().min(10, "Clinical notes are required"),
  testResults: z.string().optional(),
  prescription: z.string().optional(),
  followUpDate: z.string().optional(),
});

// ─── Lab Request ──────────────────────────────────────────────────────────────

export const createLabRequestSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  testName: z.string().min(1, "Test name is required"),
  priority: z.enum(["routine", "urgent", "stat"]),
});

export const updateLabResultSchema = z.object({
  labRequestId: z.string().min(1),
  results: z.string().min(1, "Results are required"),
  resultNotes: z.string().optional(),
  status: z.enum(["in_progress", "completed"]),
});

// ─── Invoice ──────────────────────────────────────────────────────────────────

export const createInvoiceSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.coerce.number().min(1),
        unitPriceNaira: z.coerce.number().min(0),
      })
    )
    .min(1, "At least one item is required"),
  paymentType: z.enum(["cash", "insurance", "nhis", "company"]),
  notes: z.string().optional(),
});

export const markInvoicePaidSchema = z.object({
  invoiceId: z.string().min(1),
  amountPaidNaira: z.coerce.number().min(0),
});

// ─── Settings ─────────────────────────────────────────────────────────────────

export const updateSettingsSchema = z.object({
  hospitalName: z.string().min(1, "Hospital name is required"),
  hospitalAddress: z.string().min(5, "Address is required"),
  hospitalPhone: z.string().min(7, "Phone is required"),
  hospitalEmail: z.string().email("Valid email required"),
  state: z.string().min(1),
  lga: z.string().min(1),
  rcNumber: z.string().optional(),
  nhisCode: z.string().optional(),
  defaultConsultationFeeNaira: z.coerce.number().min(0),
  admissionFeeNaira: z.coerce.number().min(0),
});
