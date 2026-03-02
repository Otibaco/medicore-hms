import { LoginPage } from "@/components/forms/LoginPage";
import { Stethoscope } from "lucide-react";

export default function DoctorLoginPage() {
  return (
    <LoginPage
      role="doctor"
      label="Doctor"
      description="Access patient records, record diagnoses, review lab results, and manage your patient caseload."
      accentColor="text-teal-400"
      iconBg="bg-teal-500/15 text-teal-400"
      icon={<Stethoscope className="w-7 h-7" />}
      demoEmail="s.chen@medicore.com"
    />
  );
}
