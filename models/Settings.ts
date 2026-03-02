// models/Settings.ts – Single-document pattern (only one settings document)
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettingsDocument extends Document {
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalEmail: string;
  hospitalLogo?: string;
  state: string;
  lga: string;
  rcNumber?: string;
  nhisCode?: string;
  currency: string;
  timezone: string;
  defaultConsultationFeeKobo: number;
  admissionFeeKobo: number;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettingsDocument>(
  {
    hospitalName: { type: String, required: true, trim: true },
    hospitalAddress: { type: String, required: true, trim: true },
    hospitalPhone: { type: String, required: true, trim: true },
    hospitalEmail: { type: String, required: true, lowercase: true, trim: true },
    hospitalLogo: { type: String },
    state: { type: String, required: true },
    lga: { type: String, required: true },
    rcNumber: { type: String, trim: true },
    nhisCode: { type: String, trim: true },
    currency: { type: String, default: "NGN" },
    timezone: { type: String, default: "Africa/Lagos" },
    defaultConsultationFeeKobo: { type: Number, default: 500000 }, // ₦5,000
    admissionFeeKobo: { type: Number, default: 2000000 }, // ₦20,000
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const SettingsModel: Model<ISettingsDocument> =
  mongoose.models.Settings ?? mongoose.model<ISettingsDocument>("Settings", SettingsSchema);

export default SettingsModel;
