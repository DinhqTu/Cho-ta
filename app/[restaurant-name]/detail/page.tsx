"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn, formatMoney } from "@/lib/utils";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/contexts/auth-context";
import {
  getTodayDate,
  getUserDailyOrdersWithDetails,
  DailyOrderWithDetails,
  getRestaurantDailyOrders,
} from "@/lib/api/daily-orders";
import { getRestaurantById, RestaurantDoc } from "@/lib/api/restaurants";
import {
  Calendar,
  RefreshCw,
  Loader2,
  User,
  Check,
  ArrowLeft,
  Eye,
  Edit3,
} from "lucide-react";
import { categoryEmoji } from "@/lib/menu-store";
import { Button } from "@/components/ui/button";
import { EditOrdersDialog } from "@/components/edit-orders-dialog";
import { toast } from "sonner";

// Group orders by user
interface UserOrderGroup {
  userId: string;
  userName: string;
  userEmail: string;
  orders: DailyOrderWithDetails[];
  totalAmount: number;
  totalItems: number;
  allPaid: boolean;
}

function groupOrdersByUser(orders: DailyOrderWithDetails[]): UserOrderGroup[] {
  const userMap = new Map<string, UserOrderGroup>();

  for (const order of orders) {
    const existing = userMap.get(order.userId);

    // Calculate total amount from single menu item
    const item = order.menuItemDetails[0];
    const orderTotal = (item?.price || 0) * order.quantity;

    if (existing) {
      existing.orders.push(order);
      existing.totalAmount += orderTotal;
      existing.totalItems += order.quantity;
      existing.allPaid = existing.allPaid && (order.isPaid || false);
    } else {
      userMap.set(order.userId, {
        userId: order.userId,
        userName: order.userName,
        userEmail: order.userEmail,
        orders: [order],
        totalAmount: orderTotal,
        totalItems: order.quantity,
        allPaid: order.isPaid || false,
      });
    }
  }

  return Array.from(userMap.values()).sort(
    (a, b) => b.totalItems - a.totalItems,
  );
}

export default function RestaurantDetailOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params["restaurant-name"] as string;
  const { user } = useAuth();

  const [restaurant, setRestaurant] = useState<RestaurantDoc | null>(null);
  const [orders, setOrders] = useState<DailyOrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserOrderGroup | null>(null);

  useEffect(() => {
    fetchRestaurantAndOrders();
  }, [restaurantId, selectedDate]);

  const fetchRestaurantAndOrders = async () => {
    setIsLoading(true);
    try {
      // Fetch restaurant info by ID
      const restaurantData = await getRestaurantById(restaurantId);
      if (!restaurantData) {
        toast.error("Không tìm thấy nhà hàng");
        return;
      }
      setRestaurant(restaurantData);

      // Fetch orders for this restaurant on selected date
      const restaurantOrders = await getRestaurantDailyOrders(
        restaurantData.$id,
        selectedDate,
      );

      // Fetch detailed orders with menu item information
      const detailedOrders: DailyOrderWithDetails[] = [];
      for (const order of restaurantOrders) {
        const orderWithDetails = await getUserDailyOrdersWithDetails(
          order.userId,
          selectedDate,
          restaurantData.$id,
        );
        const userOrderDetails = orderWithDetails.find(
          (o) => o.$id === order.$id,
        );
        if (userOrderDetails) {
          detailedOrders.push(userOrderDetails);
        }
      }

      setOrders(detailedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setIsLoading(false);
    }
  };

  const userGroups = groupOrdersByUser(orders);
  const totalAmount = userGroups.reduce(
    (sum, group) => sum + group.totalAmount,
    0,
  );
  const totalItems = userGroups.reduce(
    (sum, group) => sum + group.totalItems,
    0,
  );

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#F8F4EE]">
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
              <p className="text-[#2A2A2A]/50">Đang tải...</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F8F4EE]">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 rounded-lg bg-white flex items-center justify-center hover:bg-[#FBF8F4] transition-colors border border-[#E9D7B8]/30"
              >
                <ArrowLeft className="w-5 h-5 text-[#2A2A2A]" />
              </button>

              <div className="flex-1">
                <h1 className="text-2xl font-bold text-[#2A2A2A]">
                  {restaurant?.name || "Nhà hàng"}
                </h1>
                <p className="text-[#2A2A2A]/60">
                  Danh sách món đã đặt hôm nay
                </p>
              </div>

              <Button
                onClick={fetchRestaurantAndOrders}
                variant="outline"
                className="bg-white border-[#E9D7B8]/30 hover:bg-[#FBF8F4]"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Làm mới
              </Button>
            </div>

            {/* Date Selector */}
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-[#2A2A2A]/60" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#E9D7B8]/30 bg-white text-[#2A2A2A]"
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-[#E9D7B8]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-sm text-[#2A2A2A]/60">Người đặt</p>
                  <p className="text-xl font-bold text-[#2A2A2A]">
                    {userGroups.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-[#E9D7B8]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-sm text-[#2A2A2A]/60">Tổng món</p>
                  <p className="text-xl font-bold text-[#2A2A2A]">
                    {totalItems}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-[#E9D7B8]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                  <span className="text-lg">💰</span>
                </div>
                <div>
                  <p className="text-sm text-[#2A2A2A]/60">Tổng tiền</p>
                  <p className="text-xl font-bold text-[#D4AF37]">
                    {formatMoney(totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {userGroups.length > 0 ? (
              userGroups.map((group) => (
                <div
                  key={group.userId}
                  className="bg-white rounded-2xl border border-[#E9D7B8]/50 overflow-hidden shadow-sm"
                >
                  {/* User Header */}
                  <div className="p-4 border-b border-[#E9D7B8]/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#E9D7B8]/30 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#2A2A2A]/60" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[#2A2A2A]">
                            {group.userName}
                          </h3>
                        </div>
                        <p className="text-sm text-[#2A2A2A]/50">
                          {group.totalItems} món
                        </p>
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

                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          setEditingUser(group);
                          setShowEditDialog(true);
                        }}
                        className="w-8 h-8 rounded-lg bg-[#FBF8F4] flex items-center justify-center hover:bg-[#F5EDE3] transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-[#2A2A2A]/60" />
                      </button>
                    </div>
                  </div>

                  {/* Orders List */}
                  <div className="p-4 space-y-3">
                    {group.orders.map((order) => {
                      const item = order.menuItemDetails[0]; // Get single menu item

                      return (
                        <div
                          key={order.$id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl transition-colors",
                            order.isPaid ? "bg-green-50" : "bg-[#FBF8F4]",
                          )}
                        >
                          {/* Dish Image/Emoji */}
                          <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center border border-[#E9D7B8]/30 shrink-0">
                            <span className="text-2xl">
                              {categoryEmoji[item?.category] || "📍"}
                            </span>
                          </div>

                          {/* Dish Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#2A2A2A]/60">
                                {order.quantity}x
                              </span>
                              <h4 className="font-medium text-[#2A2A2A] truncate">
                                {item?.name || "Món ăn"}
                              </h4>
                            </div>
                            {order.note && (
                              <p className="text-xs text-[#2A2A2A]/50 mt-0.5">
                                Ghi chú: {order.note}
                              </p>
                            )}
                            <p className="text-sm font-semibold text-[#D4AF37] mt-1">
                              {formatMoney((item?.price || 0) * order.quantity)}
                            </p>
                          </div>

                          {/* Paid indicator */}
                          {order.isPaid && (
                            <span className="text-green-600">
                              <Check className="w-5 h-5" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Total */}
                  <div className="px-4 py-3 border-t border-[#E9D7B8]/30 bg-[#FBF8F4] flex items-center justify-between">
                    <span className="font-medium text-[#2A2A2A]">
                      Tổng ({group.totalItems} món)
                    </span>
                    <span className="text-lg font-bold text-[#D4AF37]">
                      {formatMoney(group.totalAmount)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto rounded-2xl bg-linear-to-br from-[#D4AF37]/20 to-[#D4AF37]/10 flex items-center justify-center mb-4">
                  <span className="text-5xl">📋</span>
                </div>
                <p className="text-[#2A2A2A]/50 text-lg">
                  Chưa có đơn hàng nào trong ngày này
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Orders Dialog */}
      {editingUser && (
        <EditOrdersDialog
          open={showEditDialog}
          orders={editingUser.orders}
          onClose={() => {
            setShowEditDialog(false);
            setEditingUser(null);
          }}
          onUpdate={fetchRestaurantAndOrders}
        />
      )}
    </AuthGuard>
  );
}
