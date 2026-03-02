// models/Vitals.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVitalsDocument extends Document {
  patient: mongoose.Types.ObjectId;
  recordedBy: mongoose.Types.ObjectId;
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

const VitalsSchema = new Schema<IVitalsDocument>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bloodPressureSystolic: { type: Number, required: true, min: 60, max: 300 },
    bloodPressureDiastolic: { type: Number, required: true, min: 30, max: 200 },
    pulse: { type: Number, required: true, min: 20, max: 300 },
    temperature: { type: Number, required: true, min: 30, max: 45 },
    spo2: { type: Number, required: true, min: 50, max: 100 },
    weight: { type: Number, min: 0, max: 500 },
    height: { type: Number, min: 0, max: 300 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

VitalsSchema.index({ patient: 1, createdAt: -1 });

const VitalsModel: Model<IVitalsDocument> =
  mongoose.models.Vitals ?? mongoose.model<IVitalsDocument>("Vitals", VitalsSchema);

export default VitalsModel;
