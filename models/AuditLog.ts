// models/AuditLog.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLogDocument extends Document {
  actor: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true, uppercase: true, index: true },
    resource: { type: String, required: true, index: true },
    resourceId: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

// TTL index – auto-delete logs after 2 years
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });
AuditLogSchema.index({ actor: 1, createdAt: -1 });

const AuditLogModel: Model<IAuditLogDocument> =
  mongoose.models.AuditLog ?? mongoose.model<IAuditLogDocument>("AuditLog", AuditLogSchema);

export default AuditLogModel;
