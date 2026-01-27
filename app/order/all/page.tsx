"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/contexts/auth-context";
import { formatMoney } from "@/lib/utils";
import { getAllUserOrdersWithDetails } from "@/lib/api/daily-orders";
import { DailyOrderWithDetails } from "@/lib/api/daily-orders";
import { RefreshCw, Loader2, ShoppingBag, Clock, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryEmoji } from "@/lib/menu-store";

// Date utilities
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

function getWeekdays(startDate: Date): Date[] {
  const weekdays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    weekdays.push(date);
  }
  return weekdays;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getWeekdayName(dateStr: string): string {
  const date = new Date(dateStr);
  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return weekdays[date.getDay()];
}

// Order Card Component
function OrderCard({ order }: { order: DailyOrderWithDetails }) {
  // Skip rendering if no menu item details
  if (!order.menuItemDetails || order.menuItemDetails.length === 0) {
    return null;
  }

  const menuItem = order.menuItemDetails[0];
  const emoji = categoryEmoji[menuItem.category] || "📍";

  return (
    <div className="bg-white rounded-xl border border-[#E9D7B8]/50 p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4 items-center">
        {/* Column 1 - Category Icon */}
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-[#F8F4EE] rounded-full flex items-center justify-center shrink-0">
            <span className="text-xl">{emoji}</span>
          </div>
        </div>

        {/* Column 2 - Order Time */}
        <div className="text-center flex items-center justify-center gap-2 text-sm text-[#2A2A2A]/70 font-bold">
          <span>
            {new Date(order.$createdAt).toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="flex items-center gap-2 font-bold">
          <span className="text-sm text-[#2A2A2A]/70">{menuItem.name}</span>
        </div>

        {/* Column 3 - Restaurant Info */}
        <div className="text-right grow">
          <div className="flex items-center justify-end gap-2 mb-1">
            <Store className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-medium text-[#2A2A2A]">
              {order.restaurantDetails?.name ||
                (typeof order.restaurantId === "string"
                  ? order.restaurantId
                  : "Quán ăn")}
            </span>
          </div>
          <div className="text-sm text-[#2A2A2A]/70">
            {order.quantity} phần •{" "}
            {formatMoney(menuItem.price * order.quantity)}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({
  icon: Icon,
  label,
  value,
  color = "text-[#D4AF37]",
}: {
  icon: any;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E9D7B8]/50 p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 bg-[#F8F4EE] rounded-lg flex items-center justify-center",
            color,
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-[#2A2A2A]/70">{label}</p>
          <p className="text-lg font-semibold text-[#2A2A2A]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function AllOrdersContent() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<DailyOrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalAmount: 0,
    totalItems: 0,
    paidAmount: 0,
  });

  const loadOrders = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const userOrders = await getAllUserOrdersWithDetails(user.$id);
      setOrders(userOrders);

      // Calculate stats
      const totalOrders = userOrders.length;
      const totalAmount = userOrders.reduce((sum, order) => {
        const menuItem = order.menuItemDetails[0];
        return sum + menuItem.price * order.quantity;
      }, 0);
      const totalItems = userOrders.reduce(
        (sum, order) => sum + order.quantity,
        0,
      );
      const paidAmount = userOrders
        .filter((order) => order.isPaid)
        .reduce((sum, order) => {
          const menuItem = order.menuItemDetails[0];
          return sum + menuItem.price * order.quantity;
        }, 0);

      setStats({
        totalOrders,
        totalAmount,
        totalItems,
        paidAmount,
      });
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
          <p className="text-[#2A2A2A]/50">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F4EE]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#D4AF37]/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#2A2A2A]">
              Lịch sử đơn hàng
            </h1>
            <p className="text-sm text-[#2A2A2A]/50">Tất cả đơn hàng của bạn</p>
          </div>
          <button
            onClick={loadOrders}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FBF8F4] hover:bg-[#F5EDE3] transition-colors text-[#2A2A2A]/70"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Làm mới</span>
          </button>
        </div>

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={ShoppingBag}
            label="Tổng đơn hàng"
            value={stats.totalOrders}
          />
          <StatsCard
            icon={UtensilsCrossed}
            label="Tổng món ăn"
            value={stats.totalItems}
          />
          <StatsCard
            icon={Calendar}
            label="Tổng chi tiêu"
            value={formatMoney(stats.totalAmount)}
          />
          <StatsCard
            icon={Calendar}
            label="Đã thanh toán"
            value={formatMoney(stats.paidAmount)}
            color="text-green-600"
          />
        </div> */}

        {/* Orders List */}
        <div className="bg-white rounded-xl border border-[#E9D7B8]/50 p-6">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-[#2A2A2A]/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#2A2A2A] mb-2">
                Chưa có đơn hàng nào
              </h3>
              <p className="text-[#2A2A2A]/50 mb-6">
                Bạn chưa đặt món ăn nào cả
              </p>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C5A028] transition-colors"
              >
                Đặt món ngay
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.$id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AllOrdersPage() {
  return (
    <AuthGuard>
      <AllOrdersContent />
    </AuthGuard>
  );
}
