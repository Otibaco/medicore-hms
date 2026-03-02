// models/Diagnosis.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDiagnosisDocument extends Document {
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  diagnosisCode?: string;
  diagnosis: string;
  clinicalNotes: string;
  testResults?: string;
  prescription?: string;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DiagnosisSchema = new Schema<IDiagnosisDocument>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    doctor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    diagnosisCode: { type: String, trim: true, uppercase: true },
    diagnosis: { type: String, required: true, trim: true },
    clinicalNotes: { type: String, required: true, trim: true },
    testResults: { type: String, trim: true },
    prescription: { type: String, trim: true },
    followUpDate: { type: Date },
  },
  { timestamps: true }
);

DiagnosisSchema.index({ patient: 1, createdAt: -1 });
DiagnosisSchema.index({ doctor: 1, createdAt: -1 });

const DiagnosisModel: Model<IDiagnosisDocument> =
  mongoose.models.Diagnosis ?? mongoose.model<IDiagnosisDocument>("Diagnosis", DiagnosisSchema);

export default DiagnosisModel;
