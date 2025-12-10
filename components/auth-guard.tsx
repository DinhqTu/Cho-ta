"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ShieldX } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && requireAuth && !user) {
      router.push("/login");
    }
  }, [user, isLoading, requireAuth, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#D4AF37]/20 to-[#D4AF37]/10 flex items-center justify-center animate-pulse">
            <span className="text-4xl">🏮</span>
          </div>
          <p className="text-[#2A2A2A]/50">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  return <>{children}</>;
}

// Admin Guard - Only allows admin users
interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { user, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#D4AF37]/20 to-[#D4AF37]/10 flex items-center justify-center animate-pulse">
            <span className="text-4xl">🏮</span>
          </div>
          <p className="text-[#2A2A2A]/50">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-red-100 flex items-center justify-center mb-6">
            <ShieldX className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#2A2A2A] mb-2">
            Không có quyền truy cập
          </h1>
          <p className="text-[#2A2A2A]/60 mb-6">
            Trang này chỉ dành cho quản trị viên
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-xl bg-[#D4AF37] text-white font-medium hover:bg-[#C5A028] transition-colors"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
