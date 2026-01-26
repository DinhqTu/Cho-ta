"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { getRestaurantByName, RestaurantDoc } from "@/lib/api/restaurants";
import { getDailyMenusWithDetails, MenuItemDoc } from "@/lib/api/menu";
import { formatMoney } from "@/lib/utils";

interface CartItem extends MenuItemDoc {
  quantity: number;
  note?: string;
}
import {
  saveDailyOrder,
  getUserDailyOrdersWithDetails,
  updateOrder,
  deleteDailyOrder,
  DailyOrderWithDetails,
} from "@/lib/api/daily-orders";
import { useAuth } from "@/contexts/auth-context";

import { categoryEmoji } from "@/lib/menu-store";
import { toast } from "sonner";
import {
  MapPin,
  Clock,
  Truck,
  Heart,
  Share2,
  ArrowLeft,
  Check,
  Settings,
  Plus,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantName = params["restaurant-name"] as string;
  const { user } = useAuth();

  const [restaurant, setRestaurant] = useState<RestaurantDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemDoc[]>([]);
  const [initialOrders, setInitialOrders] = useState<DailyOrderWithDetails[]>(
    [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRestaurant();
  }, [restaurantName]);

  useEffect(() => {
    if (user && restaurant) {
      fetchTodayOrders();
    }
  }, [user, restaurant]);

  const fetchTodayOrders = async () => {
    if (!user || !restaurant) return;

    try {
      const orders = await getUserDailyOrdersWithDetails(
        user.$id,
        undefined,
        restaurant.$id,
      );

      // Store initial orders for comparison
      setInitialOrders(orders);

      // Convert existing orders to cart items
      const cartFromOrders = orders.map((order) => ({
        $id: order.menuItemDetails[0].$id,
        name: order.menuItemDetails[0].name,
        price: order.menuItemDetails[0].price,
        quantity: order.quantity,
        note: order.note,
        category: order.menuItemDetails[0].category,
        image: order.menuItemDetails[0].image,
        isActive: order.menuItemDetails[0].isActive,
        description: order.menuItemDetails[0].description,
        $createdAt: order.$createdAt,
        $updatedAt: order.$updatedAt,
      }));

      setCartItems(cartFromOrders);
    } catch (error) {
      console.error("Error fetching today's orders:", error);
    }
  };

  const fetchRestaurant = async () => {
    try {
      // Convert slug back to restaurant name (simple approach)
      // In a real app, you might store the slug in the database
      const nameFromSlug = restaurantName
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const data = await getRestaurantByName(nameFromSlug);

      if (data) {
        setRestaurant(data);

        // Fetch today's daily menu with full details
        const today = new Date().toISOString().split("T")[0];
        const menuType = data.menuType || "static";

        let dailyMenus = [];
        if (menuType === "static") {
          dailyMenus = await getDailyMenusWithDetails(
            data.$id,
            undefined,
            "static",
          );
        } else {
          dailyMenus = await getDailyMenusWithDetails(
            data.$id,
            today,
            "dynamic",
          );
        }

        if (dailyMenus.length > 0) {
          // Use menuItemDetails from relationship
          setMenuItems(dailyMenus[0].menuItemDetails || []);
        } else {
          setMenuItems([]);
        }
      } else {
        setRestaurant(null);
      }
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      toast.error("Không thể tải thông tin quán ăn.");
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: restaurant?.name,
          text: `Xem quán ăn ${restaurant?.name} trên Bát Cơm Mặn`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép link!");
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? "Đã bỏ thích" : "Đã thích quán ăn");
  };

  const handleAddToCart = (item: MenuItemDoc) => {
    const existingCartItem = cartItems.find(
      (cartItem) => cartItem.$id === item.$id,
    );

    if (existingCartItem) {
      // Update existing item quantity
      setCartItems(
        cartItems.map((cartItem) =>
          cartItem.$id === item.$id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        ),
      );
    } else {
      // Add new item to cart
      setCartItems([
        ...cartItems,
        {
          $id: item.$id,
          name: item.name,
          price: item.price,
          quantity: 1,
          category: item.category,
          image: item.image,
          isActive: item.isActive,
          description: item.description,
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(cartItems.filter((item) => item.$id !== itemId));
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      // Remove item from cart
      handleRemoveFromCart(itemId);
    } else {
      // Update item quantity
      setCartItems(
        cartItems.map((item) =>
          item.$id === itemId ? { ...item, quantity } : item,
        ),
      );
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  const hasCartChanged = () => {
    // Create maps for comparison
    const initialOrdersMap = new Map(
      initialOrders.map((order) => [
        order.menuItemDetails[0].$id,
        order.quantity,
      ]),
    );
    const currentCartMap = new Map(
      cartItems.map((item) => [item.$id, item.quantity]),
    );

    // Check if lengths are different
    if (initialOrdersMap.size !== currentCartMap.size) {
      return true;
    }

    // Check for quantity changes
    for (const [menuItemId, quantity] of currentCartMap) {
      const initialQuantity = initialOrdersMap.get(menuItemId);

      if (initialQuantity === undefined) {
        return true; // New item
      }

      if (initialQuantity !== quantity) {
        return true; // Quantity changed
      }
    }

    return false; // No changes
  };

  const handleOrder = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đặt món");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Giỏ hàng trống");
      return;
    }

    // If no changes, redirect to detail page
    if (!hasCartChanged()) {
      router.push(`/${restaurant?.$id}/detail`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Create maps for comparison
      const initialOrdersMap = new Map(
        initialOrders.map((order) => [order.menuItemDetails[0].$id, order]),
      );
      const currentCartMap = new Map(cartItems.map((item) => [item.$id, item]));

      const ordersToCreate: any[] = [];
      const ordersToUpdate: any[] = [];
      const ordersToDelete: string[] = [];

      // Check for new items and quantity changes
      for (const [menuItemId, cartItem] of currentCartMap) {
        const initialOrder = initialOrdersMap.get(menuItemId);

        if (!initialOrder) {
          // New item - create
          ordersToCreate.push({
            userId: user.$id,
            restaurantId: restaurant!.$id,
            menuItemId,
            quantity: cartItem.quantity,
            note: cartItem.note,
            isPaid: false,
          });
        } else if (initialOrder.quantity !== cartItem.quantity) {
          // Quantity changed - update
          ordersToUpdate.push({
            ...initialOrder,
            quantity: cartItem.quantity,
            note: cartItem.note,
          });
        }
      }

      // Check for deleted items
      for (const [menuItemId, initialOrder] of initialOrdersMap) {
        if (!currentCartMap.has(menuItemId)) {
          // Item deleted - delete
          ordersToDelete.push(initialOrder.$id);
        }
      }

      // Execute all operations
      const operations = [];
      console.log("ordersToCreate", ordersToCreate);
      if (ordersToCreate.length > 0) {
        console.log("create");
        operations.push(
          ...ordersToCreate.map((order) => saveDailyOrder(user!, order)),
        );
      }

      if (ordersToUpdate.length > 0) {
        // Update existing orders (quantity and note)
        const updatePromises = ordersToUpdate.map(async (order) => {
          console.log("update");
          const success = await updateOrder(
            order.$id,
            order.quantity,
            order.note,
          );
          if (!success) {
            throw new Error(`Failed to update order ${order.$id}`);
          }
          return success;
        });
        operations.push(...updatePromises);
      }

      if (ordersToDelete.length > 0) {
        // Delete orders
        const deletePromises = ordersToDelete.map(async (orderId) => {
          console.log("delete");
          const success = await deleteDailyOrder(orderId);
          if (!success) {
            throw new Error(`Failed to delete order ${orderId}`);
          }
          return success;
        });
        operations.push(...deletePromises);
      }

      await Promise.all(operations);

      // Refresh orders
      await fetchTodayOrders();

      toast.success("Cập nhật đơn hàng thành công!");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Có lỗi xảy ra khi cập nhật đơn hàng. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-white">
          {/* Loading skeleton */}
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200"></div>
            <div className="p-6 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!restaurant) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Không tìm thấy quán ăn
            </h1>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C5A028] transition-colors"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white">
        {/* Header Image */}
        <div className="relative h-64 md:h-80">
          <img
            src={
              restaurant.image ||
              "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=400&fit=crop"
            }
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />

          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            {user && restaurant.createdBy === user.$id && (
              <button
                onClick={() =>
                  router.push(`/restaurant/manage/${restaurant?.$id}`)
                }
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                title="Quản lý quán ăn"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleLike}
              className={`w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-colors ${
                isLiked
                  ? "bg-red-500 text-white"
                  : "bg-white/90 text-gray-700 hover:bg-white"
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={handleShare}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Status badge */}
          <div className="absolute bottom-4 left-4">
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Check className="w-4 h-4" />
              Đã duyệt
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Restaurant Info Section - According to drawing */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {restaurant.name}
            </h1>

            {/* Description moved under restaurant name */}
            {restaurant.description && (
              <div className="mb-6">
                <p className="text-gray-600 leading-relaxed">
                  {restaurant.description}
                </p>
              </div>
            )}

            {/* Info cards moved to right side */}
            <div className="">
              {/* Left side - Address and Features */}
              <div className="flex-1">
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{restaurant.address || "Địa chỉ đang cập nhật"}</span>
                  </div>
                </div>
              </div>

              {/* Right side - Quick Info Cards */}
              <div className="flex gap-4 w-full">
                <div className="bg-gray-50 rounded-xl p-4 text-center min-w-[120px]">
                  <Clock className="w-6 h-6 text-[#D4AF37] mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Chốt đơn</p>
                  <p className="text-sm text-gray-600">
                    {restaurant.orderDeadline}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center min-w-[120px]">
                  <Truck className="w-6 h-6 text-[#D4AF37] mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Giao hàng</p>
                  <p className="text-sm text-gray-600">
                    {restaurant.deliveryTime || "15-25 ph"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center min-w-[120px]">
                  <MapPin className="w-6 h-6 text-[#D4AF37] mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">
                    Khoảng cách
                  </p>
                  <p className="text-sm text-gray-600">
                    {restaurant.distance || "1.5 km"}
                  </p>
                </div>
                {restaurant.freeship && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center min-w-[120px]">
                    <Truck className="w-6 h-6 mx-auto text-[#D4AF37] mb-2" />
                    <p className="text-sm font-medium text-gray-900">
                      Freeship
                    </p>
                    <p className="text-sm">Miễn phí vận chuyển</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu and Cart Section - 3:1 Ratio */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-24">
            {/* Menu Items - 3 columns */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Thực đơn</h2>
                {user && restaurant.createdBy === user.$id && (
                  <button
                    onClick={() =>
                      router.push(`/restaurant/manage/${restaurant?.$id}`)
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-white text-sm rounded-lg hover:bg-[#C5A028] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm món
                  </button>
                )}
              </div>

              {menuItems.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <div className="text-gray-400 mb-4">
                    <svg
                      className="w-16 h-16 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Chưa có thực đơn
                  </h3>
                  <p className="text-gray-500">
                    Quán ăn đang cập nhật thực đơn
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {menuItems.map((item) => (
                    <div
                      key={item.$id}
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Image - 1/2 height */}
                      <div className="h-32 bg-gray-100 flex items-center justify-center text-4xl">
                        {categoryEmoji[item.category] || "🍽️"}
                      </div>

                      {/* Content - 1/2 height */}
                      <div className="p-3 h-[104px] flex flex-col justify-between">
                        {/* Name */}
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                          {item.name}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-gray-600 line-clamp-2 grow">
                          {item.description}
                        </p>

                        {/* Price and Button */}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-bold text-[#D4AF37]">
                            {formatMoney(item.price)}
                          </span>
                          <Button
                            onClick={() => handleAddToCart(item)}
                            className="size-6 text-white text-xs transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart - 1 column */}
            <div className="lg:col-span-1">
              <div className="space-y-5">
                {/* Cart Section */}
                <h3 className="text-lg font-semibold text-gray-900">
                  Giỏ hàng
                </h3>
                <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    {/* <span className="text-sm text-gray-500">
                      {getTotalItems()} món
                    </span> */}
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <svg
                          className="w-12 h-12 mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">Giỏ hàng trống</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="space-y-2 pb-3">
                          {cartItems.map((item) => (
                            <div
                              key={item.$id}
                              className="bg-white rounded-lg p-2"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-[#FBF8F4] flex items-center justify-center shrink-0">
                                  <span className="text-lg">
                                    {categoryEmoji[item.category] || "📍"}
                                  </span>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h5 className="font-semibold text-gray-900 text-sm line-clamp-1">
                                    {item.name}
                                  </h5>

                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-[#D4AF37]">
                                      {formatMoney(item.price * item.quantity)}
                                    </span>
                                    <div className="flex items-center rounded-xs">
                                      <Button
                                        onClick={() =>
                                          handleUpdateQuantity(
                                            item.$id,
                                            item.quantity - 1,
                                          )
                                        }
                                        variant="secondary"
                                        className="size-6 flex items-center justify-center font-medium text-xs"
                                      >
                                        <Minus />
                                      </Button>
                                      <span className="w-8 text-center text-xs font-semibold">
                                        {item.quantity}
                                      </span>
                                      <Button
                                        onClick={() =>
                                          handleUpdateQuantity(
                                            item.$id,
                                            item.quantity + 1,
                                          )
                                        }
                                        className="size-6 flex items-center justify-center font-medium text-xs"
                                      >
                                        <Plus />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="font-semibold text-gray-900">
                              Tổng cộng:
                            </span>
                            <span className="text-xl font-bold text-[#D4AF37]">
                              {formatMoney(getTotalPrice())}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {cartItems.length > 0 && (
                              <button
                                onClick={handleOrder}
                                disabled={isSubmitting}
                                className="w-full py-3 bg-[#D4AF37] text-white font-semibold rounded-xl hover:bg-[#C5A028] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSubmitting ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Đang cập nhật...</span>
                                  </div>
                                ) : hasCartChanged() ? (
                                  "Xác nhận đơn hàng"
                                ) : (
                                  "Xem đơn hàng"
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
