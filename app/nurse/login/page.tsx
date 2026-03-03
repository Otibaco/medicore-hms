import { LoginPage } from "@/components/forms/LoginPage";
import { ClipboardList } from "lucide-react";

export default function NurseLoginPage() {
  return (
    <LoginPage
      role="nurse"
      label="Nurse"
      description="Coordinate patient admissions, manage care plans, and collaborate with the clinical team."
      accentColor="text-violet-400"
      iconBg="bg-violet-500/15 text-violet-400"
      icon={<ClipboardList className="w-7 h-7" />}
      demoEmail="m.davis@SalutemRapha.com"
    />
  );
}
