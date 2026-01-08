"use client";

import { useState } from "react";
import { cn, formatMoney } from "@/lib/utils";
import {
  DailyOrderDoc,
  deleteDailyOrder,
  updateOrderQuantity,
} from "@/lib/api/daily-orders";
import { categoryEmoji } from "@/lib/menu-store";
import { Plus, Minus, X, Loader2, Trash2 } from "lucide-react";

interface EditOrdersDialogProps {
  open: boolean;
  orders: DailyOrderDoc[];
  onClose: () => void;
  onUpdate: () => void;
}

interface OrderEditState {
  [orderId: string]: number;
}

export function EditOrdersDialog({
  open,
  orders,
  onClose,
  onUpdate,
}: EditOrdersDialogProps) {
  const [quantities, setQuantities] = useState<OrderEditState>(() => {
    const initial: OrderEditState = {};
    orders.forEach((order) => {
      initial[order.$id] = order.quantity;
    });
    return initial;
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuantityChange = (orderId: string, delta: number) => {
    setQuantities((prev) => {
      const currentQty = prev[orderId] || 1;
      const newQty = Math.max(0, currentQty + delta);

      // If quantity becomes 0, show delete confirmation
      if (newQty === 0) {
        setDeletingOrderId(orderId);
        setShowDeleteConfirm(true);
        return prev; // Don't update yet
      }

      return { ...prev, [orderId]: newQty };
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletingOrderId) return;

    setIsUpdating(true);
    try {
      const success = await deleteDailyOrder(deletingOrderId);
      if (success) {
        setShowDeleteConfirm(false);
        setDeletingOrderId(null);
        onUpdate(); // Refresh the orders list

        // Close dialog if no orders left
        const remainingOrders = orders.filter((o) => o.$id !== deletingOrderId);
        if (remainingOrders.length === 0) {
          onClose();
        }
      } else {
        alert("Không thể xóa món. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Không thể xóa món. Vui lòng thử lại.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingOrderId(null);
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      // Update all changed quantities
      const updatePromises = orders.map(async (order) => {
        const newQty = quantities[order.$id];
        if (newQty && newQty !== order.quantity) {
          return await updateOrderQuantity(order.$id, newQty);
        }
        return true;
      });

      await Promise.all(updatePromises);
      onUpdate(); // Refresh the orders list
      onClose();
    } catch (error) {
      console.error("Error updating quantities:", error);
      alert("Không thể cập nhật. Vui lòng thử lại.");
    } finally {
      setIsUpdating(false);
    }
  };

  const deletingOrder = orders.find((o) => o.$id === deletingOrderId);

  if (!open) return null;

  return (
    <>
      {/* Main Edit Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Dialog Content */}
        <div className="relative bg-white rounded-2xl w-[90%] max-w-md shadow-2xl border border-[#E9D7B8]/30 overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-[#E9D7B8]/30 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2A2A2A]">
              Chỉnh sửa đơn hàng
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-[#FBF8F4] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Orders List */}
          <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
            {orders.map((order) => {
              const qty = quantities[order.$id] || order.quantity;

              return (
                <div
                  key={order.$id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#FBF8F4] border border-[#E9D7B8]/30"
                >
                  {/* Image */}
                  <div className="w-14 h-14 rounded-lg bg-white flex items-center justify-center border border-[#E9D7B8]/30 shrink-0">
                    <span className="text-2xl">
                      {categoryEmoji[order.menuItemCategory] || "📍"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[#2A2A2A]">
                      {order.menuItemName}
                    </h4>
                    <p className="text-sm font-bold text-[#D4AF37] mt-0.5">
                      {formatMoney(order.menuItemPrice)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(order.$id, -1)}
                      className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-4 h-4 text-[#2A2A2A]" />
                    </button>

                    <div className="w-12 text-center">
                      <span className="text-xl font-bold text-[#2A2A2A]">
                        {qty}
                      </span>
                    </div>

                    <button
                      onClick={() => handleQuantityChange(order.$id, 1)}
                      className="w-9 h-9 rounded-lg bg-[#FFD700] hover:bg-[#FFC700] flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-[#E9D7B8]/30 flex gap-3">
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="flex-1 py-3 rounded-xl border border-[#E9D7B8] text-[#2A2A2A] font-medium hover:bg-[#FBF8F4] transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="flex-1 py-3 rounded-xl bg-[#D4AF37] text-white font-semibold hover:bg-[#C5A028] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCancelDelete}
          />

          {/* Dialog Content */}
          <div className="relative bg-white rounded-2xl w-[90%] max-w-sm shadow-2xl border border-red-200">
            {/* Header */}
            <div className="p-5 border-b border-red-200">
              <h3 className="text-lg font-bold text-[#2A2A2A] flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Xóa món ăn
              </h3>
            </div>

            {/* Content */}
            <div className="p-5">
              <p className="text-[#2A2A2A]/70 mb-4">
                Bạn có chắc chắn muốn xóa món{" "}
                <span className="font-semibold text-[#2A2A2A]">
                  {deletingOrder?.menuItemName}
                </span>{" "}
                khỏi đơn hàng?
              </p>

              {deletingOrder && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center border border-red-200 shrink-0">
                      <span className="text-xl">
                        {categoryEmoji[deletingOrder.menuItemCategory] || "📍"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#2A2A2A]">
                        {deletingOrder.menuItemName}
                      </h4>
                      <p className="text-sm text-red-600 font-medium">
                        {deletingOrder.quantity}x •{" "}
                        {formatMoney(
                          deletingOrder.menuItemPrice * deletingOrder.quantity
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-red-200 flex gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={isUpdating}
                className="flex-1 py-3 rounded-xl border border-[#E9D7B8] text-[#2A2A2A] font-medium hover:bg-[#FBF8F4] transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isUpdating}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Xóa món
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
