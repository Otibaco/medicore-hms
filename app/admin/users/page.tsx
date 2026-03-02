// app/admin/users/page.tsx – Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminUsersClient } from "./AdminUsersClient";

async function getUsers() {
  await connectDB();
  const users = await UserModel.find().select("-password").sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(users));
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login");

  const users = await getUsers();

  return (
    <DashboardLayout role="admin">
      <AdminUsersClient initialUsers={users} currentUserId={session.user.id} />
    </DashboardLayout>
  );
}
