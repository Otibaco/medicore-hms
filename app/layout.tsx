import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/providers/SessionProvider";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MediCore HMS | Hospital Management System",
  description: "Professional Hospital Management System for Nigerian Healthcare",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          {children}
          <Toaster
          position="top-right"
          expand={false}
          richColors={false}
          closeButton
          toastOptions={{
            style: {
              background: "#0e1a2e",
              border: "1px solid #1e3252",
              color: "#e2e8f0",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "14px",
              borderRadius: "12px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(20,184,166,0.1)",
            },
            classNames: {
              title: "font-semibold text-slate-100",
              description: "text-slate-400 text-sm",
              actionButton: "bg-teal-500 text-white hover:bg-teal-400",
              cancelButton: "bg-surface-3 text-slate-400",
              closeButton: "bg-surface-2 border-border text-slate-400 hover:text-slate-200",
              success: "border-teal-500/30",
              error: "border-red-500/30",
              warning: "border-gold-500/30",
              info: "border-blue-500/30",
            },
          }}
        />
        </SessionProvider>
      </body>
    </html>
  );
}

