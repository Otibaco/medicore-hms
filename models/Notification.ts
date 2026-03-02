// models/Notification.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotificationDocument extends Document {
  recipient?: mongoose.Types.ObjectId; // null = broadcast
  recipientRole?: string; // role broadcast
  title: string;
  message: string;
  severity: "info" | "warning" | "success" | "critical";
  category: "clinical" | "admissions" | "finance" | "scheduling" | "pharmacy" | "system" | "reports";
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", index: true },
    recipientRole: { type: String, enum: ["admin","doctor","nurse","receptionist"] },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    severity: { type: String, enum: ["info","warning","success","critical"], default: "info" },
    category: {
      type: String,
      enum: ["clinical","admissions","finance","scheduling","pharmacy","system","reports"],
      required: true,
    },
    isRead: { type: Boolean, default: false, index: true },
    actionUrl: { type: String },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipientRole: 1, isRead: 1, createdAt: -1 });

const NotificationModel: Model<INotificationDocument> =
  mongoose.models.Notification ?? mongoose.model<INotificationDocument>("Notification", NotificationSchema);

export default NotificationModel;
