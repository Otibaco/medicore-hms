// app/settings/page.tsx – Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import SettingsModel from "@/models/Settings";
import UserModel from "@/models/User";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SettingsClient } from "./SettingsClient";

async function getData(userId: string) {
  await connectDB();
  const [settings, user] = await Promise.all([
    SettingsModel.findOne().lean(),
    UserModel.findById(userId).select("-password").lean(),
  ]);
  return {
    settings: settings ? JSON.parse(JSON.stringify(settings)) : null,
    user: user ? JSON.parse(JSON.stringify(user)) : null,
  };
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const data = await getData(session.user.id);

  return (
    <DashboardLayout role={session.user.role}>
      <SettingsClient
        currentUser={data.user}
        settings={data.settings}
        userRole={session.user.role}
      />
    </DashboardLayout>
  );
}
