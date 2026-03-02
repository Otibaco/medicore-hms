"use server";
// actions/users.ts – Staff/User management (Admin only)
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import { withAuth } from "@/lib/auth-guard";
import { createUserSchema, updateUserSchema } from "@/lib/validations";
import { generateStaffCode, sanitizeString } from "@/lib/utils";
import { audit } from "@/lib/audit";
import type { ActionResult, IUser } from "@/types";

export async function getUsers(role?: string): Promise<ActionResult<IUser[]>> {
  return withAuth(["admin"], async () => {
    await connectDB();
    const filter = role ? { role } : {};
    const users = await UserModel.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();
    return {
      success: true,
      message: "Users fetched",
      data: users as unknown as IUser[],
    };
  });
}

export async function getDoctors(): Promise<ActionResult<IUser[]>> {
  return withAuth(["admin", "nurse", "receptionist"], async () => {
    await connectDB();
    const doctors = await UserModel.find({ role: "doctor", status: "active" })
      .select("_id firstName lastName specialty staffCode")
      .lean();
    return { success: true, message: "Doctors fetched", data: doctors as unknown as IUser[] };
  });
}

export async function createUser(formData: FormData): Promise<ActionResult<IUser>> {
  return withAuth(["admin"], async (currentUser) => {
    const raw = {
      firstName: sanitizeString(formData.get("firstName") as string),
      lastName: sanitizeString(formData.get("lastName") as string),
      email: (formData.get("email") as string)?.toLowerCase().trim(),
      phone: (formData.get("phone") as string)?.trim(),
      role: formData.get("role") as string,
      department: sanitizeString((formData.get("department") as string) ?? ""),
      title: sanitizeString((formData.get("title") as string) ?? ""),
      specialty: sanitizeString((formData.get("specialty") as string) ?? ""),
      password: formData.get("password") as string,
    };

    const result = createUserSchema.safeParse(raw);
    if (!result.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    await connectDB();

    const existing = await UserModel.findOne({ email: result.data.email });
    if (existing) {
      return { success: false, message: "A user with this email already exists." };
    }

    let staffCode = generateStaffCode();
    // Ensure uniqueness
    while (await UserModel.exists({ staffCode })) {
      staffCode = generateStaffCode();
    }

    const user = await UserModel.create({
      ...result.data,
      staffCode,
    });

    await audit({
      actor: currentUser,
      action: "CREATE_USER",
      resource: "users",
      resourceId: user._id.toString(),
      details: { email: user.email, role: user.role },
    });

    revalidatePath("/admin/users");

    const safeUser = { ...user.toObject(), password: undefined };
    return {
      success: true,
      message: `Staff account created. Staff code: ${staffCode}`,
      data: safeUser as unknown as IUser,
    };
  });
}

export async function updateUser(userId: string, formData: FormData): Promise<ActionResult<IUser>> {
  return withAuth(["admin"], async (currentUser) => {
    const raw = {
      firstName: sanitizeString((formData.get("firstName") as string) ?? ""),
      lastName: sanitizeString((formData.get("lastName") as string) ?? ""),
      phone: (formData.get("phone") as string)?.trim(),
      department: sanitizeString((formData.get("department") as string) ?? ""),
      title: sanitizeString((formData.get("title") as string) ?? ""),
      specialty: sanitizeString((formData.get("specialty") as string) ?? ""),
      status: formData.get("status") as string,
    };

    const result = updateUserSchema.safeParse(raw);
    if (!result.success) {
      return { success: false, message: "Validation failed", errors: result.error.flatten().fieldErrors as Record<string, string[]> };
    }

    await connectDB();
    const user = await UserModel.findByIdAndUpdate(userId, result.data, { new: true }).select("-password");
    if (!user) return { success: false, message: "User not found." };

    await audit({ actor: currentUser, action: "UPDATE_USER", resource: "users", resourceId: userId });

    revalidatePath("/admin/users");
    return { success: true, message: "User updated successfully.", data: user as unknown as IUser };
  });
}

export async function deactivateUser(userId: string): Promise<ActionResult> {
  return withAuth(["admin"], async (currentUser) => {
    if (userId === currentUser.id) {
      return { success: false, message: "You cannot deactivate your own account." };
    }

    await connectDB();
    const user = await UserModel.findById(userId);
    if (!user) return { success: false, message: "User not found." };
    if (user.role === "admin") return { success: false, message: "Cannot deactivate another admin." };

    await UserModel.findByIdAndUpdate(userId, { status: "inactive" });

    await audit({ actor: currentUser, action: "DEACTIVATE_USER", resource: "users", resourceId: userId });
    revalidatePath("/admin/users");

    return { success: true, message: "User account deactivated." };
  });
}

export async function reactivateUser(userId: string): Promise<ActionResult> {
  return withAuth(["admin"], async (currentUser) => {
    await connectDB();
    await UserModel.findByIdAndUpdate(userId, { status: "active" });
    await audit({ actor: currentUser, action: "REACTIVATE_USER", resource: "users", resourceId: userId });
    revalidatePath("/admin/users");
    return { success: true, message: "User account reactivated." };
  });
}
