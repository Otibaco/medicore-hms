// lib/audit.ts – Audit logging helper
import AuditLogModel from "@/models/AuditLog";
import type { SessionUser } from "@/types";

interface AuditPayload {
  actor: SessionUser;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}

/**
 * Creates an audit log entry non-blockingly.
 * Errors are silently caught to not disrupt the main flow.
 */
export async function audit(payload: AuditPayload): Promise<void> {
  try {
    await AuditLogModel.create({
      actor: payload.actor.id,
      action: payload.action.toUpperCase(),
      resource: payload.resource,
      resourceId: payload.resourceId,
      details: payload.details,
    });
  } catch (err) {
    console.error("[Audit] Failed to write audit log:", err);
  }
}
