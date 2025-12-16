"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn, formatMoney } from "@/lib/utils";
import { AuthGuard } from "@/components/auth-guard";
import { Header } from "@/components/header";
import { useAuth } from "@/contexts/auth-context";
import {
  getDailyOrders,
  DailyOrderDoc,
  getTodayDate,
  updateOrderPaymentStatus,
} from "@/lib/api/daily-orders";
import {
  Calendar,
  RefreshCw,
  Loader2,
  User,
  Check,
  X,
  CreditCard,
  MoreVertical,
  Edit3,
} from "lucide-react";
import { categoryEmoji } from "@/lib/menu-store";
import { Button } from "@/components/ui/button";
import { PayOSPaymentModal } from "@/components/payos-payment-modal";

// Group orders by user
interface UserOrderGroup {
  userId: string;
  userName: string;
  userEmail: string;
  orders: DailyOrderDoc[];
  totalAmount: number;
  totalItems: number;
  allPaid: boolean;
}

function groupOrdersByUser(orders: DailyOrderDoc[]): UserOrderGroup[] {
  const userMap = new Map<string, UserOrderGroup>();

  for (const order of orders) {
    const existing = userMap.get(order.userId);
    if (existing) {
      existing.orders.push(order);
      existing.totalAmount += order.menuItemPrice * order.quantity;
      existing.totalItems += order.quantity;
      if (!order.isPaid) existing.allPaid = false;
    } else {
      userMap.set(order.userId, {
        userId: order.userId,
        userName: order.userName,
        userEmail: order.userEmail,
        orders: [order],
        totalAmount: order.menuItemPrice * order.quantity,
        totalItems: order.quantity,
        allPaid: order.isPaid || false,
      });
    }
  }

  return Array.from(userMap.values());
}

// Sort với current user lên đầu
function sortUserGroups(
  groups: UserOrderGroup[],
  currentUserId?: string
): UserOrderGroup[] {
  return groups.sort((a, b) => {
    // Current user luôn lên đầu
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    // Còn lại sort theo tên
    return a.userName.localeCompare(b.userName);
  });
}

// User Order Card Component
interface UserOrderCardProps {
  group: UserOrderGroup;
  isCurrentUser: boolean;
  onMarkPaid: (orderId: string, isPaid: boolean) => void;
  onMarkAllPaid: (orderIds: string[]) => void;
}

function UserOrderCard({
  group,
  isCurrentUser,
  onMarkPaid,
  onMarkAllPaid,
  selectedDate,
}: UserOrderCardProps & { selectedDate: string }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showPayOSModal, setShowPayOSModal] = useState(false);

  const handleTogglePaid = async (order: DailyOrderDoc) => {
    setUpdatingId(order.$id);
    const newStatus = !order.isPaid;
    const success = await updateOrderPaymentStatus(order.$id, newStatus);
    if (success) {
      onMarkPaid(order.$id, newStatus);
    }
    setUpdatingId(null);
  };

  const handlePayOSSuccess = async () => {
    const unpaidOrders = group.orders.filter((o) => !o.isPaid);
    for (const order of unpaidOrders) {
      await updateOrderPaymentStatus(order.$id, true);
    }
    onMarkAllPaid(unpaidOrders.map((o) => o.$id));
    setShowPayOSModal(false);
  };

  const unpaidAmount = group.orders
    .filter((o) => !o.isPaid)
    .reduce((sum, o) => sum + o.menuItemPrice * o.quantity, 0);

  return (
    <div className="bg-white rounded-2xl border border-[#E9D7B8]/50 overflow-hidden shadow-sm">
      {/* User Header */}
      <div className="p-4 border-b border-[#E9D7B8]/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E9D7B8]/30 flex items-center justify-center">
            <User className="w-5 h-5 text-[#2A2A2A]/60" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[#2A2A2A]">{group.userName}</h3>
              {isCurrentUser && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                  Bạn
                </span>
              )}
            </div>
            <p className="text-sm text-[#2A2A2A]/50">{group.totalItems} món</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Payment Status Badge */}
          {group.allPaid ? (
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> Đã thanh toán
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
              Chưa thanh toán
            </span>
          )}

          {/* Dropdown Menu - Only for current user */}
          {/* {isCurrentUser && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-8 h-8 rounded-lg bg-[#FBF8F4] flex items-center justify-center hover:bg-[#F5EDE3] transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-[#2A2A2A]/60" />
              </button>

              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-[#E9D7B8] overflow-hidden z-50">
                    {!group.allPaid && (
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          setShowPayOSModal(true);
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#FBF8F4] transition-colors text-left"
                      >
                        <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-sm font-medium text-[#2A2A2A]">
                          Thanh toán
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        setIsEditing(!isEditing);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#FBF8F4] transition-colors text-left"
                    >
                      <Edit3 className="w-4 h-4 text-[#2A2A2A]/60" />
                      <span className="text-sm font-medium text-[#2A2A2A]">
                        {isEditing ? "Đóng chỉnh sửa" : "Chỉnh sửa"}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )} */}
        </div>
      </div>

      {/* Orders List */}
      <div className="p-4 space-y-3">
        {group.orders.map((order) => (
          <div
            key={order.$id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-colors",
              order.isPaid ? "bg-green-50" : "bg-[#FBF8F4]"
            )}
          >
            {/* Dish Image/Emoji */}
            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center border border-[#E9D7B8]/30 shrink-0">
              <span className="text-2xl">
                {categoryEmoji[order.menuItemCategory] || "📍"}
              </span>
            </div>

            {/* Dish Info */}
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

            {/* Edit Actions */}
            {isCurrentUser && isEditing && (
              <button
                onClick={() => handleTogglePaid(order)}
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
            )}

            {/* Paid indicator when not editing */}
            {!isEditing && order.isPaid && (
              <span className="text-green-600">
                <Check className="w-5 h-5" />
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="px-4 py-3 border-t border-[#E9D7B8]/30 bg-[#FBF8F4] flex items-center justify-between">
        <span className="text-sm text-[#2A2A2A]/60">Tổng cộng</span>
        <span className="text-lg font-bold text-[#D4AF37]">
          {formatMoney(group.totalAmount)}
        </span>
      </div>

      {/* PayOS Payment Modal */}
      <PayOSPaymentModal
        open={showPayOSModal}
        amount={unpaidAmount}
        description={`Thanh toan don hang ${selectedDate}`}
        userName={group.userName}
        userId={group.userId}
        userEmail={group.userEmail}
        orderIds={group.orders.filter((o) => !o.isPaid).map((o) => o.$id)}
        onSuccess={handlePayOSSuccess}
        onClose={() => setShowPayOSModal(false)}
      />
    </div>
  );
}

function SummaryContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<DailyOrderDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getDailyOrders(selectedDate);
      setOrders(data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleMarkPaid = (orderId: string, isPaid: boolean) => {
    setOrders((prev) =>
      prev.map((o) => (o.$id === orderId ? { ...o, isPaid } : o))
    );
  };

  const handleMarkAllPaid = (orderIds: string[]) => {
    setOrders((prev) =>
      prev.map((o) => (orderIds.includes(o.$id) ? { ...o, isPaid: true } : o))
    );
  };

  const userGroups = sortUserGroups(groupOrdersByUser(orders), user?.$id);
  const totalAmount = orders.reduce(
    (sum, o) => sum + o.menuItemPrice * o.quantity,
    0
  );
  const totalItems = orders.reduce((sum, o) => sum + o.quantity, 0);
  const paidAmount = orders
    .filter((o) => o.isPaid)
    .reduce((sum, o) => sum + o.menuItemPrice * o.quantity, 0);

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

      {/* Header Bar */}
      <div className="relative z-10 px-6 py-4 border-b border-[#E9D7B8]/30 bg-white/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#D4AF37]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#E9D7B8] bg-white focus:outline-none focus:border-[#D4AF37] text-sm"
            />
          </div>
          <h1 className="text-xl font-bold text-[#2A2A2A]">Đơn hàng hôm nay</h1>
          <Button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="relative z-10 px-6 py-4 border-b border-[#E9D7B8]/30 bg-white/30">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-[#D4AF37]">
              {userGroups.length}
            </p>
            <p className="text-sm text-[#2A2A2A]/60">Người đặt</p>
          </div>
          <div className="w-px h-10 bg-[#E9D7B8]/50" />
          <div className="text-center">
            <p className="text-3xl font-bold text-[#D4AF37]">{totalItems}</p>
            <p className="text-sm text-[#2A2A2A]/60">Món</p>
          </div>
          <div className="w-px h-10 bg-[#E9D7B8]/50" />
          <div className="text-center">
            <p className="text-3xl font-bold text-[#D4AF37]">
              {formatMoney(totalAmount)}
            </p>
            <p className="text-sm text-[#2A2A2A]/60">Tổng tiền</p>
          </div>
          <div className="w-px h-10 bg-[#E9D7B8]/50" />
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {formatMoney(paidAmount)}
            </p>
            <p className="text-sm text-[#2A2A2A]/60">Đã thanh toán</p>
          </div>
        </div>
      </div>

      {/* User Order Cards */}
      <div className="relative z-10 max-w-4xl mx-auto p-6 space-y-4">
        {userGroups.length > 0 ? (
          userGroups.map((group) => (
            <UserOrderCard
              key={group.userId}
              group={group}
              isCurrentUser={user?.$id === group.userId}
              onMarkPaid={handleMarkPaid}
              onMarkAllPaid={handleMarkAllPaid}
              selectedDate={selectedDate}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-linear-to-br from-[#D4AF37]/20 to-[#D4AF37]/10 flex items-center justify-center mb-4">
              <span className="text-5xl">📋</span>
            </div>
            <p className="text-[#2A2A2A]/50 text-lg mb-4">
              Chưa có đơn hàng nào
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 rounded-xl bg-[#D4AF37] text-white font-medium hover:bg-[#C5A028] transition-colors"
            >
              Đặt món ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <AuthGuard>
      <Header />
      <div className="pt-16">
        <SummaryContent />
      </div>
    </AuthGuard>
  );
}
