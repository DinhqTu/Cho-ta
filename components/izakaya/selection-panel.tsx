"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MenuItem } from "@/lib/menu-data";
import { OrderItem } from "@/lib/order-store";
import {
  Plus,
  Minus,
  X,
  StickyNote,
  ShoppingBag,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SelectionPanelProps {
  isVisible: boolean;
  items: MenuItem[];
  orders: OrderItem[];
  onAddItem: (item: MenuItem, quantity: number, note?: string) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onPlaceOrder: () => void;
}

// Floating confirmation tooltip
function AddedTooltip({ show, itemName }: { show: boolean; itemName: string }) {
  if (!show) return null;
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-70 pointer-events-none animate-tooltip-pop">
      <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white shadow-2xl flex items-center gap-2">
        <Check className="w-5 h-5" />
        <span className="font-medium">{itemName} added!</span>
      </div>
    </div>
  );
}

export function SelectionPanel({
  isVisible,
  items,
  orders,
  onAddItem,
  onRemoveItem,
  onUpdateQuantity,
  onPlaceOrder,
}: SelectionPanelProps) {
  const [selectedDishIndex, setSelectedDishIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipItem, setTooltipItem] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);

  const selectedDish = items[selectedDishIndex];
  const existingOrder = orders.find((o) => o.item.id === selectedDish?.id);
  const total = orders.reduce((sum, o) => sum + o.item.price * o.quantity, 0);

  // Reset quantity when switching dishes
  useEffect(() => {
    if (existingOrder) {
      setQuantity(existingOrder.quantity);
      setNote(existingOrder.note || "");
    } else {
      setQuantity(1);
      setNote("");
    }
  }, [selectedDishIndex, existingOrder]);

  const handlePrevDish = () => {
    setIsSwitching(true);
    setTimeout(() => {
      setSelectedDishIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
      setIsSwitching(false);
    }, 150);
  };

  const handleNextDish = () => {
    setIsSwitching(true);
    setTimeout(() => {
      setSelectedDishIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
      setIsSwitching(false);
    }, 150);
  };

  const handleAdd = () => {
    if (!selectedDish) return;
    onAddItem(selectedDish, quantity, note || undefined);
    setShowTooltip(true);
    setTooltipItem(selectedDish.name);
    setTimeout(() => setShowTooltip(false), 2000);
  };

  const handleUpdate = () => {
    if (!selectedDish || !existingOrder) return;
    onUpdateQuantity(selectedDish.id, quantity);
  };

  if (!isVisible || !selectedDish) return null;

  return (
    <>
      <AddedTooltip show={showTooltip} itemName={tooltipItem} />

      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-white rounded-t-[20px]",
          "shadow-[0_-4px_30px_rgba(0,0,0,0.18)]",
          "animate-slide-up"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E9D7B8]/30">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
            <span className="font-semibold text-[#2A2A2A]">Select Dishes</span>
          </div>
          {orders.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#2A2A2A]/60">
                {orders.length} items
              </span>
              <span className="text-lg font-bold text-[#D4AF37]">
                ${total.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Main Content - Vertical Layout */}
        <div className="p-5 space-y-5 max-h-[55vh] overflow-y-auto">
          {/* Top Section: Large Dish Image & Name */}
          <div
            className={cn(
              "relative transition-opacity duration-150",
              isSwitching ? "opacity-0" : "opacity-100"
            )}
          >
            {/* Navigation arrows */}
            <button
              onClick={handlePrevDish}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-[#E9D7B8]/50 flex items-center justify-center hover:bg-[#FBF8F4] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#2A2A2A]/70" />
            </button>
            <button
              onClick={handleNextDish}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-[#E9D7B8]/50 flex items-center justify-center hover:bg-[#FBF8F4] transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-[#2A2A2A]/70" />
            </button>

            {/* Dish display */}
            <div
              className={cn(
                "flex flex-col items-center text-center p-6 rounded-2xl border transition-all duration-300",
                existingOrder
                  ? "bg-[#D4AF37]/5 border-[#D4AF37]/40 animate-item-select"
                  : "bg-[#FBF8F4] border-[#E9D7B8]/30"
              )}
            >
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-white to-[#FBF8F4] flex items-center justify-center border border-[#E9D7B8]/30 shadow-sm mb-4">
                <span className="text-5xl">
                  {selectedDish.category === "Sushi" && "🍣"}
                  {selectedDish.category === "Noodles" && "🍜"}
                  {selectedDish.category === "Appetizers" && "🥟"}
                  {selectedDish.category === "Grilled" && "🍢"}
                  {selectedDish.category === "Desserts" && "🍡"}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-[#2A2A2A]">
                {selectedDish.name}
              </h3>
              <p className="text-sm text-[#2A2A2A]/50 mt-1">
                {selectedDish.description}
              </p>
              <p className="text-2xl font-bold text-[#D4AF37] mt-3">
                ${selectedDish.price.toFixed(2)}
              </p>

              {/* Dish indicator dots */}
              <div className="flex gap-1.5 mt-4">
                {items.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setIsSwitching(true);
                      setTimeout(() => {
                        setSelectedDishIndex(i);
                        setIsSwitching(false);
                      }, 150);
                    }}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      i === selectedDishIndex
                        ? "bg-[#D4AF37] w-6"
                        : "bg-[#E9D7B8] hover:bg-[#D4AF37]/50"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Middle Section: Users who selected (multi-column) */}
          {orders.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#2A2A2A]/60 uppercase tracking-wider">
                Current Selections
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {orders.map((order) => (
                  <div
                    key={order.item.id}
                    onClick={() => {
                      const idx = items.findIndex(
                        (i) => i.id === order.item.id
                      );
                      if (idx !== -1) {
                        setIsSwitching(true);
                        setTimeout(() => {
                          setSelectedDishIndex(idx);
                          setIsSwitching(false);
                        }, 150);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all duration-200",
                      order.item.id === selectedDish.id
                        ? "bg-[#D4AF37]/10 border-[#D4AF37]/40"
                        : "bg-white border-[#E9D7B8]/30 hover:border-[#D4AF37]/30"
                    )}
                  >
                    <span className="text-lg">
                      {order.item.category === "Sushi" && "🍣"}
                      {order.item.category === "Noodles" && "🍜"}
                      {order.item.category === "Appetizers" && "🥟"}
                      {order.item.category === "Grilled" && "🍢"}
                      {order.item.category === "Desserts" && "🍡"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2A2A2A] truncate">
                        {order.item.name}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-xs font-semibold text-[#D4AF37]">
                      ×{order.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Section: Quantity & Add */}
          <div className="space-y-4 pt-2">
            {/* Quantity selector */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#2A2A2A]/70">
                Quantity
              </span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full bg-[#FBF8F4] border border-[#E9D7B8] flex items-center justify-center hover:bg-[#F5EDE3] transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-xl font-bold text-[#2A2A2A]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center hover:bg-[#C5A028] transition-colors shadow-md"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Note input */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="w-4 h-4 text-[#2A2A2A]/50" />
                <span className="text-sm text-[#2A2A2A]/70">
                  Special requests
                </span>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., No onions, extra spicy..."
                className="w-full p-3 rounded-xl border border-[#E9D7B8] bg-[#FBF8F4] resize-none h-16 focus:outline-none focus:border-[#D4AF37] text-sm transition-colors"
              />
            </div>

            {/* Add/Update button */}
            <button
              onClick={existingOrder ? handleUpdate : handleAdd}
              className={cn(
                "w-full py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98]",
                existingOrder
                  ? "bg-gradient-to-r from-[#2A2A2A] to-[#3A3A3A] text-white"
                  : "bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white"
              )}
            >
              {existingOrder ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  Update · ${(selectedDish.price * quantity).toFixed(2)}
                </span>
              ) : (
                <span>
                  Add to Order · ${(selectedDish.price * quantity).toFixed(2)}
                </span>
              )}
            </button>

            {/* Remove button if exists */}
            {existingOrder && (
              <button
                onClick={() => onRemoveItem(selectedDish.id)}
                className="w-full py-3 rounded-xl border border-red-200 text-red-500 font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Remove from order
              </button>
            )}
          </div>
        </div>

        {/* Place Order Footer */}
        {orders.length > 0 && (
          <div className="px-5 py-4 border-t border-[#E9D7B8]/30 bg-[#FBF8F4]">
            <button
              onClick={onPlaceOrder}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8942A] text-white font-bold text-lg hover:from-[#C5A028] hover:to-[#A8841A] transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-[0.98]"
            >
              Confirm Order · ${total.toFixed(2)}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
