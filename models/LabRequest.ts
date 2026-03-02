// models/LabRequest.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILabRequestDocument extends Document {
  labId: string;
  patient: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  testName: string;
  priority: "routine" | "urgent" | "stat";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  results?: string;
  resultNotes?: string;
  completedBy?: mongoose.Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LabRequestSchema = new Schema<ILabRequestDocument>(
  {
    labId: { type: String, required: true, unique: true, index: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    testName: { type: String, required: true, trim: true },
    priority: { type: String, enum: ["routine", "urgent", "stat"], required: true },
    status: { type: String, enum: ["pending", "in_progress", "completed", "cancelled"], default: "pending", index: true },
    results: { type: String, trim: true },
    resultNotes: { type: String, trim: true },
    completedBy: { type: Schema.Types.ObjectId, ref: "User" },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

LabRequestSchema.index({ status: 1, createdAt: -1 });
LabRequestSchema.index({ patient: 1, createdAt: -1 });

const LabRequestModel: Model<ILabRequestDocument> =
  mongoose.models.LabRequest ?? mongoose.model<ILabRequestDocument>("LabRequest", LabRequestSchema);

export default LabRequestModel;
