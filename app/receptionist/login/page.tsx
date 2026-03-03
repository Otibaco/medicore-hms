import { LoginPage } from "@/components/forms/LoginPage";
import { UserCheck } from "lucide-react";

export default function ReceptionistLoginPage() {
  return (
    <LoginPage
      role="receptionist"
      label="Receptionist"
      description="Manage patient registrations, invoicing, and front-desk operations from your dedicated portal."
      accentColor="text-blue-400"
      iconBg="bg-blue-500/15 text-blue-400"
      icon={<UserCheck className="w-7 h-7" />}
      demoEmail="linda.t@SalutemRapha.com"
    />
  );
}
