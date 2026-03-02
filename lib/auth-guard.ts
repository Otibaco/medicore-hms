// lib/auth-guard.ts – Server-side role enforcement for Server Actions
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Role, SessionUser } from "@/types";
import type { ActionResult } from "@/types";

/**
 * Retrieves the current session user in a Server Action.
 * Throws an unauthenticated result if no session is found.
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new AuthError("You must be logged in to perform this action.");
  }
  if (session.user.status !== "active") {
    throw new AuthError("Your account has been deactivated.");
  }
  return session.user as SessionUser;
}

/**
 * Requires the current user to have one of the specified roles.
 */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new AuthError(
      `Access denied. This action requires one of these roles: ${roles.join(", ")}.`
    );
  }
  return user;
}

/**
 * Wraps a server action with auth + role check.
 * Returns a typed ActionResult on error instead of throwing.
 */
export async function withAuth<T>(
  roles: Role[],
  fn: (user: SessionUser) => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  try {
    const user = await requireRole(...roles);
    return await fn(user);
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, message: err.message };
    }
    console.error("[ServerAction Error]", err);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/** RBAC permission matrix */
export const PERMISSIONS = {
  // Patient management
  REGISTER_PATIENT: ["admin", "receptionist"] as Role[],
  VIEW_PATIENTS: ["admin", "doctor", "nurse", "receptionist"] as Role[],
  EDIT_PATIENT: ["admin", "receptionist"] as Role[],

  // Clinical
  ADMIT_PATIENT: ["admin", "nurse"] as Role[],
  DISCHARGE_PATIENT: ["admin", "doctor", "nurse"] as Role[],
  RECORD_VITALS: ["admin", "doctor", "nurse"] as Role[],
  CREATE_DIAGNOSIS: ["admin", "doctor"] as Role[],
  REQUEST_LAB: ["admin", "doctor", "nurse"] as Role[],
  REVIEW_LAB: ["admin", "doctor"] as Role[],

  // Finance
  CREATE_INVOICE: ["admin", "receptionist"] as Role[],
  UPDATE_INVOICE: ["admin", "receptionist"] as Role[],
  VIEW_FINANCIAL_REPORTS: ["admin"] as Role[],

  // Admin
  MANAGE_USERS: ["admin"] as Role[],
  MANAGE_SETTINGS: ["admin"] as Role[],
  VIEW_AUDIT_LOGS: ["admin"] as Role[],
} as const;

export function hasPermission(role: Role, permission: keyof typeof PERMISSIONS): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
