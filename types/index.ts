// ─────────────────────────────────────────────
//  SalutemRapha HMS – Shared Types
// ─────────────────────────────────────────────

export type Role = "admin" | "doctor" | "nurse" | "receptionist";

export type UserStatus = "active" | "inactive";
export type PatientStatus = "active" | "admitted" | "discharged" | "deceased";
export type AdmissionStatus = "admitted" | "discharged";
export type LabStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type InvoiceStatus = "pending" | "paid" | "partial" | "overdue";
export type PaymentType = "cash" | "insurance" | "nhis" | "company";
export type NotificationSeverity = "info" | "warning" | "success" | "critical";
export type NotificationCategory =
  | "clinical"
  | "admissions"
  | "finance"
  | "scheduling"
  | "pharmacy"
  | "system"
  | "reports";

// ─── Auth ────────────────────────────────────
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  staffCode: string;
  status: UserStatus;
}

// ─── User / Staff ────────────────────────────
export interface IUser {
  _id: string;
  staffCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  department?: string;
  title?: string;
  specialty?: string; // for doctors
  twoFactorEnabled: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Patient ─────────────────────────────────
export interface IPatient {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  dob: Date;
  gender: "male" | "female" | "other";
  phone: string;
  email?: string;
  address: string;
  state: string;
  lga: string;
  bloodGroup?: string;
  genotype?: string;
  allergies?: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  paymentType: PaymentType;
  insuranceNumber?: string;
  nhisNumber?: string;
  status: PatientStatus;
  registeredBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Admission ───────────────────────────────
export interface IAdmission {
  _id: string;
  admissionId: string;
  patient: string | IPatient;
  admittingDoctor: string | IUser;
  ward: string;
  bedNumber?: string;
  ailments: string;
  labTests: string[];
  nursingNotes?: string;
  status: AdmissionStatus;
  admittedAt: Date;
  dischargedAt?: Date;
  dischargedBy?: string | IUser;
  admittedBy: string | IUser;
  createdAt: Date;
}

// ─── Vitals ──────────────────────────────────
export interface IVitals {
  _id: string;
  patient: string | IPatient;
  recordedBy: string | IUser;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  pulse: number;
  temperature: number;
  spo2: number;
  weight?: number;
  height?: number;
  notes?: string;
  createdAt: Date;
}

// ─── Diagnosis ───────────────────────────────
export interface IDiagnosis {
  _id: string;
  patient: string | IPatient;
  doctor: string | IUser;
  diagnosisCode?: string;
  diagnosis: string;
  clinicalNotes: string;
  testResults?: string;
  prescription?: string;
  followUpDate?: Date;
  createdAt: Date;
}

// ─── Lab Request ─────────────────────────────
export interface ILabRequest {
  _id: string;
  labId: string;
  patient: string | IPatient;
  requestedBy: string | IUser;
  testName: string;
  priority: "routine" | "urgent" | "stat";
  status: LabStatus;
  results?: string;
  resultNotes?: string;
  completedBy?: string | IUser;
  completedAt?: Date;
  createdAt: Date;
}

// ─── Invoice ─────────────────────────────────
export interface IInvoice {
  _id: string;
  invoiceId: string;
  patient: string | IPatient;
  createdBy: string | IUser;
  items: {
    description: string;
    quantity: number;
    unitPriceKobo: number; // stored in kobo to avoid float issues
  }[];
  totalKobo: number;
  amountPaidKobo: number;
  paymentType: PaymentType;
  status: InvoiceStatus;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Notification ────────────────────────────
export interface INotification {
  _id: string;
  recipient: string | IUser; // null = broadcast
  recipientRole?: Role; // role-based broadcast
  title: string;
  message: string;
  severity: NotificationSeverity;
  category: NotificationCategory;
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}

// ─── System Settings ─────────────────────────
export interface ISettings {
  _id: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalEmail: string;
  hospitalLogo?: string;
  state: string;
  lga: string;
  rcNumber?: string;
  nhisCode?: string;
  currency: string; // "NGN"
  timezone: string; // "Africa/Lagos"
  defaultConsultationFeeKobo: number;
  admissionFeeKobo: number;
  updatedBy: string;
  updatedAt: Date;
}

// ─── Audit Log ───────────────────────────────
export interface IAuditLog {
  _id: string;
  actor: string | IUser;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// ─── Server Action Responses ─────────────────
export interface ActionResult<T = null> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}
