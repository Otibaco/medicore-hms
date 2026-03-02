// models/Invoice.ts – Monetary values stored in KOBO to avoid float issues
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInvoiceDocument extends Document {
  invoiceId: string;
  patient: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  items: { description: string; quantity: number; unitPriceKobo: number }[];
  totalKobo: number;
  amountPaidKobo: number;
  paymentType: "cash" | "insurance" | "nhis" | "Transfer" |"company";
  status: "pending" | "paid" | "partial" | "overdue";
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema({
  description: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPriceKobo: { type: Number, required: true, min: 0 },
}, { _id: false });

const InvoiceSchema = new Schema<IInvoiceDocument>(
  {
    invoiceId: { type: String, required: true, unique: true, index: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [InvoiceItemSchema],
    totalKobo: { type: Number, required: true, min: 0 },
    amountPaidKobo: { type: Number, default: 0, min: 0 },
    paymentType: { type: String, enum: ["cash","insurance","nhis","transfer","company"], required: true },
    status: { type: String, enum: ["pending","paid","partial","overdue"], default: "pending", index: true },
    paidAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

InvoiceSchema.index({ status: 1, createdAt: -1 });

const InvoiceModel: Model<IInvoiceDocument> =
  mongoose.models.Invoice ?? mongoose.model<IInvoiceDocument>("Invoice", InvoiceSchema);

export default InvoiceModel;
