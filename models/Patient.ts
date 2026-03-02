// models/Patient.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPatientDocument extends Document {
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
  allergies: string[];
  emergencyContact: { name: string; phone: string; relationship: string };
  paymentType: "cash" | "insurance" | "nhis" | "company";
  insuranceNumber?: string;
  nhisNumber?: string;
  status: "active" | "admitted" | "discharged" | "deceased";
  registeredBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  fullName: string;
}

const PatientSchema = new Schema<IPatientDocument>(
  {
    patientId: { type: String, required: true, unique: true, uppercase: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    lga: { type: String, required: true, trim: true },
    bloodGroup: { type: String, enum: ["A+","A-","B+","B-","AB+","AB-","O+","O-","Unknown"] },
    genotype: { type: String, enum: ["AA","AS","SS","AC","SC","Unknown"] },
    allergies: [{ type: String }],
    emergencyContact: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      relationship: { type: String, required: true, trim: true },
    },
    paymentType: { type: String, enum: ["cash","insurance","nhis","transfer","company"], required: true },
    insuranceNumber: { type: String, trim: true },
    nhisNumber: { type: String, trim: true },
    status: { type: String, enum: ["active","admitted","discharged","deceased"], default: "active", index: true },
    registeredBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

PatientSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

PatientSchema.index({ lastName: 1, firstName: 1 });
PatientSchema.index({ phone: 1 });
PatientSchema.index({ status: 1, createdAt: -1 });

// Full text search
PatientSchema.index({ firstName: "text", lastName: "text", patientId: "text", phone: "text" });

const PatientModel: Model<IPatientDocument> =
  mongoose.models.Patient ?? mongoose.model<IPatientDocument>("Patient", PatientSchema);

export default PatientModel;
