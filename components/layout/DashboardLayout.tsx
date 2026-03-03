"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, Users, UserPlus, Stethoscope, FileText,
  Settings, LogOut, Menu, X, ChevronLeft, ChevronRight,
  Activity, ClipboardList, FlaskConical, Heart, ShieldCheck,
  Building2, Bell, Receipt, BedDouble,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationPanel } from "@/components/ui/NotificationPanel";
import { toast } from "sonner";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "receptionist" | "nurse" | "doctor" | "admin";
  userName?: string;
  userCode?: string;
  pageTitle?: string;
}

const roleNav: Record<string, NavSection[]> = {
  receptionist: [
    {
      items: [
        { label: "Dashboard", href: "/receptionist/dashboard", icon: <LayoutDashboard className="w-[17px] h-[17px]" /> },
      ],
    },
    {
      title: "Patient Management",
      items: [
        { label: "Register Patient", href: "/receptionist/patients", icon: <UserPlus className="w-[17px] h-[17px]" /> },
        { label: "Invoices", href: "/receptionist/invoices", icon: <Receipt className="w-[17px] h-[17px]" /> },
      ],
    },
    {
      title: "System",
      items: [
        { label: "Notifications", href: "/notifications", icon: <Bell className="w-[17px] h-[17px]" />, badge: "3" },
        { label: "Settings", href: "/settings", icon: <Settings className="w-[17px] h-[17px]" /> },
      ],
    },
  ],
  nurse: [
    {
      items: [
        { label: "Dashboard", href: "/nurse/dashboard", icon: <LayoutDashboard className="w-[17px] h-[17px]" /> },
      ],
    },
    {
      title: "Clinical",
      items: [
        { label: "Admissions", href: "/nurse/admissions", icon: <BedDouble className="w-[17px] h-[17px]" /> },
        { label: "Lab Requests", href: "/nurse/labs", icon: <FlaskConical className="w-[17px] h-[17px]" /> },
        { label: "Patients", href: "/nurse/patients", icon: <Users className="w-[17px] h-[17px]" /> },
      ],
    },
    {
      title: "System",
      items: [
        { label: "Notifications", href: "/notifications", icon: <Bell className="w-[17px] h-[17px]" />, badge: "5" },
        { label: "Settings", href: "/settings", icon: <Settings className="w-[17px] h-[17px]" /> },
      ],
    },
  ],
  doctor: [
    {
      items: [
        { label: "Dashboard", href: "/doctor/dashboard", icon: <LayoutDashboard className="w-[17px] h-[17px]" /> },
      ],
    },
    {
      title: "Clinical",
      items: [
        { label: "My Patients", href: "/doctor/patients", icon: <Users className="w-[17px] h-[17px]" /> },
        { label: "Diagnoses", href: "/doctor/diagnoses", icon: <Stethoscope className="w-[17px] h-[17px]" /> },
        { label: "Vitals", href: "/doctor/vitals", icon: <Activity className="w-[17px] h-[17px]" /> },
        { label: "Lab Results", href: "/doctor/labs", icon: <FlaskConical className="w-[17px] h-[17px]" /> },
      ],
    },
    {
      title: "System",
      items: [
        { label: "Notifications", href: "/notifications", icon: <Bell className="w-[17px] h-[17px]" />, badge: "2" },
        { label: "Settings", href: "/settings", icon: <Settings className="w-[17px] h-[17px]" /> },
      ],
    },
  ],
  admin: [
    {
      items: [
        { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="w-[17px] h-[17px]" /> },
      ],
    },
    {
      title: "Management",
      items: [
        { label: "Users", href: "/admin/users", icon: <Users className="w-[17px] h-[17px]" /> },
        { label: "Patients", href: "/admin/patients", icon: <Heart className="w-[17px] h-[17px]" /> },
        { label: "Admissions", href: "/admin/admissions", icon: <Building2 className="w-[17px] h-[17px]" /> },
      ],
    },
    {
      title: "Analytics",
      items: [
        { label: "Reports", href: "/admin/reports", icon: <FileText className="w-[17px] h-[17px]" /> },
        { label: "Access Control", href: "/admin/access", icon: <ShieldCheck className="w-[17px] h-[17px]" /> },
      ],
    },
    {
      title: "System",
      items: [
        { label: "Notifications", href: "/notifications", icon: <Bell className="w-[17px] h-[17px]" />, badge: "8" },
        { label: "Settings", href: "/settings", icon: <Settings className="w-[17px] h-[17px]" /> },
      ],
    },
  ],
};

const roleConfig: Record<string, { accent: string; badgeCls: string; label: string; avatarGrad: string; dot: string }> = {
  receptionist: { accent: "text-blue-400", badgeCls: "bg-blue-500/15 text-blue-300 border border-blue-500/20", label: "Receptionist", avatarGrad: "from-blue-500 to-blue-800", dot: "bg-blue-400" },
  nurse:        { accent: "text-violet-400", badgeCls: "bg-violet-500/15 text-violet-300 border border-violet-500/20", label: "Nurse", avatarGrad: "from-violet-500 to-violet-800", dot: "bg-violet-400" },
  doctor:       { accent: "text-teal-400", badgeCls: "bg-teal-500/15 text-teal-300 border border-teal-500/20", label: "Doctor", avatarGrad: "from-teal-500 to-teal-800", dot: "bg-teal-400" },
  admin:        { accent: "text-amber-400", badgeCls: "bg-amber-500/15 text-amber-300 border border-amber-500/20", label: "Admin", avatarGrad: "from-amber-500 to-amber-800", dot: "bg-amber-400" },
};

const roleAvatarFallback: Record<string, string> = { receptionist: "RC", nurse: "RN", doctor: "DR", admin: "AD" };

export function DashboardLayout({ children, role, userName, userCode, pageTitle }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const sections = roleNav[role] || [];
  const cfg = roleConfig[role];

  // Prefer live session data
  const displayName = session?.user?.name || userName || "Staff Member";
  const displayCode = (session?.user as { staffCode?: string })?.staffCode || userCode || "------";
  const nameParts = displayName.split(" ");
  const initials = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : roleAvatarFallback[role];

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = async () => {
    toast.success("Signed out", { description: "You have been logged out of SalutemRapha HMS." });
    await signOut({ callbackUrl: "/" });
  };

  const allItems = sections.flatMap(s => s.items);
  const activeItem = allItems.find(i => pathname === i.href || pathname.startsWith(i.href + "/"));
  const breadcrumbPage = activeItem?.label || pageTitle || "Dashboard";

  /* ─── Single Nav Link ─── */
  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={cn(
          "relative group flex items-center rounded-lg text-[13px] font-medium transition-all duration-150 outline-none",
          collapsed ? "justify-center w-9 h-9 mx-auto" : "gap-2.5 px-3 py-2",
          isActive
            ? "bg-white/[0.08] text-slate-100"
            : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.05]"
        )}
      >
        {isActive && !collapsed && (
          <span className="absolute left-0 inset-y-1 w-[2.5px] bg-teal-400 rounded-full" />
        )}
        <span className={cn("flex-shrink-0 transition-colors", isActive ? cfg.accent : "group-hover:text-slate-300")}>
          {item.icon}
        </span>
        {!collapsed && <span className="flex-1 truncate leading-none">{item.label}</span>}
        {!collapsed && item.badge && (
          <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/20 px-1.5 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
        {/* Tooltip for collapsed mode */}
        {collapsed && (
          <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-md border border-[#1e3252] bg-[#0e1a2e] px-2.5 py-1.5 text-xs text-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
            {item.label}{item.badge ? ` (${item.badge})` : ""}
          </span>
        )}
      </Link>
    );
  };

  /* ─── Sidebar inner content (shared between desktop+mobile) ─── */
  const SidebarBody = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Top: logo + close (mobile) */}
      <div className={cn(
        "flex items-center border-b border-white/[0.05]",
        collapsed && !mobile ? "flex-col justify-center gap-0 py-4 px-2" : "gap-3 px-4 py-[14px]"
      )}>
        <Link href="/" className="flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-teal-700 flex items-center justify-center shadow-md shadow-teal-500/30">
            <Heart className="w-3.5 h-3.5 text-white" />
          </div>
        </Link>
        {(!collapsed || mobile) && (
          <div className="flex-1 min-w-0">
            <p className="font-serif text-[14px] font-bold text-slate-100 leading-none tracking-tight">SalutemRapha</p>
            <p className="text-[8.5px] text-teal-500/50 tracking-[0.3em] uppercase mt-[3px]">HMS</p>
          </div>
        )}
        {mobile && (
          <button onClick={() => setMobileOpen(false)} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Role badge */}
      {(!collapsed || mobile) && (
        <div className="px-4 pt-3 pb-1">
          <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-semibold tracking-widest uppercase", cfg.badgeCls)}>
            <span className={cn("w-1 h-1 rounded-full", cfg.dot)} />
            {cfg.label}
          </span>
        </div>
      )}

      {/* Nav sections */}
      <nav className={cn("flex-1 overflow-y-auto py-2", collapsed && !mobile ? "px-2" : "px-3")}>
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-4" : ""}>
            {section.title && (!collapsed || mobile) && (
              <p className="text-[9.5px] font-semibold text-slate-700 uppercase tracking-[0.14em] px-3 mb-1">
                {section.title}
              </p>
            )}
            {collapsed && !mobile && si > 0 && (
              <div className="my-2 border-t border-white/[0.04]" />
            )}
            <div className="space-y-[2px]">
              {section.items.map(item => <NavLink key={item.href} item={item} />)}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom user strip */}
      <div className={cn("border-t border-white/[0.05] p-3", collapsed && !mobile ? "flex flex-col items-center gap-2.5" : "")}>
        {collapsed && !mobile ? (
          <>
            <div className={cn("w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center text-[10px] font-bold text-white", cfg.avatarGrad)}>
              {initials}
            </div>
            <button onClick={handleLogout} title="Sign out" className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2.5 px-1">
            <div className={cn("w-7 h-7 rounded-lg bg-gradient-to-br flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white", cfg.avatarGrad)}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium text-slate-200 truncate leading-none">{displayName}</p>
              <p className="text-[9.5px] text-slate-600 font-mono mt-0.5 truncate">{displayCode}</p>
            </div>
            <button onClick={handleLogout} title="Sign out" className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#070e1a" }}>

      {/* ── Desktop Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 60 : 228 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:flex flex-col flex-shrink-0 relative overflow-visible"
        style={{ background: "#0b1424", borderRight: "1px solid rgba(255,255,255,0.055)" }}
      >
        <div className="flex-1 overflow-hidden">
          <SidebarBody />
        </div>

        {/* Toggle pill — sits on the border */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className={cn(
            "absolute -right-[13px] top-[52px] z-30",
            "w-[26px] h-[26px] rounded-full",
            "flex items-center justify-center",
            "border shadow-lg transition-all duration-200",
            "hover:scale-110 active:scale-95",
          )}
          style={{
            background: "#132035",
            borderColor: "rgba(30,50,82,0.9)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(20,184,166,0.08)",
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.22 }}>
            <ChevronLeft className="w-3 h-3 text-slate-400" />
          </motion.div>
        </button>
      </motion.aside>

      {/* ── Mobile Overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed left-0 top-0 h-full w-[228px] z-50 lg:hidden"
              style={{ background: "#0b1424", borderRight: "1px solid rgba(255,255,255,0.055)" }}
            >
              <SidebarBody mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header
          className="flex-shrink-0 h-[52px] flex items-center justify-between px-5 gap-4"
          style={{ background: "#0b1424", borderBottom: "1px solid rgba(255,255,255,0.055)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 text-sm min-w-0">
              <span className="text-slate-700 hidden sm:block text-[12px]">SalutemRapha</span>
              <ChevronRight className="w-3 h-3 text-slate-800 hidden sm:block flex-shrink-0" />
              <span className={cn("font-medium text-[12px] flex-shrink-0", cfg.accent)}>{cfg.label}</span>
              <ChevronRight className="w-3 h-3 text-slate-800 flex-shrink-0" />
              <span className="text-slate-300 text-[12px] font-medium truncate">{breadcrumbPage}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/[0.05] bg-white/[0.025]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-600 font-mono tracking-wider">LIVE</span>
            </div>
            <NotificationPanel />
            <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-[10px] font-bold text-white cursor-pointer", cfg.avatarGrad)}>
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto" style={{ background: "#070e1a" }}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="p-5 md:p-7"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
