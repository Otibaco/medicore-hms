// app/notifications/page.tsx – Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import NotificationModel from "@/models/Notification";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NotificationsClient } from "./NotificationsClient";

async function getNotifications(userId: string, role: string) {
  await connectDB();
  const notifications = await NotificationModel.find({
    $or: [
      { recipient: userId },
      { recipientRole: role },
    ],
  }).sort({ createdAt: -1 }).limit(60).lean();
  return JSON.parse(JSON.stringify(notifications));
}

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const notifications = await getNotifications(session.user.id, session.user.role);

  return (
    <DashboardLayout role={session.user.role}>
      <NotificationsClient initialNotifications={notifications} />
    </DashboardLayout>
  );
}
