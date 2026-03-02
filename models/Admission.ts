// models/Admission.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdmissionDocument extends Document {
  admissionId: string;
  patient: mongoose.Types.ObjectId;
  admittingDoctor: mongoose.Types.ObjectId;
  ward: string;
  bedNumber?: string;
  ailments: string;
  labTests: string[];
  nursingNotes?: string;
  status: "admitted" | "discharged";
  admittedAt: Date;
  dischargedAt?: Date;
  dischargedBy?: mongoose.Types.ObjectId;
  admittedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AdmissionSchema = new Schema<IAdmissionDocument>(
  {
    admissionId: { type: String, required: true, unique: true, index: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    admittingDoctor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ward: { type: String, required: true, trim: true },
    bedNumber: { type: String, trim: true },
    ailments: { type: String, required: true, trim: true },
    labTests: [{ type: String }],
    nursingNotes: { type: String, trim: true },
    status: { type: String, enum: ["admitted", "discharged"], default: "admitted", index: true },
    admittedAt: { type: Date, default: Date.now },
    dischargedAt: { type: Date },
    dischargedBy: { type: Schema.Types.ObjectId, ref: "User" },
    admittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

AdmissionSchema.index({ status: 1, admittedAt: -1 });

const AdmissionModel: Model<IAdmissionDocument> =
  mongoose.models.Admission ?? mongoose.model<IAdmissionDocument>("Admission", AdmissionSchema);

export default AdmissionModel;
