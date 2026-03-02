"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, AlertTriangle, CheckCircle, Info, AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn, formatTimeAgo } from "@/lib/utils";
import { markAsRead, markAllAsRead, dismissNotification } from "@/actions/notifications";

interface Notification {
  _id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "success" | "critical";
  category: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

const severityIcon = {
  critical: <AlertTriangle className="w-4 h-4 text-red-400" />,
  warning: <AlertCircle className="w-4 h-4 text-amber-400" />,
  success: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  info: <Info className="w-4 h-4 text-blue-400" />,
};

const severityBg = {
  critical: "bg-red-500/10 border-red-500/20",
  warning: "bg-amber-500/10 border-amber-500/20",
  success: "bg-emerald-500/10 border-emerald-500/20",
  info: "bg-blue-500/10 border-blue-500/20",
};

export function NotificationPanel({ initialCount = 0 }: { initialCount?: number }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialCount);
  const [loaded, setLoaded] = useState(false);

  // Load notifications when panel opens
  const loadNotifications = async () => {
    try {
      const { getNotifications } = await import("@/actions/notifications");
      const result = await getNotifications();
      if (result.success && result.data) {
        const notifs = result.data as unknown as Notification[];
        setNotifications(notifs.slice(0, 10));
        setUnreadCount(notifs.filter(n => !n.isRead).length);
        setLoaded(true);
      }
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    if (open && !loaded) {
      loadNotifications();
    }
  }, [open, loaded]);

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    setNotifications(p => p.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(p => Math.max(0, p - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications(p => p.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleDismiss = async (id: string, wasUnread: boolean) => {
    await dismissNotification(id);
    setNotifications(p => p.filter(n => n._id !== id));
    if (wasUnread) setUnreadCount(p => Math.max(0, p - 1));
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl bg-surface-2 border border-border hover:border-teal-500/30 transition-all duration-200 text-slate-400 hover:text-slate-200">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 top-12 w-96 glass-card rounded-2xl shadow-2xl z-50 overflow-hidden"
              style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(20,184,166,0.1)" }}
            >
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-200">Notifications</h3>
                  <p className="text-xs text-slate-500">{unreadCount} unread</p>
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-surface-3 text-slate-500 hover:text-slate-300 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {!loaded ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 rounded-full border-2 border-teal-500/30 border-t-teal-500 animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">All caught up!</p>
                    <p className="text-slate-600 text-xs mt-1">No new notifications</p>
                  </div>
                ) : (
                  <div className="p-2 flex flex-col gap-1">
                    {notifications.map((notif) => (
                      <motion.div key={notif._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className={cn("relative flex gap-3 p-3 rounded-xl border transition-all group cursor-pointer",
                          severityBg[notif.severity] ?? "bg-surface-2 border-border",
                          !notif.isRead && "ring-1 ring-inset ring-white/5"
                        )}
                        onClick={() => !notif.isRead && handleMarkRead(notif._id)}>
                        <div className="mt-0.5 flex-shrink-0">
                          {severityIcon[notif.severity] ?? severityIcon.info}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn("text-sm font-medium leading-tight", notif.isRead ? "text-slate-400" : "text-slate-200")}>
                              {notif.title}
                            </p>
                            {!notif.isRead && <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0 mt-1.5" />}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-slate-600 mt-1">{formatTimeAgo(notif.createdAt)}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDismiss(notif._id, !notif.isRead); }}
                          className="absolute top-2 right-2 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-slate-400">
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-4 py-3 border-t border-border">
                <Link href="/notifications" onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 text-xs text-teal-400 hover:text-teal-300 transition-colors">
                  View all notifications <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
