// models/User.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUserDocument extends Document {
  staffCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "admin" | "doctor" | "nurse" | "receptionist";
  status: "active" | "inactive";
  password: string;
  department?: string;
  title?: string;
  specialty?: string;
  twoFactorEnabled: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  fullName: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    staffCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    firstName: { type: String, required: true, trim: true, maxlength: 100 },
    lastName: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String, required: true, unique: true, lowercase: true, trim: true, index: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    phone: { type: String, required: true, trim: true },
    role: { type: String, enum: ["admin", "doctor", "nurse", "receptionist"], required: true, index: true },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    password: { type: String, required: true, select: false, minlength: 8 },
    department: { type: String, trim: true },
    title: { type: String, trim: true },
    specialty: { type: String, trim: true },
    twoFactorEnabled: { type: Boolean, default: false },
    lastLogin: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

UserSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) { next(err as Error); }
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.index({ role: 1, status: 1 });

const UserModel: Model<IUserDocument> =
  mongoose.models.User ?? mongoose.model<IUserDocument>("User", UserSchema);

export default UserModel;
