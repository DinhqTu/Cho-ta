"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Header } from "@/components/header";
import { useAuth } from "@/contexts/auth-context";
import { formatMoney } from "@/lib/utils";
import {
  getTodayDate,
  getDailyOrders,
  DailyOrderDoc,
  updateOrderPaymentStatus,
} from "@/lib/api/daily-orders";
import {
  ArrowLeft,
  Loader2,
  Wallet,
  Building2,
  Check,
  ChevronRight,
} from "lucide-react";
import { QRPaymentModal } from "@/components/qr-payment-modal";
import { PayOSPaymentModal } from "@/components/payos-payment-modal";
import { MenuItemDoc } from "@/lib/api/menu";

type PaymentMethod = "momo" | "bank" | null;

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<DailyOrderDoc[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [showMoMoModal, setShowMoMoModal] = useState(false);
  const [showPayOSModal, setShowPayOSModal] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Get date from URL or use today
  const date = searchParams.get("date") || getTodayDate();

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const allOrders = await getDailyOrders(date);
        // Filter only current user's unpaid orders
        const userUnpaidOrders = allOrders.filter(
          (o) => o.userId === user.$id && !o.isPaid,
        );
        setOrders(userUnpaidOrders);
      } catch (error) {
        console.error("Error loading orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [user, date]);

  const totalAmount = orders.reduce(
    (sum, o) => sum + (o.menuItemId as MenuItemDoc).price * o.quantity,
    0,
  );

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  const handleProceed = () => {
    if (selectedMethod === "momo") {
      setShowMoMoModal(true);
    } else if (selectedMethod === "bank") {
      setShowPayOSModal(true);
    }
  };

  const handleMoMoConfirm = async () => {
    setIsConfirming(true);
    try {
      for (const order of orders) {
        await updateOrderPaymentStatus(order.$id, true);
      }
      router.push("/group-order?payment=success");
    } catch (error) {
      console.error("Error updating payment status:", error);
    } finally {
      setIsConfirming(false);
      setShowMoMoModal(false);
    }
  };

  const handlePayOSSuccess = async (orderCode: number) => {
    try {
      for (const order of orders) {
        await updateOrderPaymentStatus(order.$id, true);
      }
      router.push(`/group-order?payment=success&orderCode=${orderCode}`);
    } catch (error) {
      console.error("Error updating payment status:", error);
    } finally {
      setShowPayOSModal(false);
    }
  };

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

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-green-100 flex items-center justify-center mb-4">
            <Check className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-[#2A2A2A] mb-2">
            Không có đơn cần thanh toán
          </h2>
          <p className="text-[#2A2A2A]/60 mb-6">
            Tất cả đơn hàng của bạn đã được thanh toán
          </p>
          <button
            onClick={() => router.push("/group-order")}
            className="px-6 py-3 rounded-xl bg-[#D4AF37] text-white font-medium hover:bg-[#C5A028] transition-colors"
          >
            Quay lại
          </button>
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

      {/* Header */}
      <div className="relative z-10 px-6 py-4 border-b border-[#E9D7B8]/30 bg-white/50">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white border border-[#E9D7B8] flex items-center justify-center hover:bg-[#FBF8F4] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#2A2A2A]" />
          </button>
          <h1 className="text-xl font-bold text-[#2A2A2A]">Thanh toán</h1>
        </div>
      </div>

      <div className="relative z-10 max-w-lg mx-auto p-6 space-y-6">
        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-[#E9D7B8]/50 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E9D7B8]/30">
            <h2 className="font-semibold text-[#2A2A2A]">Đơn hàng của bạn</h2>
            <p className="text-sm text-[#2A2A2A]/50">{date}</p>
          </div>

          <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
            {orders.map((order) => (
              <div
                key={order.$id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#2A2A2A]/60">
                    {order.quantity}x
                  </span>
                  <span className="text-[#2A2A2A]">
                    {(order.menuItemId as MenuItemDoc).name}
                  </span>
                </div>
                <span className="font-medium text-[#D4AF37]">
                  {formatMoney(
                    (order.menuItemId as MenuItemDoc).price * order.quantity,
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[#E9D7B8]/30 bg-[#FBF8F4] flex items-center justify-between">
            <span className="font-semibold text-[#2A2A2A]">Tổng cộng</span>
            <span className="text-2xl font-bold text-[#D4AF37]">
              {formatMoney(totalAmount)}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3">
          <h2 className="font-semibold text-[#2A2A2A]">
            Chọn phương thức thanh toán
          </h2>

          {/* MoMo Option */}
          <button
            onClick={() => handleSelectMethod("momo")}
            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
              selectedMethod === "momo"
                ? "border-[#ae2070] bg-[#ae2070]/5"
                : "border-[#E9D7B8]/50 bg-white hover:border-[#ae2070]/50"
            }`}
          >
            <div className="w-14 h-14 rounded-xl bg-[#ae2070] flex items-center justify-center shrink-0">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-[#2A2A2A]">Ví MoMo</h3>
              <p className="text-sm text-[#2A2A2A]/60">
                Quét mã QR hoặc mở app MoMo
              </p>
            </div>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === "momo"
                  ? "border-[#ae2070] bg-[#ae2070]"
                  : "border-[#E9D7B8]"
              }`}
            >
              {selectedMethod === "momo" && (
                <Check className="w-4 h-4 text-white" />
              )}
            </div>
          </button>

          {/* Bank/PayOS Option */}
          <button
            onClick={() => handleSelectMethod("bank")}
            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
              selectedMethod === "bank"
                ? "border-blue-600 bg-blue-50"
                : "border-[#E9D7B8]/50 bg-white hover:border-blue-300"
            }`}
          >
            <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-[#2A2A2A]">
                Chuyển khoản ngân hàng
              </h3>
              <p className="text-sm text-[#2A2A2A]/60">
                Quét mã QR VietQR - Hỗ trợ mọi ngân hàng
              </p>
            </div>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === "bank"
                  ? "border-blue-600 bg-blue-600"
                  : "border-[#E9D7B8]"
              }`}
            >
              {selectedMethod === "bank" && (
                <Check className="w-4 h-4 text-white" />
              )}
            </div>
          </button>
        </div>

        {/* Proceed Button */}
        <button
          onClick={handleProceed}
          disabled={!selectedMethod}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
            selectedMethod
              ? selectedMethod === "momo"
                ? "bg-[#ae2070] text-white hover:bg-[#9a1c63]"
                : "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Tiếp tục
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* MoMo Payment Modal */}
      {user && (
        <QRPaymentModal
          open={showMoMoModal}
          amount={totalAmount}
          userName={user.name}
          date={date}
          userId={user.$id}
          userEmail={user.email}
          orderIds={orders.map((o) => o.$id)}
          onConfirm={handleMoMoConfirm}
          onClose={() => setShowMoMoModal(false)}
          isConfirming={isConfirming}
        />
      )}

      {/* PayOS Payment Modal */}
      {user && (
        <PayOSPaymentModal
          open={showPayOSModal}
          amount={totalAmount}
          description={user.name}
          userName={user.name}
          userId={user.$id}
          userEmail={user.email}
          orderIds={orders.map((o) => o.$id)}
          onSuccess={handlePayOSSuccess}
          onClose={() => setShowPayOSModal(false)}
        />
      )}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <AuthGuard>
      <Header />
      <div className="pt-16">
        <PaymentContent />
      </div>
    </AuthGuard>
  );
}
