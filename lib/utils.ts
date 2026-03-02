// lib/utils.ts – Utilities and helpers
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── ID Generation ───────────────────────────────────────────────────────────

export function generatePatientId(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const nums = Math.floor(100 + Math.random() * 900).toString();
  return `${l1}${l2}${nums}`;
}

export function generateStaffCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export function generateInvoiceId(): string {
  const ts = Date.now().toString().slice(-6);
  return `INV-${ts}`;
}

export function generateAdmissionId(): string {
  const ts = Date.now().toString().slice(-5);
  return `ADM-${ts}`;
}

export function generateLabId(): string {
  const ts = Date.now().toString().slice(-5);
  return `LAB-${ts}`;
}

// ─── Nigerian Naira Currency ──────────────────────────────────────────────────
// Amounts stored in KOBO (1 Naira = 100 Kobo) to avoid floating point issues

export function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(naira);
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

// Legacy alias kept for any existing usages
export function formatCurrency(kobo: number): string {
  return formatNaira(kobo);
}

// ─── Date Utilities ──────────────────────────────────────────────────────────

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(date));
}

export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function calculateAge(dob: Date | string): number {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Sanitization ────────────────────────────────────────────────────────────

export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .slice(0, 5000);
}

// ─── Nigerian States ─────────────────────────────────────────────────────────

export const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa",
  "Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti",
  "Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina",
  "Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun",
  "Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
] as const;

export const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"] as const;
export const GENOTYPES = ["AA","AS","SS","AC","SC"] as const;

export const WARDS = [
  "General Ward A","General Ward B","Private Ward","ICU",
  "Maternity Ward","Pediatric Ward","Surgical Ward",
  "Psychiatric Ward","Emergency Ward",
] as const;

export const LAB_TESTS = [
  "Full Blood Count (FBC)","Basic Metabolic Panel (BMP)",
  "Comprehensive Metabolic Panel (CMP)","Lipid Panel",
  "Thyroid Function Test (TFT)","Urinalysis",
  "Fasting Blood Glucose (FBG)","HbA1c",
  "Liver Function Test (LFT)","Kidney Function Test (KFT)",
  "Malaria Parasite (MP)","Widal Test","HIV Screening",
  "Hepatitis B Surface Antigen","Chest X-Ray","ECG",
  "Abdominal Ultrasound","Echocardiogram","CT Scan","MRI",
  "Coagulation Studies (PT/PTT)","Blood Culture",
  "Stool Analysis","Sputum Microscopy",
] as const;
