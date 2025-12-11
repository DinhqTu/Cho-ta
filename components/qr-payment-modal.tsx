"use client";

import { useState, useEffect, useCallback } from "react";
import { formatMoney } from "@/lib/utils";
import {
  generateMoMoQRUrl,
  generateMoMoAppLink,
  generatePaymentCode,
  generatePaymentComment,
  getMoMoConfig,
} from "@/lib/momo-qr";
import { X, Check, Loader2, Copy, Smartphone, RefreshCw } from "lucide-react";

export interface QRPaymentModalProps {
  open: boolean;
  amount: number;
  userName: string;
  date: string;
  userId: string;
  userEmail?: string;
  orderIds?: string[];
  onConfirm: () => void;
  onClose: () => void;
  isConfirming: boolean;
  enableAutoCheck?: boolean;
}

export function QRPaymentModal({
  open,
  amount,
  userName,
  date,
  userId,
  userEmail,
  orderIds = [],
  onConfirm,
  onClose,
  isConfirming,
  enableAutoCheck = true,
}: QRPaymentModalProps) {
  const [paymentCode, setPaymentCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "completed" | "error"
  >("pending");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    if (open) {
      const code = generatePaymentCode(userId, date);
      setPaymentCode(code);
      setPaymentStatus("pending");
      setLastChecked(null);
      document.body.style.overflow = "hidden";

      if (orderIds.length > 0 && enableAutoCheck) {
        registerPendingPayment(code);
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, userId, date, orderIds, enableAutoCheck]);

  const registerPendingPayment = async (code: string) => {
    try {
      await fetch("/api/register-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentCode: code,
          userId,
          userName,
          userEmail,
          amount: amount * 1000,
          orderIds,
          date,
        }),
      });
    } catch (error) {
      console.error("Failed to register pending payment:", error);
    }
  };

  const checkPaymentStatus = useCallback(async () => {
    if (!paymentCode || !enableAutoCheck) return;

    setIsCheckingPayment(true);
    try {
      const response = await fetch(`/api/payment-status?code=${paymentCode}`);
      const data = await response.json();
      setLastChecked(new Date());

      if (data.isPaid) {
        setPaymentStatus("completed");
        setTimeout(() => {
          onConfirm();
        }, 1000);
      }
    } catch (error) {
      console.error("Failed to check payment status:", error);
    } finally {
      setIsCheckingPayment(false);
    }
  }, [paymentCode, enableAutoCheck, onConfirm]);

  useEffect(() => {
    if (!open || !enableAutoCheck || paymentStatus === "completed") return;

    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [open, enableAutoCheck, paymentStatus, checkPaymentStatus]);

  const momoConfig = getMoMoConfig();
  const paymentComment = generatePaymentComment(userName, date, paymentCode);
  const qrUrl = generateMoMoQRUrl(
    { amount, comment: paymentComment },
    momoConfig
  );
  const appLink = generateMoMoAppLink(
    { amount, comment: paymentComment },
    momoConfig
  );

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(paymentComment);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleOpenMoMo = () => {
    window.open(appLink, "_blank");
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200"
      onClick={handleOverlayClick}
    >
      <div className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[900px] xl:w-[1000px] max-w-[1100px] overflow-hidden rounded-2xl bg-white shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col md:flex-row">
          {/* Left Column - Order Info */}
          <div className="p-6 bg-white md:w-[320px] md:min-w-[320px] md:shrink-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#2A2A2A]">
                Thông tin đơn hàng
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors md:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receiver Info */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Người nhận</p>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-[#ae2070] flex items-center justify-center text-white font-bold">
                  {momoConfig.accountName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-[#2A2A2A]">
                    {momoConfig.accountName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {momoConfig.phoneNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Code */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Mã đơn hàng</p>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <p className="font-semibold text-[#2A2A2A] text-sm">
                  {paymentCode}
                </p>
                <button
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Copy"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Mô tả</p>
              <p className="font-medium text-[#2A2A2A]">{paymentComment}</p>
            </div>

            {/* Amount */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1">Số tiền</p>
              <p className="text-3xl font-bold text-[#ae2070]">
                {formatMoney(amount)}
              </p>
            </div>

            {/* Security Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5 shrink-0">⚠️</span>
                <div className="text-xs text-amber-800">
                  <p className="font-medium mb-1">
                    Kiểm tra trước khi thanh toán:
                  </p>
                  <ul className="space-y-0.5 text-amber-700">
                    <li>
                      • Người nhận:{" "}
                      <span className="font-semibold">
                        {momoConfig.accountName}
                      </span>
                    </li>
                    <li>
                      • SĐT:{" "}
                      <span className="font-semibold">
                        {momoConfig.phoneNumber}
                      </span>
                    </li>
                    <li>• Xác nhận thông tin trên app MoMo khớp với trên</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Auto-check status indicator */}
            {enableAutoCheck && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {paymentStatus === "completed" ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700 font-medium">
                          Đã nhận thanh toán!
                        </span>
                      </>
                    ) : isCheckingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        <span className="text-sm text-blue-700">
                          Đang kiểm tra...
                        </span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-700">
                          Tự động kiểm tra mỗi 5s
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={checkPaymentStatus}
                    disabled={isCheckingPayment}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Kiểm tra ngay
                  </button>
                </div>
                {lastChecked && (
                  <p className="text-xs text-gray-500 mt-1">
                    Lần cuối: {lastChecked.toLocaleTimeString("vi-VN")}
                  </p>
                )}
              </div>
            )}

            {/* Confirm Button */}
            <button
              onClick={onConfirm}
              disabled={isConfirming || paymentStatus === "completed"}
              className={`w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                paymentStatus === "completed"
                  ? "bg-green-500 text-white"
                  : "bg-[#D4AF37] text-white hover:bg-[#C5A028]"
              }`}
            >
              {isConfirming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : paymentStatus === "completed" ? (
                <Check className="w-5 h-5" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              {isConfirming
                ? "Đang xử lý..."
                : paymentStatus === "completed"
                ? "Thanh toán thành công!"
                : "Xác nhận đã thanh toán"}
            </button>
          </div>

          {/* Right Column - QR Code */}
          <div className="p-6 bg-[#ae2070] flex flex-col items-center justify-center relative md:flex-1">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <h3 className="text-white font-semibold text-lg mb-4">
              Quét mã QR để thanh toán
            </h3>

            {/* QR Code with frame */}
            <div className="relative p-3 bg-white rounded-2xl shadow-lg">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="MoMo QR Code"
                className="w-64 h-64 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/assets/images/momo_qr.jpg";
                }}
              />
            </div>

            <p className="text-white/80 text-sm mt-4 text-center">
              Sử dụng <span className="font-semibold text-white">App MoMo</span>{" "}
              hoặc ứng dụng
              <br />
              camera hỗ trợ QR code để quét mã
            </p>

            {/* Open MoMo App Button */}
            <button
              onClick={handleOpenMoMo}
              className="mt-4 px-6 py-2.5 rounded-full bg-white text-[#ae2070] font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              Mở app MoMo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
