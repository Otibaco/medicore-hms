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
      /* silently ignore */
    }
  };

  useEffect(() => {
    if (open && !loaded) {
      loadNotifications();
    }
  }, [open, loaded]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [open]);

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
      {/* Trigger Button */}
      <button 
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl bg-surface-2 border border-[#1e3252] hover:border-teal-500/30 transition-all text-slate-400 hover:text-slate-200"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-teal-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0f172a]"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:bg-transparent" 
              onClick={() => setOpen(false)} 
            />

            {/* Panel Container */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "fixed inset-x-4 bottom-4 top-auto z-[101] lg:absolute lg:inset-auto lg:right-0 lg:top-14",
                "w-auto lg:w-[400px] flex flex-col bg-[#111c2e] border border-[#1e3252] rounded-2xl shadow-2xl overflow-hidden"
              )}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#1e3252] flex items-center justify-between bg-surface-2/30">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-100">Notifications</h3>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {unreadCount} Unread Messages
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead} 
                      className="text-[11px] font-bold text-teal-400 hover:text-teal-300 px-2 py-1 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                  <button 
                    onClick={() => setOpen(false)} 
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="max-h-[60vh] lg:max-h-[420px] overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                {!loaded ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 rounded-full border-2 border-teal-500/20 border-t-teal-500 animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mb-3">
                      <Bell className="w-6 h-6 text-slate-600 opacity-40" />
                    </div>
                    <p className="text-slate-300 font-semibold text-sm">Inbox is empty</p>
                    <p className="text-slate-500 text-xs mt-1 px-10">We'll notify you when something important happens.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <motion.div 
                      key={notif._id} 
                      layout 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "relative flex gap-3 p-3.5 rounded-xl border transition-all cursor-pointer active:scale-[0.98] lg:active:scale-100 group",
                        severityBg[notif.severity] ?? "bg-surface-2 border-[#1e3252]",
                        !notif.isRead ? "ring-1 ring-inset ring-white/10 border-opacity-50" : "opacity-70"
                      )}
                      onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {severityIcon[notif.severity] ?? severityIcon.info}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <p className={cn(
                            "text-sm font-bold leading-none truncate", 
                            notif.isRead ? "text-slate-400" : "text-slate-100"
                          )}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 pr-4">
                          {notif.message}
                        </p>
                        
                        {!notif.isRead && (
                          <div className="mt-2 flex items-center gap-1.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                             <span className="text-[10px] font-bold text-teal-500 uppercase tracking-tighter">New Message</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleDismiss(notif._id, !notif.isRead); }}
                        className="p-1 rounded-md text-slate-600 hover:text-slate-300 transition-opacity lg:opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3.5 border-t border-[#1e3252] bg-surface-2/20">
                <Link 
                  href="/notifications" 
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 text-xs font-bold text-teal-400 hover:text-teal-300 transition-all uppercase tracking-widest"
                >
                  View All Notifications
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}