"use server";
// actions/notifications.ts
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import NotificationModel from "@/models/Notification";
import { withAuth } from "@/lib/auth-guard";
import type { ActionResult, INotification } from "@/types";

export async function getNotifications(category?: string): Promise<ActionResult<INotification[]>> {
  return withAuth(["admin", "doctor", "nurse", "receptionist"], async (currentUser) => {
    await connectDB();
    const filter: Record<string, unknown> = {
      $or: [
        { recipient: currentUser.id },
        { recipientRole: currentUser.role },
        { recipient: null, recipientRole: null }, // broadcast
      ],
    };
    if (category && category !== "all") filter.category = category;

    const notifications = await NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return {
      success: true,
      message: "Notifications fetched",
      data: notifications as unknown as INotification[],
    };
  });
}

export async function getUnreadCount(): Promise<ActionResult<{ count: number }>> {
  return withAuth(["admin", "doctor", "nurse", "receptionist"], async (currentUser) => {
    await connectDB();
    const count = await NotificationModel.countDocuments({
      isRead: false,
      $or: [
        { recipient: currentUser.id },
        { recipientRole: currentUser.role },
      ],
    });
    return { success: true, message: "Count fetched", data: { count } };
  });
}

export async function markAsRead(notificationId: string): Promise<ActionResult> {
  return withAuth(["admin", "doctor", "nurse", "receptionist"], async () => {
    await connectDB();
    await NotificationModel.findByIdAndUpdate(notificationId, { isRead: true });
    revalidatePath("/notifications");
    return { success: true, message: "Marked as read." };
  });
}

export async function markAllAsRead(): Promise<ActionResult> {
  return withAuth(["admin", "doctor", "nurse", "receptionist"], async (currentUser) => {
    await connectDB();
    await NotificationModel.updateMany(
      {
        isRead: false,
        $or: [{ recipient: currentUser.id }, { recipientRole: currentUser.role }],
      },
      { isRead: true }
    );
    revalidatePath("/notifications");
    return { success: true, message: "All notifications marked as read." };
  });
}

export async function dismissNotification(notificationId: string): Promise<ActionResult> {
  return withAuth(["admin", "doctor", "nurse", "receptionist"], async () => {
    await connectDB();
    await NotificationModel.findByIdAndDelete(notificationId);
    revalidatePath("/notifications");
    return { success: true, message: "Notification dismissed." };
  });
}
