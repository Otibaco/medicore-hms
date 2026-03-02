"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Home, ArrowLeft } from "lucide-react";


export default function NotFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-5 blur-3xl rounded-full" style={{ background: "radial-gradient(circle, rgba(20,184,166,0.6) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `linear-gradient(rgba(20,184,166,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.5) 1px, transparent 1px)`, backgroundSize: "50px 50px" }} />
      </div>

      <div className="relative text-center px-8 max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif text-xl font-bold text-slate-100">MediCore</span>
        </div>

        {/* 404 */}
        <div className="mb-8">
          <div className="font-serif text-[120px] font-bold leading-none bg-gradient-to-b from-teal-400 to-teal-800 bg-clip-text text-transparent select-none">
            404
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-100 mt-2 mb-3">Page Not Found</h1>
          <p className="text-slate-500 leading-relaxed">
            The page you are looking for does not exist, may have been moved, or you may not have permission to view it.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-teal-500/20">
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <button onClick={() => router.back()} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-slate-400 hover:text-slate-200 hover:border-teal-500/30 font-medium text-sm transition-all">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

        </div>

        <p className="mt-12 text-xs text-slate-700">© 2026 MediCore HMS · Nigerian Healthcare Platform</p>
      </div>
    </div>
  );
}
