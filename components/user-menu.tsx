"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { LogOut, User, Settings, ChevronDown, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="w-10 h-10 rounded-full bg-[#FBF8F4] animate-pulse" />
    );
  }

  if (!user) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="px-4 py-2 rounded-xl bg-[#D4AF37] text-white font-medium hover:bg-[#C5A028] transition-colors text-sm"
      >
        Sign In
      </button>
    );
  }

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push("/login");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#FBF8F4] transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C5A028] flex items-center justify-center text-white font-medium text-sm">
          {user.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <span className="text-sm font-medium text-[#2A2A2A] hidden sm:block">
          {user.name || "User"}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-[#2A2A2A]/50 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#E9D7B8]/50 overflow-hidden z-50">
            <div className="p-4 border-b border-[#E9D7B8]/30">
              <p className="font-medium text-[#2A2A2A]">{user.name}</p>
              <p className="text-sm text-[#2A2A2A]/50 truncate">{user.email}</p>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/dashboard/user/${user.$id}`);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#FBF8F4] transition-colors text-left"
              >
                <BarChart3 className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm text-[#2A2A2A]">
                  Dashboard của tôi
                </span>
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/admin/menu");
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#FBF8F4] transition-colors text-left"
              >
                <Settings className="w-4 h-4 text-[#2A2A2A]/50" />
                <span className="text-sm text-[#2A2A2A]">Manage Menu</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-500">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
