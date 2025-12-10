"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MenuItem } from "@/lib/menu-data";
import { formatMoney } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { OrderItem } from "@/lib/order-store";
import {
  saveDailyOrders,
  DailyOrderInput,
  getUserDailyOrders,
  DailyOrderDoc,
} from "@/lib/api/daily-orders";
import { getTodayMenu, getTodayDate } from "@/lib/api/daily-menu";
import { Header } from "@/components/header";
import { ChatBox } from "@/components/chat-box";
import { AuthGuard } from "@/components/auth-guard";
import { categoryEmoji } from "@/lib/menu-store";
import {
  Plus,
  Minus,
  X,
  ShoppingCart,
  Loader2,
  StickyNote,
  Trash2,
  Check,
  ClipboardList,
} from "lucide-react";

// Add Item Modal
function AddItemModal({
  item,
  existingOrder,
  onAdd,
  onClose,
}: {
  item: MenuItem;
  existingOrder?: OrderItem;
  onAdd: (item: MenuItem, quantity: number, note?: string) => void;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState(existingOrder?.quantity || 1);
  const [note, setNote] = useState(existingOrder?.note || "");

  const handleSubmit = () => {
    if (quantity > 0) {
      onAdd(item, quantity, note);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#E9D7B8] overflow-hidden">
        <div className="p-5 border-b border-[#E9D7B8]/30 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#2A2A2A]">Thêm món</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FBF8F4] flex items-center justify-center hover:bg-[#F5EDE3] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#FBF8F4] to-[#F5EDE3] flex items-center justify-center border border-[#E9D7B8]/30">
              <span className="text-4xl">
                {categoryEmoji[item.category] || "🍽️"}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#2A2A2A]">{item.name}</h3>
              <p className="text-sm text-[#2A2A2A]/50">{item.description}</p>
              <p className="text-lg font-bold text-[#D4AF37] mt-1">
                {formatMoney(item.price)}
              </p>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#2A2A2A]/70 mb-2">
              Số lượng
            </label>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-xl bg-[#FBF8F4] flex items-center justify-center hover:bg-[#F5EDE3] transition-colors border border-[#E9D7B8]"
              >
                <Minus className="w-5 h-5 text-[#2A2A2A]" />
              </button>
              <span className="text-3xl font-bold text-[#2A2A2A] w-16 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-xl bg-[#D4AF37] flex items-center justify-center hover:bg-[#C5A028] transition-colors text-white"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#2A2A2A]/70 mb-2 flex items-center gap-2">
              <StickyNote className="w-4 h-4" /> Ghi chú
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Yêu cầu đặc biệt..."
              className="w-full px-4 py-3 rounded-xl border border-[#E9D7B8] bg-white focus:outline-none focus:border-[#D4AF37] transition-colors resize-none h-20"
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#FBF8F4] mb-4">
            <span className="text-[#2A2A2A]/70">Tổng</span>
            <span className="text-xl font-bold text-[#D4AF37]">
              {formatMoney(item.price * quantity)}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#E9D7B8] text-[#2A2A2A] font-medium hover:bg-[#FBF8F4] transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-xl bg-[#D4AF37] text-white font-semibold hover:bg-[#C5A028] transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> {existingOrder ? "Cập nhật" : "Thêm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cart Modal
function CartModal({
  orders,
  onUpdateQuantity,
  onRemove,
  onPlaceOrder,
  onClose,
  isSaving,
}: {
  orders: OrderItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onPlaceOrder: () => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const totalAmount = orders.reduce(
    (sum, o) => sum + o.item.price * o.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:w-[90%] max-w-lg max-h-[85vh] shadow-2xl border border-[#E9D7B8] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-[#E9D7B8]/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-lg font-semibold text-[#2A2A2A]">Giỏ hàng</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FBF8F4] flex items-center justify-center hover:bg-[#F5EDE3] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {orders.map((order) => (
            <div
              key={order.item.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#FBF8F4] border border-[#E9D7B8]/30"
            >
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shrink-0">
                <span className="text-2xl">
                  {categoryEmoji[order.item.category] || "🍽️"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-[#2A2A2A] truncate">
                  {order.item.name}
                </h4>
                <p className="text-sm text-[#D4AF37] font-medium">
                  {formatMoney(order.item.price)}
                </p>
                {order.note && (
                  <p className="text-xs text-[#2A2A2A]/50 truncate mt-1">
                    📝 {order.note}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onUpdateQuantity(order.item.id, order.quantity - 1)
                  }
                  className="w-8 h-8 rounded-lg bg-white flex items-center justify-center hover:bg-[#F5EDE3] transition-colors border border-[#E9D7B8]"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold">
                  {order.quantity}
                </span>
                <button
                  onClick={() =>
                    onUpdateQuantity(order.item.id, order.quantity + 1)
                  }
                  className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center hover:bg-[#C5A028] transition-colors text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onRemove(order.item.id)}
                  className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors ml-2"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-5 border-t border-[#E9D7B8]/30 shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[#2A2A2A]/70">Tổng cộng</span>
            <span className="text-2xl font-bold text-[#D4AF37]">
              {formatMoney(totalAmount)}
            </span>
          </div>
          <button
            onClick={onPlaceOrder}
            disabled={isSaving || orders.length === 0}
            className="w-full py-4 rounded-xl bg-[#D4AF37] text-white font-semibold hover:bg-[#C5A028] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            {isSaving ? "Đang đặt..." : "Xác nhận đặt món"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Existing Orders Modal
function ExistingOrdersModal({
  orders,
  onClose,
}: {
  orders: DailyOrderDoc[];
  onClose: () => void;
}) {
  const totalAmount = orders.reduce(
    (sum, o) => sum + o.menuItemPrice * o.quantity,
    0
  );
  const totalItems = orders.reduce((sum, o) => sum + o.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:w-[90%] max-w-lg max-h-[85vh] shadow-2xl border border-[#E9D7B8] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-[#E9D7B8]/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-[#2A2A2A]">
              Đơn hàng hôm nay
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FBF8F4] flex items-center justify-center hover:bg-[#F5EDE3] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {orders.map((order) => (
            <div
              key={order.$id}
              className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200"
            >
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shrink-0">
                <span className="text-2xl">
                  {categoryEmoji[order.menuItemCategory] || "🍽️"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-[#2A2A2A] truncate">
                  {order.menuItemName}
                </h4>
                <p className="text-sm text-green-600 font-medium">
                  {formatMoney(order.menuItemPrice)} × {order.quantity}
                </p>
                {order.note && (
                  <p className="text-xs text-[#2A2A2A]/50 truncate mt-1">
                    📝 {order.note}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">
                  {formatMoney(order.menuItemPrice * order.quantity)}
                </p>
                <p className="text-xs text-green-500">✓ Đã đặt</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-5 border-t border-[#E9D7B8]/30 shrink-0 bg-green-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#2A2A2A]/70">{totalItems} món đã đặt</span>
            <span className="text-2xl font-bold text-green-600">
              {formatMoney(totalAmount)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// Dish Card
function DishCard({
  item,
  orderQuantity,
  onAdd,
}: {
  item: MenuItem;
  orderQuantity?: number;
  onAdd: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E9D7B8]/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="h-32 bg-gradient-to-br from-[#FBF8F4] to-[#F5EDE3] flex items-center justify-center relative">
        <span className="text-6xl">{categoryEmoji[item.category] || "🍽️"}</span>
        {typeof orderQuantity === "number" && orderQuantity > 0 && (
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#D4AF37] text-white flex items-center justify-center font-bold text-sm shadow-md">
            {orderQuantity}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-[#2A2A2A] line-clamp-1">
            {item.name}
          </h3>
          <span className="text-sm px-2 py-0.5 rounded-full bg-[#FBF8F4] text-[#2A2A2A]/60 shrink-0">
            {item.category}
          </span>
        </div>
        <p className="text-sm text-[#2A2A2A]/50 line-clamp-2 mb-3 min-h-[40px]">
          {item.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-[#D4AF37]">
            {formatMoney(item.price)}
          </span>
          <button
            onClick={onAdd}
            className="w-10 h-10 rounded-xl bg-[#D4AF37] text-white flex items-center justify-center hover:bg-[#C5A028] transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Content
function TodayMenuContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [existingOrders, setExistingOrders] = useState<DailyOrderDoc[]>([]);
  const [showExistingOrders, setShowExistingOrders] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingMenu(true);
      try {
        const todayMenu = await getTodayMenu();
        if (todayMenu && todayMenu.menuItems.length > 0) {
          const items: MenuItem[] = todayMenu.menuItems.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            image: item.image || "",
          }));
          setMenuItems(items);
        } else {
          setMenuItems([]);
        }
        if (user) {
          const userOrders = await getUserDailyOrders(user.$id);
          setExistingOrders(userOrders);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setMenuItems([]);
      } finally {
        setIsLoadingMenu(false);
      }
    };
    loadData();
  }, [user]);

  const handleAddItem = useCallback(
    (item: MenuItem, quantity: number, note?: string) => {
      setOrders((prev) => {
        const existing = prev.find((o) => o.item.id === item.id);
        if (existing) {
          if (quantity <= 0) return prev.filter((o) => o.item.id !== item.id);
          return prev.map((o) =>
            o.item.id === item.id ? { ...o, quantity, note: note || o.note } : o
          );
        }
        if (quantity <= 0) return prev;
        return [...prev, { item, quantity, note }];
      });
    },
    []
  );

  const handleUpdateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        setOrders((prev) => prev.filter((o) => o.item.id !== itemId));
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.item.id === itemId ? { ...o, quantity } : o))
        );
      }
    },
    []
  );

  const handleRemoveItem = useCallback((itemId: string) => {
    setOrders((prev) => prev.filter((o) => o.item.id !== itemId));
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    if (!user || orders.length === 0) return;
    setIsSaving(true);
    try {
      const dailyOrders: DailyOrderInput[] = orders.map((o) => ({
        menuItemId: o.item.id,
        menuItemName: o.item.name,
        menuItemPrice: o.item.price,
        menuItemCategory: o.item.category,
        quantity: o.quantity,
        note: o.note,
      }));
      const success = await saveDailyOrders(user, dailyOrders);
      if (success) {
        setShowCart(false);
        router.push("/summary");
      } else {
        alert("Không thể đặt món. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Không thể đặt món. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  }, [orders, user, router]);

  const totalItems = orders.reduce((sum, o) => sum + o.quantity, 0);
  const totalAmount = orders.reduce(
    (sum, o) => sum + o.item.price * o.quantity,
    0
  );
  const getOrderQuantity = (itemId: string) =>
    orders.find((o) => o.item.id === itemId)?.quantity || 0;
  const getExistingOrder = (itemId: string) =>
    orders.find((o) => o.item.id === itemId);

  if (isLoadingMenu) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
          <p className="text-[#2A2A2A]/50">Đang tải menu...</p>
        </div>
      </div>
    );
  }

  if (menuItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F4EE]">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/10 flex items-center justify-center mb-6">
              <span className="text-6xl">📋</span>
            </div>
            <h2 className="text-2xl font-bold text-[#2A2A2A] mb-2">
              Chưa có menu hôm nay
            </h2>
            <p className="text-[#2A2A2A]/50 mb-6">
              Menu ngày {getTodayDate()} chưa được thiết lập
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F4EE]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8F4EE] via-[#F5EDE3] to-[#EDE5D8]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#D4AF37]/8 rounded-full blur-3xl" />
      </div>

      <Header />

      <div className="relative z-10 pt-20 pb-32 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#2A2A2A] mb-2">
            Hôm Nay Ăn Giề
          </h1>
          <p className="text-[#2A2A2A]/50">
            {getTodayDate()} • {menuItems.length} món
          </p>

          {existingOrders.length > 0 && (
            <button
              onClick={() => setShowExistingOrders(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium hover:bg-green-200 transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Bạn đã đặt{" "}
              {existingOrders.reduce((sum, o) => sum + o.quantity, 0)} món hôm
              nay
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <DishCard
              key={item.id}
              item={item}
              orderQuantity={getOrderQuantity(item.id)}
              onAdd={() => setSelectedItem(item)}
            />
          ))}
        </div>

        {/* Chat Box */}
        <div className="mt-8">
          <ChatBox />
        </div>
      </div>

      {/* Bottom Cart Bar */}
      {orders.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E9D7B8] shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-center gap-6">
            <button
              onClick={() => setShowCart(true)}
              className="flex items-center gap-4 px-6 py-3 rounded-xl bg-[#FBF8F4] hover:bg-[#F5EDE3] transition-colors border border-[#E9D7B8]"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-[#D4AF37]" />
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#D4AF37] text-white text-xs flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#2A2A2A]">{totalItems} món</p>
                <p className="text-sm text-[#D4AF37] font-medium">
                  {formatMoney(totalAmount)}
                </p>
              </div>
            </button>
            <button
              onClick={() => setShowCart(true)}
              className="px-8 py-4 rounded-xl bg-[#D4AF37] text-white font-semibold hover:bg-[#C5A028] transition-colors shadow-lg"
            >
              Đặt món
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedItem && (
        <AddItemModal
          item={selectedItem}
          existingOrder={getExistingOrder(selectedItem.id)}
          onAdd={handleAddItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {showCart && (
        <CartModal
          orders={orders}
          onUpdateQuantity={handleUpdateQuantity}
          onRemove={handleRemoveItem}
          onPlaceOrder={handlePlaceOrder}
          onClose={() => setShowCart(false)}
          isSaving={isSaving}
        />
      )}

      {showExistingOrders && (
        <ExistingOrdersModal
          orders={existingOrders}
          onClose={() => setShowExistingOrders(false)}
        />
      )}

      {isSaving && (
        <div className="fixed inset-0 z-60 bg-white/90 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
            <p className="text-[#2A2A2A]/70">Đang đặt món...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TodayPage() {
  return (
    <AuthGuard>
      <TodayMenuContent />
    </AuthGuard>
  );
}
