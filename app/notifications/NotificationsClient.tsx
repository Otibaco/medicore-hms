"use client";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Trash2, AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn, formatTimeAgo } from "@/lib/utils";
import { markAsRead, markAllAsRead, dismissNotification } from "@/actions/notifications";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Notification {
  _id: string; title: string; message: string;
  severity: "info" | "warning" | "success" | "critical";
  category: string; isRead: boolean; createdAt: string; actionUrl?: string;
}

const severityConfig = {
  critical: { icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-400", bg: "bg-red-500/10 border-red-500/15" },
  warning: { icon: <AlertCircle className="w-4 h-4" />, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/15" },
  success: { icon: <CheckCircle className="w-4 h-4" />, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/15" },
  info: { icon: <Info className="w-4 h-4" />, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/15" },
};

const CATEGORIES = ["All", "Clinical", "Admissions", "Finance", "Scheduling", "Pharmacy", "System", "Reports"];

export function NotificationsClient({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = notifications.filter((n) => {
    if (showUnreadOnly && n.isRead) return false;
    if (selectedCategory !== "All" && n.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
    return true;
  });

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markAsRead(id);
      setNotifications((p) => p.map((n) => n._id === id ? { ...n, isRead: true } : n));
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const result = await markAllAsRead();
      if (result.success) {
        setNotifications((p) => p.map((n) => ({ ...n, isRead: true })));
        toast.success("All notifications marked as read.");
      }
    });
  };

  const handleDismiss = (id: string) => {
    startTransition(async () => {
      const result = await dismissNotification(id);
      if (result.success) {
        setNotifications((p) => p.filter((n) => n._id !== id));
      }
    });
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Stay updated with system alerts and activity"
        icon={<Bell className="w-5 h-5 text-teal-400" />}
        actions={
          unreadCount > 0 ? (
            <Button variant="secondary" size="sm" onClick={handleMarkAllRead} loading={pending} icon={<CheckCheck className="w-4 h-4" />}>
              Mark all read
            </Button>
          ) : null
        }
      />

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Filter by Category</h3>
          <div className="space-y-1">
            {CATEGORIES.map((cat) => {
              const count = cat === "All" ? notifications.filter(n => !n.isRead).length
                : notifications.filter(n => !n.isRead && n.category.toLowerCase() === cat.toLowerCase()).length;
              return (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={cn("w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all", selectedCategory === cat
                    ? "bg-teal-500/15 text-teal-300 border border-teal-500/20"
                    : "text-slate-500 hover:text-slate-300 hover:bg-surface-2")}>
                  <span>{cat}</span>
                  {count > 0 && <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded-full">{count}</span>}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-slate-400">Unread only</span>
              <div className={cn("relative w-10 h-5 rounded-full transition-all cursor-pointer", showUnreadOnly ? "bg-teal-500" : "bg-surface-3 border border-border")} onClick={() => setShowUnreadOnly(!showUnreadOnly)}>
                <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", showUnreadOnly ? "left-5" : "left-0.5")} />
              </div>
            </label>
          </div>
        </Card>

        {/* Notifications list */}
        <div className="lg:col-span-3 space-y-3">
          {filtered.length === 0 ? (
            <Card className="text-center py-16">
              <Bell className="w-12 h-12 mx-auto text-slate-700 mb-3" />
              <p className="text-slate-400 font-medium">No notifications</p>
              <p className="text-slate-600 text-sm mt-1">
                {showUnreadOnly ? "No unread notifications." : "You're all caught up!"}
              </p>
            </Card>
          ) : (
            <AnimatePresence>
              {filtered.map((notif, i) => {
                const cfg = severityConfig[notif.severity] ?? severityConfig.info;
                return (
                  <motion.div key={notif._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.04 }}>
                    <div onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                      className={cn("p-4 rounded-xl border transition-all group cursor-pointer", notif.isRead ? "bg-surface-2 border-border opacity-70 hover:opacity-100" : `${cfg.bg} hover:brightness-110`)}>
                      <div className="flex items-start gap-4">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-black/20", cfg.color)}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={cn("text-sm font-semibold", notif.isRead ? "text-slate-300" : "text-slate-100")}>{notif.title}</p>
                            {!notif.isRead && <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" />}
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed">{notif.message}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-slate-600">{formatTimeAgo(notif.createdAt)}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-black/20 text-slate-500 capitalize">{notif.category}</span>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDismiss(notif._id); }}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
