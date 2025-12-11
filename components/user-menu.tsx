"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { LogOut, User, BarChart3, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

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
    router.push("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#FBF8F4] transition-colors focus:outline-none">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C5A028] flex items-center justify-center text-white font-medium text-sm">
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <span className="text-sm font-medium text-[#2A2A2A] hidden sm:block">
            {user.name || "User"}
          </span>
          <ChevronDown className="w-4 h-4 text-[#2A2A2A]/50" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 bg-white rounded-xl shadow-xl border border-[#E9D7B8]/50"
      >
        <DropdownMenuLabel className="p-4">
          <p className="font-medium text-[#2A2A2A]">{user.name}</p>
          <p className="text-sm text-[#2A2A2A]/50 truncate">{user.email}</p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-[#E9D7B8]/30" />

        <DropdownMenuItem
          onClick={() => router.push("/profile")}
          className="px-3 py-2.5 cursor-pointer hover:bg-[#FBF8F4]"
        >
          <User className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-sm text-[#2A2A2A]">Hồ sơ</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push(`/dashboard/user/${user.$id}`)}
          className="px-3 py-2.5 cursor-pointer hover:bg-[#FBF8F4]"
        >
          <BarChart3 className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-sm text-[#2A2A2A]">Dashboard của tôi</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#E9D7B8]/30" />

        <DropdownMenuItem
          onClick={handleLogout}
          variant="destructive"
          className="px-3 py-2.5 cursor-pointer hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
