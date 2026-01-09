"use client";

import { useState, useEffect } from "react";
import { cn, formatMoney } from "@/lib/utils";
import { AdminGuard } from "@/components/auth-guard";
import { Header } from "@/components/header";
import {
  getDailyOrders,
  getDailyOrderSummary,
  DailyOrderDoc,
  DailyOrderSummary,
  getTodayDate,
  updateOrderPaymentStatus,
} from "@/lib/api/daily-orders";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
  ShoppingBag,
  Banknote,
  Check,
  X,
  Loader2,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { categoryEmoji } from "@/lib/menu-store";
import { Button } from "@/components/ui/button";

// Group orders by user
interface UserOrderGroup {
  userId: string;
  userName: string;
  userEmail: string;
  orders: DailyOrderDoc[];
  totalAmount: number;
  totalItems: number;
  paidAmount: number;
  unpaidAmount: number;
}

function groupOrdersByUser(orders: DailyOrderDoc[]): UserOrderGroup[] {
  const userMap = new Map<string, UserOrderGroup>();

  for (const order of orders) {
    const amount = order.menuItemPrice * order.quantity;
    const existing = userMap.get(order.userId);

    if (existing) {
      existing.orders.push(order);
      existing.totalAmount += amount;
      existing.totalItems += order.quantity;
      if (order.isPaid) {
        existing.paidAmount += amount;
      } else {
        existing.unpaidAmount += amount;
      }
    } else {
      userMap.set(order.userId, {
        userId: order.userId,
        userName: order.userName,
        userEmail: order.userEmail,
        orders: [order],
        totalAmount: amount,
        totalItems: order.quantity,
        paidAmount: order.isPaid ? amount : 0,
        unpaidAmount: order.isPaid ? 0 : amount,
      });
    }
  }

  return Array.from(userMap.values()).sort((a, b) =>
    a.userName.localeCompare(b.userName)
  );
}

function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === today.toISOString().split("T")[0]) {
    return "Hôm nay";
  } else if (dateStr === yesterday.toISOString().split("T")[0]) {
    return "Hôm qua";
  }
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// User Card Component
function UserCard({
  group,
  onTogglePaid,
}: {
  group: UserOrderGroup;
  onTogglePaid: (orderId: string, isPaid: boolean) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleTogglePaid = async (order: DailyOrderDoc) => {
    setUpdatingId(order.$id);
    const newStatus = !order.isPaid;
    const success = await updateOrderPaymentStatus(order.$id, newStatus);
    if (success) {
      onTogglePaid(order.$id, newStatus);
    }
    setUpdatingId(null);
  };

  const allPaid = group.unpaidAmount === 0;

  return (
    <div className="bg-white rounded-2xl border border-[#E9D7B8]/50 overflow-hidden shadow-sm">
      {/* User Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FBF8F4]/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E9D7B8]/30 flex items-center justify-center">
            <User className="w-5 h-5 text-[#2A2A2A]/60" />
          </div>
          <div>
            <h3 className="font-semibold text-[#2A2A2A]">{group.userName}</h3>
            <p className="text-sm text-[#2A2A2A]/50">
              {group.totalItems} món • {formatMoney(group.totalAmount)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {allPaid ? (
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> Đã thanh toán
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
              Còn {formatMoney(group.unpaidAmount)}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-[#2A2A2A]/40" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#2A2A2A]/40" />
          )}
        </div>
      </div>

      {/* Orders List */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-[#E9D7B8]/30 pt-3">
          {group.orders.map((order) => (
            <div
              key={order.$id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-colors",
                order.isPaid ? "bg-green-50" : "bg-[#FBF8F4]"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-[#E9D7B8]/30 shrink-0">
                <span className="text-xl">
                  {categoryEmoji[order.menuItemCategory] || "📍"}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#2A2A2A]/60">
                    {order.quantity}x
                  </span>
                  <h4 className="font-medium text-[#2A2A2A] truncate">
                    {order.menuItemName}
                  </h4>
                </div>
                {order.note && (
                  <p className="text-xs text-[#2A2A2A]/50 mt-0.5">
                    Ghi chú: {order.note}
                  </p>
                )}
                <p className="text-sm font-semibold text-[#D4AF37] mt-1">
                  {formatMoney(order.menuItemPrice * order.quantity)}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTogglePaid(order);
                }}
                disabled={updatingId === order.$id}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1",
                  order.isPaid
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200",
                  updatingId === order.$id && "opacity-50"
                )}
              >
                {updatingId === order.$id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : order.isPaid ? (
                  <>
                    <X className="w-3 h-3" /> Hủy
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3" /> Đã trả
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminOrdersContent() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [orders, setOrders] = useState<DailyOrderDoc[]>([]);
  const [summary, setSummary] = useState<DailyOrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"users" | "dishes">("users");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordersData, summaryData] = await Promise.all([
        getDailyOrders(selectedDate),
        getDailyOrderSummary(selectedDate),
      ]);
      setOrders(ordersData);
      setSummary(summaryData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const goToToday = () => {
    setSelectedDate(getTodayDate());
  };

  const handleTogglePaid = (orderId: string, isPaid: boolean) => {
    setOrders((prev) =>
      prev.map((o) => (o.$id === orderId ? { ...o, isPaid } : o))
    );
  };

  const userGroups = groupOrdersByUser(orders);
  const totalAmount = orders.reduce(
    (sum, o) => sum + o.menuItemPrice * o.quantity,
    0
  );
  const totalItems = orders.reduce((sum, o) => sum + o.quantity, 0);
  const paidAmount = orders
    .filter((o) => o.isPaid)
    .reduce((sum, o) => sum + o.menuItemPrice * o.quantity, 0);

  const isToday = selectedDate === getTodayDate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
          <p className="text-[#2A2A2A]/50">Đang tải...</p>
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

      {/* Date Navigation */}
      <div className="relative z-10 px-6 py-4 border-b border-[#E9D7B8]/30 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <Button onClick={goToPreviousDay} className="p-2 rounded-lg">
              <ChevronLeft className="w-5 h-5 text-[#2A2A2A]/70" />
            </Button>

            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-[#D4AF37]" />
              <div className="text-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-lg font-bold text-[#2A2A2A] bg-transparent border-none focus:outline-none cursor-pointer"
                />
                <p className="text-sm text-[#2A2A2A]/50">
                  {formatDateDisplay(selectedDate)}
                </p>
              </div>
              {!isToday && (
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-xs rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-medium hover:bg-[#D4AF37]/30 transition-colors"
                >
                  Hôm nay
                </button>
              )}
            </div>

            <Button onClick={loadData} className="p-2 rounded-lg">
              <RefreshCw className="w-5 h-5 text-[#2A2A2A]/70" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 px-6 py-4 border-b border-[#E9D7B8]/30 bg-white/30">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-[#E9D7B8]/30">
            <div className="flex items-center gap-2 text-[#2A2A2A]/60 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Người đặt</span>
            </div>
            <p className="text-2xl font-bold text-[#D4AF37]">
              {userGroups.length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#E9D7B8]/30">
            <div className="flex items-center gap-2 text-[#2A2A2A]/60 mb-1">
              <ShoppingBag className="w-4 h-4" />
              <span className="text-sm">Tổng món</span>
            </div>
            <p className="text-2xl font-bold text-[#D4AF37]">{totalItems}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#E9D7B8]/30">
            <div className="flex items-center gap-2 text-[#2A2A2A]/60 mb-1">
              <Banknote className="w-4 h-4" />
              <span className="text-sm">Tổng tiền</span>
            </div>
            <p className="text-2xl font-bold text-[#D4AF37]">
              {formatMoney(totalAmount)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#E9D7B8]/30">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <Check className="w-4 h-4" />
              <span className="text-sm">Đã thu</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatMoney(paidAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode("users")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              viewMode === "users"
                ? "bg-[#D4AF37] text-white"
                : "bg-white text-[#2A2A2A]/70 hover:bg-[#FBF8F4]"
            )}
          >
            Theo người đặt
          </button>
          <button
            onClick={() => setViewMode("dishes")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              viewMode === "dishes"
                ? "bg-[#D4AF37] text-white"
                : "bg-white text-[#2A2A2A]/70 hover:bg-[#FBF8F4]"
            )}
          >
            Theo món ăn
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pb-6">
        {viewMode === "users" ? (
          // Users View
          <div className="space-y-3">
            {userGroups.length > 0 ? (
              userGroups.map((group) => (
                <UserCard
                  key={group.userId}
                  group={group}
                  onTogglePaid={handleTogglePaid}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/10 flex items-center justify-center mb-4">
                  <span className="text-5xl">📋</span>
                </div>
                <p className="text-[#2A2A2A]/50 text-lg">
                  Chưa có đơn hàng nào
                </p>
              </div>
            )}
          </div>
        ) : (
          // Dishes View
          <div className="space-y-3">
            {summary.length > 0 ? (
              summary.map((item) => (
                <div
                  key={item.menuItemId}
                  className="bg-white rounded-2xl border border-[#E9D7B8]/50 overflow-hidden shadow-sm"
                >
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[#FBF8F4] flex items-center justify-center border border-[#E9D7B8]/30 shrink-0">
                      <span className="text-3xl">
                        {categoryEmoji[item.menuItemCategory] || "📍"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#2A2A2A]">
                        {item.menuItemName}
                      </h3>
                      <p className="text-sm text-[#2A2A2A]/50">
                        {formatMoney(item.menuItemPrice)} / món
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#D4AF37]">
                        {item.totalQuantity}
                      </p>
                      <p className="text-sm text-[#2A2A2A]/50">
                        {formatMoney(item.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Who ordered */}
                  <div className="px-4 pb-4 pt-2 border-t border-[#E9D7B8]/30">
                    <p className="text-xs text-[#2A2A2A]/50 mb-2">Người đặt:</p>
                    <div className="flex flex-wrap gap-2">
                      {item.orders.map((order) => (
                        <span
                          key={order.orderId}
                          className="px-3 py-1 rounded-full bg-[#FBF8F4] text-sm text-[#2A2A2A]/70"
                        >
                          {order.userName}{" "}
                          {order.quantity > 1 && `(${order.quantity})`}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/10 flex items-center justify-center mb-4">
                  <span className="text-5xl">📋</span>
                </div>
                <p className="text-[#2A2A2A]/50 text-lg">
                  Chưa có đơn hàng nào
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <AdminGuard>
      <Header />
      <div className="pt-16">
        <AdminOrdersContent />
      </div>
    </AdminGuard>
  );
}
