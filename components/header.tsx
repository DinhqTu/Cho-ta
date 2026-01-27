"use client";

import { useAuth } from "@/contexts/auth-context";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "./notification-bell";
import { UnpaidOrdersCard } from "./unpaid-orders-card";
import {
  Home,
  UtensilsCrossed,
  ClipboardList,
  CalendarDays,
  BarChart3,
  ShoppingBag,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const { isAdmin } = useAuth();
  const pathname = usePathname();

  return (
    <header className="relative z-40 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-[#E9D7B8]/30 shrink-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <img
            src="/assets/images/logo_batcomman.jpg"
            alt="Bát Cơm Mặn"
            className="w-10 h-10 rounded-xl object-cover"
          />
          <div className="hidden sm:block">
            <h1 className="font-bold text-[#2A2A2A] leading-tight">
              Bát Cơm Mặn
            </h1>
            <p className="text-xs text-[#2A2A2A]/50">VTCode</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#FBF8F4] transition-colors text-[#2A2A2A]/70 hover:text-[#2A2A2A]"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:block">
              Cổng chợ
            </span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#FBF8F4] transition-colors text-[#2A2A2A]/70 hover:text-[#2A2A2A]"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:block">Sổ chợ</span>
          </Link>

          <Link
            href="/chat"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#FBF8F4] transition-colors text-[#2A2A2A]/70 hover:text-[#2A2A2A]"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:block">Họp chợ</span>
          </Link>

          {/* <Link
            href="/order"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#FBF8F4] transition-colors text-[#2A2A2A]/70 hover:text-[#2A2A2A]"
          >
            <ClipboardList className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:block">
              Sạp hàng
            </span>
          </Link> */}

          <Link
            href="/group-order"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#FBF8F4] transition-colors text-[#2A2A2A]/70 hover:text-[#2A2A2A]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:block">Lò Giản</span>
          </Link>

          <Link
            href="/weekly-orders"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#FBF8F4] transition-colors text-[#2A2A2A]/70 hover:text-[#2A2A2A]"
          >
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:block">
              Bảng tuần
            </span>
          </Link>

          {/* Admin only tabs */}
          {isAdmin && (
            <>
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/dashboard"
                    ? "bg-[#D4AF37] text-white"
                    : "text-[#2A2A2A]/70 hover:text-[#2A2A2A] hover:bg-[#FBF8F4]"
                }`}
              >
                📊 Dashboard
              </Link>
              <Link
                href="/admin/restaurants"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/admin/restaurants"
                    ? "bg-[#D4AF37] text-white"
                    : "text-[#2A2A2A]/70 hover:text-[#2A2A2A] hover:bg-[#FBF8F4]"
                }`}
              >
                🏪 Quản lý quán
              </Link>
              <Link
                href="/admin/orders"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#FBF8F4] transition-colors text-[#2A2A2A]/70 hover:text-[#2A2A2A]"
              >
                <ClipboardList className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:block">
                  Quản lý
                </span>
              </Link>
              <Link
                href="/admin/daily-menu"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#FBF8F4] transition-colors text-[#2A2A2A]/70 hover:text-[#2A2A2A]"
              >
                <CalendarDays className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:block">
                  Thực đơn
                </span>
              </Link>
              <Link
                href="/admin/menu"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#FBF8F4] transition-colors text-[#2A2A2A]/70 hover:text-[#2A2A2A]"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:block">
                  Món ăn
                </span>
              </Link>
            </>
          )}
        </nav>

        {/* Notification & User Menu */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          <UserMenu />
        </div>
      </div>

      {/* Unpaid Orders Card */}
      {/* <UnpaidOrdersCard /> */}
    </header>
  );
}
