"use client";
// components/forms/LoginPage.tsx – Real NextAuth login
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Heart, ArrowLeft, Eye, EyeOff, LogIn, Lock, Mail } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

interface LoginPageProps {
  role: "receptionist" | "nurse" | "doctor" | "admin";
  label: string;
  description: string;
  accentColor: string;
  iconBg: string;
  icon: React.ReactNode;
  demoEmail: string;
  demoPassword?: string;
}

export function LoginPage({
  role,
  label,
  description,
  iconBg,
  icon,
  demoEmail,
  demoPassword = "SalutemRapha@2026",
}: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Missing credentials", { description: "Please enter your email and password." });
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Sign in failed", {
          description: result.error === "CredentialsSignin"
            ? "Invalid email or password."
            : result.error,
        });
        setLoading(false);
        return;
      }

      if (result?.ok) {
        toast.success("Welcome back!", {
          description: `Signed in as ${label}. Redirecting to your dashboard...`,
        });
        router.push(`/${role}/dashboard`);
        router.refresh();
      }
    } catch {
      toast.error("An error occurred", { description: "Please try again." });
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    toast.info("Demo credentials filled", { description: "Click Sign In to continue." });
  };

  return (
    <div className="min-h-screen bg-midnight flex relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 opacity-10 blur-3xl rounded-full" style={{ background: "radial-gradient(circle, rgba(20,184,166,0.4) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 opacity-8 blur-3xl rounded-full" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `linear-gradient(rgba(20,184,166,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.5) 1px, transparent 1px)`, backgroundSize: "50px 50px" }} />
      </div>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-surface border-r border-border relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-teal-500/5 blur-2xl" />
          <div className="absolute bottom-1/3 right-1/4 w-36 h-36 rounded-full bg-amber-500/5 blur-2xl" />
        </div>
        <div className="relative flex-1 flex flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-serif text-xl font-bold text-slate-100">SalutemRapha</p>
              <p className="text-[9px] text-teal-500/70 tracking-[0.3em] uppercase">Hospital Management</p>
            </div>
          </Link>
          <div className="my-auto">
            <div className={`w-20 h-20 rounded-3xl ${iconBg} flex items-center justify-center mb-8 shadow-xl`}>
              <div className="scale-150">{icon}</div>
            </div>
            <h2 className="font-serif text-5xl font-bold text-slate-100 mb-4 leading-tight">
              {label}<br />
              <span className="teal-gradient-text">Portal</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-sm leading-relaxed">{description}</p>
            <div className="mt-10 space-y-3">
              {["Secure role-based access", "Real-time dashboard updates", "Comprehensive audit logs"].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-500/15 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-teal-400" />
                  </div>
                  <span className="text-sm text-slate-400">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-slate-600">© 2026 SalutemRapha HMS · Nigerian Healthcare Platform</div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <p className="font-serif text-lg font-bold text-slate-100">SalutemRapha HMS</p>
          </div>

          <div className="mb-8">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border mb-4 ${iconBg}`} style={{ borderColor: "rgba(20,184,166,0.2)" }}>
              {icon}
              {label} Access
            </div>
            <h1 className="font-serif text-3xl font-bold text-slate-100 mb-2">Sign In</h1>
            <p className="text-slate-500 text-sm">Enter your credentials to access the {label.toLowerCase()} portal.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@SalutemRapha.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
            />
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              suffix={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Contact admin to reset password</span>
            </div>

            <Button type="submit" size="lg" loading={loading} icon={<LogIn className="w-4 h-4" />} iconPosition="right" className="w-full mt-2">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 p-4 bg-surface-2 border border-border rounded-xl">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Demo Credentials</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Email</span>
                <span className="font-mono text-teal-400">{demoEmail}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Password</span>
                <span className="font-mono text-slate-400">{demoPassword}</span>
              </div>
            </div>
          </motion.div> */}

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-slate-600 text-center mb-4">Or sign in as another role</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "receptionist", label: "Receptionist" },
                { id: "nurse", label: "Nurse" },
                { id: "doctor", label: "Doctor" },
                { id: "admin", label: "Admin" },
              ]
                .filter((r) => r.id !== role)
                .map((r) => (
                  <Link key={r.id} href={`/${r.id}/login`} className="text-center px-3 py-2 rounded-xl bg-surface-2 border border-border hover:border-teal-500/30 text-xs text-slate-500 hover:text-slate-300 transition-all">
                    {r.label}
                  </Link>
                ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
