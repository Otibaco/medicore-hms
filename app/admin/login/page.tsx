import { LoginPage } from "@/components/forms/LoginPage";
import { ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  return (
    <LoginPage
      role="admin"
      label="Admin"
      description="Full system oversight — manage users, view reports, configure access control, and monitor operations."
      accentColor="text-amber-400"
      iconBg="bg-amber-500/15 text-amber-400"
      icon={<ShieldCheck className="w-7 h-7" />}
      demoEmail="r.johnson@medicore.com"
    />
  );
}
