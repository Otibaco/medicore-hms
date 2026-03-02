"use server";
// actions/settings.ts
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import SettingsModel from "@/models/Settings";
import UserModel from "@/models/User";
import { withAuth } from "@/lib/auth-guard";
import { updateSettingsSchema, changePasswordSchema } from "@/lib/validations";
import { nairaToKobo, sanitizeString } from "@/lib/utils";
import { audit } from "@/lib/audit";
import type { ActionResult, ISettings } from "@/types";
import bcrypt from "bcryptjs";

export async function getSettings(): Promise<ActionResult<ISettings>> {
  return withAuth(["admin", "doctor", "nurse", "receptionist"], async () => {
    await connectDB();
    let settings = await SettingsModel.findOne().lean();
    if (!settings) {
      // Return defaults if not set yet
      settings = {
        hospitalName: "MediCore Hospital",
        hospitalAddress: "123 Health Avenue, Lagos",
        hospitalPhone: "08012345678",
        hospitalEmail: "info@medicore.ng",
        state: "Lagos",
        lga: "Ikeja",
        currency: "NGN",
        timezone: "Africa/Lagos",
        defaultConsultationFeeKobo: 500000,
        admissionFeeKobo: 2000000,
        updatedAt: new Date(),
      } as unknown as ISettings;
    }
    return { success: true, message: "Settings fetched", data: settings as unknown as ISettings };
  });
}

export async function updateSettings(formData: FormData): Promise<ActionResult<ISettings>> {
  return withAuth(["admin"], async (currentUser) => {
    const raw = {
      hospitalName: sanitizeString(formData.get("hospitalName") as string),
      hospitalAddress: sanitizeString(formData.get("hospitalAddress") as string),
      hospitalPhone: (formData.get("hospitalPhone") as string)?.trim(),
      hospitalEmail: (formData.get("hospitalEmail") as string)?.trim(),
      state: (formData.get("state") as string)?.trim(),
      lga: sanitizeString((formData.get("lga") as string) ?? ""),
      rcNumber: (formData.get("rcNumber") as string)?.trim() || undefined,
      nhisCode: (formData.get("nhisCode") as string)?.trim() || undefined,
      defaultConsultationFeeNaira: formData.get("defaultConsultationFeeNaira"),
      admissionFeeNaira: formData.get("admissionFeeNaira"),
    };

    const result = updateSettingsSchema.safeParse(raw);
    if (!result.success) {
      return { success: false, message: "Validation failed", errors: result.error.flatten().fieldErrors as Record<string, string[]> };
    }

    await connectDB();

    const { defaultConsultationFeeNaira, admissionFeeNaira, ...rest } = result.data;

    const settings = await SettingsModel.findOneAndUpdate(
      {},
      {
        ...rest,
        defaultConsultationFeeKobo: nairaToKobo(defaultConsultationFeeNaira),
        admissionFeeKobo: nairaToKobo(admissionFeeNaira),
        updatedBy: currentUser.id,
      },
      { upsert: true, new: true }
    );

    await audit({
      actor: currentUser,
      action: "UPDATE_SETTINGS",
      resource: "settings",
    });

    revalidatePath("/settings");
    return { success: true, message: "Settings updated successfully.", data: settings as unknown as ISettings };
  });
}

export async function changePassword(formData: FormData): Promise<ActionResult> {
  return withAuth(["admin", "doctor", "nurse", "receptionist"], async (currentUser) => {
    const raw = {
      currentPassword: formData.get("currentPassword") as string,
      newPassword: formData.get("newPassword") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const result = changePasswordSchema.safeParse(raw);
    if (!result.success) {
      return { success: false, message: "Validation failed", errors: result.error.flatten().fieldErrors as Record<string, string[]> };
    }

    await connectDB();

    const user = await UserModel.findById(currentUser.id).select("+password");
    if (!user) return { success: false, message: "User not found." };

    const isValid = await bcrypt.compare(result.data.currentPassword, user.password);
    if (!isValid) return { success: false, message: "Current password is incorrect." };

    user.password = result.data.newPassword;
    await user.save(); // triggers pre-save hashing

    await audit({ actor: currentUser, action: "CHANGE_PASSWORD", resource: "auth" });

    return { success: true, message: "Password changed successfully." };
  });
}
