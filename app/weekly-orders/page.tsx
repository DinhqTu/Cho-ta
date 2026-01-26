"use client";

import { useState, useEffect } from "react";
import { cn, formatMoney } from "@/lib/utils";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/contexts/auth-context";
import {
  getDailyOrders,
  DailyOrderDoc,
  getTodayDate,
  updateOrderPaymentStatus,
  getAllDailyOrdersWithDetails,
  DailyOrderWithDetails,
} from "@/lib/api/daily-orders";
import { MenuItemDoc } from "@/lib/api/menu";
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
} from "lucide-react";
import { categoryEmoji } from "@/lib/menu-store";
import { Button } from "@/components/ui/button";

// Get Monday of a week
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// Get Friday of a week
function getFriday(date: Date): Date {
  const monday = getMonday(date);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return friday;
}

// Get all weekdays (Mon-Fri) for a week
function getWeekdays(monday: Date): Date[] {
  const weekdays: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    weekdays.push(day);
  }
  return weekdays;
}

// Format date to YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Format weekday display
function formatWeekday(dateStr: string): string {
  const date = new Date(dateStr);
  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return weekdays[date.getDay()];
}

// User weekly summary
interface UserWeeklySummary {
  userId: string;
  userName: string;
  userEmail: string;
  dailyOrders: Map<string, DailyOrderWithDetails[]>;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}

function groupWeeklyOrdersByUser(
  ordersByDate: Map<string, DailyOrderWithDetails[]>,
): UserWeeklySummary[] {
  const userMap = new Map<string, UserWeeklySummary>();

  ordersByDate.forEach((orders, date) => {
    orders.forEach((order) => {
      const menuItem = order.menuItemDetails[0];
      const amount = menuItem.price * order.quantity;
      const existing = userMap.get(order.userId);

      if (existing) {
        const dailyOrders = existing.dailyOrders.get(date) || [];
        dailyOrders.push(order);
        existing.dailyOrders.set(date, dailyOrders);
        existing.totalAmount += amount;
        if (order.isPaid) {
          existing.paidAmount += amount;
        } else {
          existing.unpaidAmount += amount;
        }
      } else {
        const dailyOrders = new Map<string, DailyOrderWithDetails[]>();
        dailyOrders.set(date, [order]);
        userMap.set(order.userId, {
          userId: order.userId,
          userName: order.userName,
          userEmail: order.userEmail,
          dailyOrders,
          totalAmount: amount,
          paidAmount: order.isPaid ? amount : 0,
          unpaidAmount: order.isPaid ? 0 : amount,
        });
      }
    });
  });

  return Array.from(userMap.values()).sort((a, b) =>
    a.userName.localeCompare(b.userName),
  );
}

// Order Card Component
function OrderCard({
  order,
  onTogglePaid,
  isAdmin = false,
}: {
  order: DailyOrderWithDetails;
  onTogglePaid: (orderId: string, isPaid: boolean) => void;
  isAdmin?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const menuItem = order.menuItemDetails[0];

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    const newStatus = !order.isPaid;
    const success = await updateOrderPaymentStatus(order.$id, newStatus);
    if (success) {
      onTogglePaid(order.$id, newStatus);
    }
    setIsUpdating(false);
  };

  return (
    <div
      className={cn(
        "relative group p-2 rounded-lg border transition-all",
        order.isPaid
          ? "bg-green-50 border-green-200"
          : "bg-amber-50 border-amber-200",
        isHovered && "shadow-md",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">
          {categoryEmoji[menuItem.category] || "📍"}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#2A2A2A] truncate">
            {menuItem.name}
          </p>
          <p className="text-xs text-[#2A2A2A]/50">x{order.quantity}</p>
        </div>
      </div>

      {/* Hover overlay with toggle button - Only for admin */}
      {isHovered && isAdmin && (
        <div className="absolute inset-0 bg-white/95 rounded-lg flex items-center justify-center">
          <button
            onClick={handleToggle}
            disabled={isUpdating}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1",
              order.isPaid
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "bg-green-500 text-white hover:bg-green-600",
              isUpdating && "opacity-50 cursor-not-allowed",
            )}
          >
            {isUpdating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : order.isPaid ? (
              <>
                <X className="w-3 h-3" /> Hủy
              </>
            ) : (
              <>
                <Check className="w-3 h-3" /> Trả
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// Table Cell Component
function TableCell({
  orders,
  onTogglePaid,
  isAdmin = false,
}: {
  orders: DailyOrderWithDetails[];
  onTogglePaid: (orderId: string, isPaid: boolean) => void;
  isAdmin?: boolean;
}) {
  if (!orders || orders.length === 0) {
    return (
      <td className="border border-[#E9D7B8]/30 p-3 bg-gray-50/50 min-w-[180px]">
        <p className="text-xs text-[#2A2A2A]/30 text-center">-</p>
      </td>
    );
  }

  const totalAmount = orders.reduce(
    (sum, o) => sum + o.menuItemDetails[0].price * o.quantity,
    0,
  );
  const paidAmount = orders
    .filter((o) => o.isPaid)
    .reduce((sum, o) => sum + o.menuItemDetails[0].price * o.quantity, 0);
  const unpaidAmount = totalAmount - paidAmount;
  const allPaid = unpaidAmount === 0;

  return (
    <td
      className={cn(
        "border border-[#E9D7B8]/30 p-3 min-w-[180px] align-top",
        allPaid ? "bg-green-50/30" : "bg-amber-50/30",
      )}
    >
      <div className="space-y-2">
        {/* Order cards */}
        {orders.map((order) => (
          <OrderCard
            key={order.$id}
            order={order}
            onTogglePaid={onTogglePaid}
            isAdmin={isAdmin}
          />
        ))}

        {/* Summary */}
        {/* <div
          className={cn(
            "pt-2 border-t space-y-1",
            allPaid ? "border-green-200" : "border-amber-200",
          )}
        > 
          {paidAmount > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">
                  Đã trả:
                </span>
              </div>
              <span className="text-sm font-bold text-green-600">
                {formatMoney(paidAmount)}
              </span>
            </div>
          )}

          {unpaidAmount > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <X className="w-3 h-3 text-amber-600" />
                <span className="text-xs text-amber-600 font-medium">
                  Chưa trả:
                </span>
              </div>
              <span className="text-sm font-bold text-amber-600">
                {formatMoney(unpaidAmount)}
              </span>
            </div>
          )}
        </div> */}
      </div>
    </td>
  );
}

function WeeklyOrdersContent() {
  const { isAdmin } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    getMonday(new Date()),
  );
  const [ordersByDate, setOrdersByDate] = useState<
    Map<string, DailyOrderWithDetails[]>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const weekdays = getWeekdays(currentWeekStart);
  const weekdayDates = weekdays.map(formatDate);

  const loadWeekData = async () => {
    setIsLoading(true);
    try {
      const ordersMap = new Map<string, DailyOrderWithDetails[]>();
      await Promise.all(
        weekdayDates.map(async (date) => {
          const orders = await getAllDailyOrdersWithDetails(date);
          ordersMap.set(date, orders);
        }),
      );
      setOrdersByDate(ordersMap);
    } catch (error) {
      console.error("Error loading week data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWeekData();
  }, [currentWeekStart]);

  const goToPreviousWeek = () => {
    const newMonday = new Date(currentWeekStart);
    newMonday.setDate(newMonday.getDate() - 7);
    setCurrentWeekStart(newMonday);
  };

  const goToNextWeek = () => {
    const newMonday = new Date(currentWeekStart);
    newMonday.setDate(newMonday.getDate() + 7);
    setCurrentWeekStart(newMonday);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getMonday(new Date()));
  };

  const handleTogglePaid = (orderId: string, isPaid: boolean) => {
    setOrdersByDate((prev) => {
      const newMap = new Map(prev);
      newMap.forEach((orders, date) => {
        const updatedOrders = orders.map((o) =>
          o.$id === orderId ? { ...o, isPaid } : o,
        );
        newMap.set(date, updatedOrders);
      });
      return newMap;
    });
  };

  const userSummaries = groupWeeklyOrdersByUser(ordersByDate);

  // Calculate column totals (per day)
  const columnTotals = weekdayDates.map((date) => {
    const orders = ordersByDate.get(date) || [];
    const total = orders.reduce(
      (sum, o) => sum + o.menuItemDetails[0].price * o.quantity,
      0,
    );
    const paid = orders
      .filter((o) => o.isPaid)
      .reduce((sum, o) => sum + o.menuItemDetails[0].price * o.quantity, 0);
    return { total, paid, unpaid: total - paid };
  });

  // Calculate overall totals
  let totalOrders = 0;
  let totalAmount = 0;
  let paidAmount = 0;

  ordersByDate.forEach((orders) => {
    orders.forEach((order) => {
      totalOrders += order.quantity;
      const amount = order.menuItemDetails[0].price * order.quantity;
      totalAmount += amount;
      if (order.isPaid) {
        paidAmount += amount;
      }
    });
  });

  const isCurrentWeek =
    formatDate(currentWeekStart) === formatDate(getMonday(new Date()));
  const weekEndDate = getFriday(currentWeekStart);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
          <p className="text-[#2A2A2A]/50">Đang tải dữ liệu tuần...</p>
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

      {/* Week Navigation */}
      <div className="relative z-10 px-3 py-4 border-b border-[#E9D7B8]/30 bg-white/50 backdrop-blur-sm sticky top-16">
        <div className="max-w-[98%] mx-auto">
          <div className="flex items-center justify-between">
            <Button
              onClick={goToPreviousWeek}
              variant="ghost"
              className="p-2 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-[#D4AF37]" />
              <div className="text-center">
                <h2 className="text-lg font-bold text-[#2A2A2A]">
                  Tuần {formatDate(currentWeekStart).slice(5)} -{" "}
                  {formatDate(weekEndDate).slice(5)}
                </h2>
                <p className="text-sm text-[#2A2A2A]/50">
                  {currentWeekStart.toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "long",
                  })}{" "}
                  -{" "}
                  {weekEndDate.toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              {!isCurrentWeek && (
                <button
                  onClick={goToCurrentWeek}
                  className="px-3 py-1 text-xs rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-medium hover:bg-[#D4AF37]/30 transition-colors"
                >
                  Tuần này
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={loadWeekData}
                variant="ghost"
                className="p-2 rounded-lg"
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
              <Button
                onClick={goToNextWeek}
                variant="ghost"
                className="p-2 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Week Stats */}
      <div className="relative z-10 px-3 py-4 border-b border-[#E9D7B8]/30 bg-white/30">
        <div className="max-w-[98%] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-[#E9D7B8]/30">
            <div className="flex items-center gap-2 text-[#2A2A2A]/60 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Người đặt</span>
            </div>
            <p className="text-2xl font-bold text-[#D4AF37]">
              {userSummaries.length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#E9D7B8]/30">
            <div className="flex items-center gap-2 text-[#2A2A2A]/60 mb-1">
              <ShoppingBag className="w-4 h-4" />
              <span className="text-sm">Tổng món</span>
            </div>
            <p className="text-2xl font-bold text-[#D4AF37]">{totalOrders}</p>
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

      {/* Calendar Table */}
      <div className="relative z-10 max-w-[98%] mx-auto px-3 py-6">
        <div className="bg-white rounded-2xl border border-[#E9D7B8]/50 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#FBF8F4]">
                  <th className="border border-[#E9D7B8]/30 p-3 text-left font-semibold text-[#2A2A2A] sticky left-0 bg-[#FBF8F4] z-10 min-w-[150px]">
                    Người đặt
                  </th>
                  {weekdayDates.map((date, index) => (
                    <th
                      key={date}
                      className="border border-[#E9D7B8]/30 p-3 text-center font-semibold text-[#2A2A2A] min-w-[180px]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm">{formatWeekday(date)}</span>
                        <span className="text-xs text-[#2A2A2A]/50">
                          {date.slice(5)}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="border border-[#E9D7B8]/30 p-3 text-center font-semibold text-[#2A2A2A] bg-[#FBF8F4] min-w-[120px]">
                    Tổng tuần
                  </th>
                </tr>
              </thead>
              <tbody>
                {userSummaries.length > 0 ? (
                  <>
                    {userSummaries.map((user) => (
                      <tr key={user.userId} className="hover:bg-[#FBF8F4]/30">
                        <td className="border border-[#E9D7B8]/30 p-3 font-medium text-[#2A2A2A] sticky left-0 bg-white z-10">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#E9D7B8]/30 flex items-center justify-center text-xs">
                              {user.userName.charAt(0)}
                            </div>
                            <span className="truncate">{user.userName}</span>
                          </div>
                        </td>
                        {weekdayDates.map((date) => (
                          <TableCell
                            key={date}
                            orders={user.dailyOrders.get(date) || []}
                            onTogglePaid={handleTogglePaid}
                            isAdmin={isAdmin}
                          />
                        ))}
                        <td className="border border-[#E9D7B8]/30 p-3 bg-[#FBF8F4] text-center">
                          <div className="flex flex-col gap-1">
                            <span className="text-lg font-bold text-[#D4AF37]">
                              {formatMoney(user.totalAmount)}
                            </span>
                            {/* {user.unpaidAmount > 0 && (
                              <span className="text-xs text-amber-600">
                                Còn {formatMoney(user.unpaidAmount)}
                              </span>
                            )} */}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Summary Row */}
                    <tr className="bg-[#FBF8F4] font-semibold">
                      <td className="border border-[#E9D7B8]/30 p-3 sticky left-0 bg-[#FBF8F4] z-10">
                        Tổng ngày
                      </td>
                      {columnTotals.map((colTotal, index) => (
                        <td
                          key={index}
                          className="border border-[#E9D7B8]/30 p-3 text-center"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-[#D4AF37]">
                              {formatMoney(colTotal.total)}
                            </span>
                            {/* {colTotal.unpaid > 0 && (
                              <span className="text-xs text-amber-600">
                                Chưa: {formatMoney(colTotal.unpaid)}
                              </span>
                            )} */}
                          </div>
                        </td>
                      ))}
                      <td className="border border-[#E9D7B8]/30 p-3 text-center bg-[#D4AF37]/10">
                        <span className="text-xl font-bold text-[#D4AF37]">
                          {formatMoney(totalAmount)}
                        </span>
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="border border-[#E9D7B8]/30 p-12 text-center"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/10 flex items-center justify-center">
                          <span className="text-5xl">📋</span>
                        </div>
                        <p className="text-[#2A2A2A]/50 text-lg">
                          Chưa có đơn hàng nào trong tuần này
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-50 border border-green-200" />
            <span className="text-[#2A2A2A]/60">Đã thanh toán</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-50 border border-amber-200" />
            <span className="text-[#2A2A2A]/60">Chưa thanh toán</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-50 border border-gray-200" />
            <span className="text-[#2A2A2A]/60">Không đặt món</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WeeklyOrdersPage() {
  return (
    <AuthGuard>
      <div className="pt-16">
        <WeeklyOrdersContent />
      </div>
    </AuthGuard>
  );
}
