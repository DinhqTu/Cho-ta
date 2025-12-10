"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { formatMoney } from "@/lib/utils";
import {
  getUserUnpaidOrders,
  UnpaidOrdersByDate,
  updateOrderPaymentStatus,
} from "@/lib/api/daily-orders";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  X,
  QrCode,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Image from "next/image";

// QR Payment Modal using Dialog
function QRPaymentModal({
  open,
  amount,
  onConfirm,
  onClose,
  isConfirming,
}: {
  open: boolean;
  amount: number;
  onConfirm: () => void;
  onClose: () => void;
  isConfirming: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="max-w-sm p-0 border-[#E9D7B8] overflow-hidden"
        showCloseButton={false}
      >
        <DialogHeader className="p-5 border-b border-[#E9D7B8]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#D4AF37]" />
              <DialogTitle className="text-lg font-semibold text-[#2A2A2A]">
                Thanh toán MoMo
              </DialogTitle>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FBF8F4] flex items-center justify-center hover:bg-[#F5EDE3] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-5">
          <div className="text-center mb-4">
            <p className="text-sm text-[#2A2A2A]/60">Số tiền cần thanh toán</p>
            <p className="text-3xl font-bold text-[#D4AF37]">
              {formatMoney(amount)}
            </p>
          </div>

          <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-[#E9D7B8] mb-4">
            <Image
              src="/assets/images/momo_qr.jpg"
              alt="MoMo QR Code"
              fill
              className="object-contain"
            />
          </div>

          <p className="text-center text-sm text-[#2A2A2A]/60 mb-4">
            Quét mã QR bằng ứng dụng MoMo để thanh toán
          </p>

          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className="w-full py-4 rounded-xl bg-[#D4AF37] text-white font-semibold hover:bg-[#C5A028] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isConfirming ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            {isConfirming ? "Đang xử lý..." : "Xác nhận đã thanh toán"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UnpaidOrdersCard() {
  const { user } = useAuth();
  const [unpaidOrders, setUnpaidOrders] = useState<UnpaidOrdersByDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (user) {
      loadUnpaidOrders();
    }
  }, [user]);

  const loadUnpaidOrders = async () => {
    if (!user) return;
    setIsLoading(false);
    try {
      const data = await getUserUnpaidOrders(user.$id);
      setUnpaidOrders(data);
    } catch (error) {
      console.error("Error loading unpaid orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = (date: string) => {
    setSelectedDate(date);
    setShowQRModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedDate) return;
    setIsConfirming(true);

    const dateOrders = unpaidOrders.find((d) => d.date === selectedDate);
    if (dateOrders) {
      for (const order of dateOrders.orders) {
        await updateOrderPaymentStatus(order.$id, true);
      }
    }

    setUnpaidOrders((prev) => prev.filter((d) => d.date !== selectedDate));
    setIsConfirming(false);
    setShowQRModal(false);
    setSelectedDate(null);
  };

  const formatDateDisplay = (dateStr: string) => {
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
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const totalUnpaid = unpaidOrders.reduce((sum, d) => sum + d.totalAmount, 0);

  if (isLoading || !user || unpaidOrders.length === 0 || isDismissed) {
    return null;
  }

  const selectedAmount =
    unpaidOrders.find((d) => d.date === selectedDate)?.totalAmount || 0;

  return (
    <>
      <div className="fixed top-16 left-0 right-0 z-30 px-4 py-2">
        <div className="max-w-2xl mx-auto">
          <div className="bg-linear-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#2A2A2A]">
                    Bạn có {unpaidOrders.length} ngày chưa thanh toán
                  </h3>
                  <p className="text-sm text-amber-700">
                    Tổng: {formatMoney(totalUnpaid)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDismissed(true);
                  }}
                  className="w-8 h-8 rounded-full hover:bg-amber-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-[#2A2A2A]/60" />
                </button>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-[#2A2A2A]/60" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#2A2A2A]/60" />
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 max-h-64 overflow-y-auto">
                {unpaidOrders.map((dateGroup) => (
                  <div
                    key={dateGroup.date}
                    className="bg-white rounded-xl p-3 border border-amber-100"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#2A2A2A]">
                          {formatDateDisplay(dateGroup.date)}
                        </p>
                        <p className="text-sm text-[#2A2A2A]/60">
                          {dateGroup.orders.length} món •{" "}
                          {formatMoney(dateGroup.totalAmount)}
                        </p>
                      </div>
                      <button
                        onClick={() => handlePayment(dateGroup.date)}
                        className="px-4 py-2 rounded-lg bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#C5A028] transition-colors flex items-center gap-2"
                      >
                        <QrCode className="w-4 h-4" />
                        Thanh toán
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Modal */}
      <QRPaymentModal
        open={showQRModal}
        amount={selectedAmount}
        onConfirm={handleConfirmPayment}
        onClose={() => setShowQRModal(false)}
        isConfirming={isConfirming}
      />
    </>
  );
}
