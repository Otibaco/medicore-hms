"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import {
  Heart,
  Activity,
  Shield,
  Users,
  ChevronRight,
  ArrowRight,
  Stethoscope,
  ClipboardList,
  UserCheck,
  ShieldCheck,
  Star,
  CheckCircle,
} from "lucide-react";

/* ================= DATA ================= */

const roles = [
  {
    id: "receptionist",
    label: "Receptionist",
    description: "Manage patient registration & invoicing",
    icon: <UserCheck className="w-5 h-5" />,
    color: "blue",
    gradient: "from-blue-600/20 to-blue-800/10",
    border: "border-blue-500/20 hover:border-blue-500/50",
    iconBg: "bg-blue-500/15 text-blue-400",
    href: "/receptionist/login",
  },
  {
    id: "nurse",
    label: "Nurse",
    description: "Handle admissions & care coordination",
    icon: <ClipboardList className="w-5 h-5" />,
    color: "violet",
    gradient: "from-violet-600/20 to-violet-800/10",
    border: "border-violet-500/20 hover:border-violet-500/50",
    iconBg: "bg-violet-500/15 text-violet-400",
    href: "/nurse/login",
  },
  {
    id: "doctor",
    label: "Doctor",
    description: "Diagnose, record vitals & manage cases",
    icon: <Stethoscope className="w-5 h-5" />,
    color: "teal",
    gradient: "from-teal-600/20 to-teal-800/10",
    border: "border-teal-500/20 hover:border-teal-500/50",
    iconBg: "bg-teal-500/15 text-teal-400",
    href: "/doctor/login",
  },
  {
    id: "admin",
    label: "Administrator",
    description: "Oversee users, reports & system access",
    icon: <ShieldCheck className="w-5 h-5" />,
    color: "amber",
    gradient: "from-amber-600/20 to-amber-800/10",
    border: "border-amber-500/20 hover:border-amber-500/50",
    iconBg: "bg-amber-500/15 text-amber-400",
    href: "/admin/login",
  },
];

const stats = [
  { label: "Patients Served", value: "12,400+", icon: <Users className="w-5 h-5" /> },
  { label: "Clinical Staff", value: "240+", icon: <Stethoscope className="w-5 h-5" /> },
  { label: "Uptime Guaranteed", value: "99.9%", icon: <Activity className="w-5 h-5" /> },
  { label: "Data Security", value: "HIPAA", icon: <Shield className="w-5 h-5" /> },
];

const features = [
  "Real-time patient tracking",
  "Automated invoice generation",
  "Role-based access control",
  "Comprehensive audit trail",
  "Multi-department coordination",
  "Advanced reporting suite",
];

/* ================= COMPONENT ================= */

export default function HomePage() {
  const [activeRole, setActiveRole] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-midnight relative overflow-hidden">

      {/* ================= BACKGROUND ================= */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-80 h-64 sm:h-80 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-56 sm:w-64 h-56 sm:h-64 bg-amber-500/3 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(20,184,166,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ================= NAVIGATION ================= */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="font-serif text-lg sm:text-xl font-bold text-slate-100">
              MediCore
            </p>
            <p className="text-[9px] text-teal-500/70 tracking-[0.3em] uppercase">
              Hospital Management
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-surface/50 border border-border rounded-2xl p-1">
          {["Home", "Receptionist", "Nurse", "Doctor", "Admin"].map((item) => (
            <Link
              key={item}
              href={item === "Home" ? "/" : `/${item.toLowerCase()}/login`}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-surface-2 transition-all"
            >
              {item}
            </Link>
          ))}
        </div>

        <Link
          href="/admin/login"
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-medium transition-all shadow-lg shadow-teal-500/20"
        >
          Sign In <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.nav>

      {/* ================= HERO ================= */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16 max-w-7xl mx-auto">
        <div className="text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-400 text-xs sm:text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-teal-400 pulse-dot" />
            Next-Generation Hospital Management Platform
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif font-bold text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-slate-100 leading-tight mb-6"
          >
            Healthcare <span className="gradient-text">Elevated</span>
            <br />
            <span className="text-slate-500 text-2xl sm:text-3xl md:text-4xl font-normal italic">
              to Excellence
            </span>
          </motion.h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-12 sm:mb-16 leading-relaxed">
            A unified, role-based hospital management system designed for modern
            clinical workflows. Streamline operations from patient registration to
            discharge with precision and clarity.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/admin/dashboard"
              className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-2xl font-semibold transition-all"
            >
              Explore Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#roles"
              className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 bg-surface border border-border text-slate-300 rounded-2xl font-medium transition-all"
            >
              Select Your Role <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-4 sm:p-5 text-center"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto mb-3">
                  {stat.icon}
                </div>
                <p className="font-serif text-lg sm:text-xl font-bold text-slate-100">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ROLES ================= */}
      <section id="roles" className="relative z-10 px-4 sm:px-6 lg:px-8 py-16 sm:py-20 max-w-7xl mx-auto">

        <div className="text-center mb-12">
          <p className="text-teal-400 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase mb-4">
            Access Portal
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-slate-100 mb-4">
            Select Your Role
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm sm:text-base">
            Each role provides a purpose-built interface tailored to your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {roles.map((role, i) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              onHoverStart={() => setActiveRole(role.id)}
              onHoverEnd={() => setActiveRole(null)}
            >
              <Link href={role.href}>
                <div
                  className={`relative h-full glass-card rounded-2xl p-6 border transition-all duration-300 cursor-pointer ${role.border} ${
                    activeRole === role.id ? "shadow-xl" : ""
                  }`}
                >
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${role.gradient} opacity-0 hover:opacity-100 transition-opacity`} />

                  <div className="relative text-left">
                    <div className={`w-12 h-12 rounded-xl ${role.iconBg} flex items-center justify-center mb-5`}>
                      {role.icon}
                    </div>
                    <h3 className="font-serif text-lg font-bold text-slate-100 mb-2">
                      {role.label}
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                      {role.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                      Sign In <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-16 sm:py-20 max-w-7xl mx-auto">
        <div className="glass-card rounded-3xl p-6 sm:p-10 md:p-16 animated-border">
          <div className="grid md:grid-cols-2 gap-10 items-center">

            <div className="text-center md:text-left">
              <p className="text-amber-400 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase mb-4">
                Platform Capabilities
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-slate-100 mb-6">
                Everything your hospital needs{" "}
                <span className="teal-gradient-text">integrated</span>
              </h2>
              <p className="text-slate-400 mb-8 text-sm sm:text-base">
                MediCore HMS unifies clinical, administrative, and financial operations
                in a cohesive platform.
              </p>
            </div>

            <div className="space-y-3">
              {features.map((feature, i) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 p-4 bg-surface-2 rounded-xl border border-border"
                >
                  <CheckCircle className="w-5 h-5 text-teal-500" />
                  <span className="text-sm text-slate-300">{feature}</span>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="relative z-10 border-t border-border px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center">
              <Heart className="w-4 h-4 text-teal-400" />
            </div>
            <span className="font-serif text-slate-400">MediCore HMS</span>
          </div>

          <p className="text-sm text-slate-600">
            © 2026 MediCore Hospital Management System. All rights reserved.
          </p>

          <div className="flex items-center gap-2 justify-center md:justify-end">
            <Star className="w-3 h-3 text-amber-400" />
            <span className="text-xs text-slate-600">
              Built for modern healthcare
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}