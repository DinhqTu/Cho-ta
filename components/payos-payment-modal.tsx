"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { formatMoney } from "@/lib/utils";
import {
  X,
  Check,
  Loader2,
  Copy,
  ExternalLink,
  RefreshCw,
  Clock,
  CreditCard,
} from "lucide-react";

const EXPIRY_MINUTES = 15;

export interface PayOSPaymentModalProps {
  open: boolean;
  amount: number; // Đơn vị: nghìn đồng (VD: 50 = 50.000đ)
  description: string;
  userName: string;
  userId: string;
  userEmail?: string;
  orderIds?: string[];
  onSuccess: (orderCode: number) => void;
  onClose: () => void;
}

interface PaymentData {
  orderCode: number;
  qrCode: string;
  qrCodeOriginal?: string;
  checkoutUrl: string;
  accountNumber: string;
  accountName: string;
  bin?: string;
  description: string;
  expiresAt: string;
}

export function PayOSPaymentModal({
  open,
  amount,
  description,
  userName,
  userId,
  userEmail,
  orderIds = [],
  onSuccess,
  onClose,
}: PayOSPaymentModalProps) {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "completed" | "expired" | "error"
  >("pending");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [timeLeft, setTimeLeft] = useState(EXPIRY_MINUTES * 60);
  const [mounted, setMounted] = useState(false);
  const hasCreatedPayment = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tạo payment khi modal mở
  const createPayment = useCallback(async () => {
    if (hasCreatedPayment.current) return;
    hasCreatedPayment.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payos/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount * 1000, // Convert to VND
          description,
          userId,
          userName,
          userEmail,
          orderIds,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create payment");
      }

      setPaymentData(result.data);
      setPaymentStatus("pending");

      // Calculate time left
      const expiresAt = new Date(result.data.expiresAt);
      const remainingSeconds = Math.max(
        0,
        Math.floor((expiresAt.getTime() - Date.now()) / 1000)
      );
      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        setPaymentStatus("expired");
      }
    } catch (err) {
      console.error("Create payment error:", err);
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setPaymentStatus("error");
    } finally {
      setIsLoading(false);
      setIsAnimating(false);
    }
  }, [amount, description, userId, userName, userEmail, orderIds]);

  useEffect(() => {
    if (open && !hasCreatedPayment.current) {
      createPayment();
    }

    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      hasCreatedPayment.current = false;
      setPaymentData(null);
      setPaymentStatus("pending");
      setError(null);
      setIsAnimating(true);
      setTimeLeft(EXPIRY_MINUTES * 60);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, createPayment]);

  // Countdown timer
  useEffect(() => {
    if (!open || paymentStatus === "completed" || paymentStatus === "expired")
      return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPaymentStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, paymentStatus]);

  // Check payment status
  const checkPaymentStatus = useCallback(async () => {
    if (!paymentData || paymentStatus === "expired") return;

    setIsCheckingPayment(true);
    try {
      const response = await fetch(
        `/api/payos/check-status?orderCode=${paymentData.orderCode}`
      );
      const result = await response.json();
      setLastChecked(new Date());

      if (result.success && result.data.isPaid) {
        setPaymentStatus("completed");
        setTimeout(() => {
          onSuccess(paymentData.orderCode);
        }, 1000);
      }
    } catch (err) {
      console.error("Check payment status error:", err);
    } finally {
      setIsCheckingPayment(false);
    }
  }, [paymentData, paymentStatus, onSuccess]);

  // Auto polling check payment status mỗi 5 giây
  useEffect(() => {
    if (
      !open ||
      !paymentData ||
      paymentStatus === "completed" ||
      paymentStatus === "expired"
    )
      return;

    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [open, paymentData, paymentStatus, checkPaymentStatus]);

  const handleCopyAccount = async () => {
    if (!paymentData) return;
    try {
      await navigator.clipboard.writeText(paymentData.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleOpenCheckout = () => {
    if (paymentData?.checkoutUrl) {
      window.open(paymentData.checkoutUrl, "_blank");
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const isExpired = paymentStatus === "expired" || timeLeft <= 0;

  // QR code là VietQR URL
  const getQrCodeSrc = (qrCode: string) => {
    if (!qrCode) return "";
    return qrCode;
  };

  if (!open || !mounted) return null;

  const modalContent = (
    <div
      className={`fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/50 overflow-y-auto ${
        isAnimating ? "animate-in fade-in duration-200" : ""
      }`}
      onClick={handleOverlayClick}
    >
      <div
        className={`w-full sm:w-[90vw] md:w-[85vw] lg:w-[900px] xl:w-[1000px] max-w-[1100px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl my-auto ${
          isAnimating ? "animate-in zoom-in-95 duration-200" : ""
        }`}
      >
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Đang tạo mã thanh toán...</p>
          </div>
        ) : error ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Đóng
            </button>
          </div>
        ) : paymentData ? (
          <div className="flex flex-col md:flex-row">
            {/* Left Column - Payment Info */}
            <div className="p-6 bg-white md:w-[320px] md:min-w-[320px] md:shrink-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[#2A2A2A]">
                  Thông tin thanh toán
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors md:hidden"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Countdown Timer */}
              <div
                className={`mb-4 p-3 rounded-xl border ${
                  isExpired
                    ? "bg-red-50 border-red-200"
                    : timeLeft <= 60
                    ? "bg-amber-50 border-amber-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock
                      className={`w-4 h-4 ${
                        isExpired
                          ? "text-red-600"
                          : timeLeft <= 60
                          ? "text-amber-600"
                          : "text-blue-600"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isExpired
                          ? "text-red-700"
                          : timeLeft <= 60
                          ? "text-amber-700"
                          : "text-blue-700"
                      }`}
                    >
                      {isExpired ? "Mã QR đã hết hạn" : "Thời gian còn lại"}
                    </span>
                  </div>
                  {!isExpired && (
                    <span
                      className={`text-lg font-bold font-mono ${
                        timeLeft <= 60 ? "text-amber-700" : "text-blue-700"
                      }`}
                    >
                      {formatTimeLeft(timeLeft)}
                    </span>
                  )}
                </div>
              </div>

              {/* Bank Account Info */}
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Tài khoản nhận</p>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="font-semibold text-[#2A2A2A]">
                    {paymentData.accountName}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-600 font-mono">
                      STK:{paymentData.accountNumber?.replace("V3CAS", "")}
                    </p>
                    <button
                      onClick={handleCopyAccount}
                      className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Copy số tài khoản"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Code */}
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Mã đơn hàng</p>
                <p className="font-semibold text-[#2A2A2A] font-mono">
                  {paymentData.orderCode}
                </p>
              </div>

              {/* Description */}
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Nội dung</p>
                <p className="font-medium text-[#2A2A2A]">
                  {paymentData.description}
                </p>
              </div>

              {/* Amount */}
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">Số tiền</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatMoney(amount)}
                </p>
              </div>

              {/* Auto-check status */}
              {!isExpired && (
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
                      ) : (
                        <>
                          <RefreshCw
                            className={`w-4 h-4 text-blue-600 ${
                              isCheckingPayment ? "animate-spin" : ""
                            }`}
                          />
                          <span className="text-sm text-blue-700">
                            Tự động kiểm tra mỗi 5s
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={checkPaymentStatus}
                      disabled={isCheckingPayment}
                      className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
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

              {/* Open Checkout Button */}
              {!isExpired && (
                <button
                  onClick={handleOpenCheckout}
                  className="w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                  <CreditCard className="w-5 h-5" />
                  Mở trang thanh toán
                </button>
              )}

              {isExpired && (
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 bg-gray-400 text-white"
                >
                  <X className="w-5 h-5" />
                  Đóng và tạo mã mới
                </button>
              )}
            </div>

            {/* Right Column - QR Code */}
            <div
              className={`p-6 flex flex-col items-center justify-center relative md:flex-1 ${
                isExpired ? "bg-gray-400" : "bg-blue-600"
              }`}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <h3 className="text-white font-semibold text-lg mb-4">
                {isExpired ? "Mã QR đã hết hạn" : "Quét mã QR để thanh toán"}
              </h3>

              {/* QR Code */}
              <div
                className={`relative p-3 bg-white rounded-2xl shadow-lg ${
                  isExpired ? "opacity-50" : ""
                }`}
              >
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getQrCodeSrc(paymentData.qrCode)}
                  alt="VietQR Code"
                  className="w-64 h-64 object-contain"
                  onError={(e) => {
                    // Fallback: nếu VietQR lỗi, thử dùng QR gốc từ PayOS
                    const target = e.target as HTMLImageElement;
                    if (
                      paymentData.qrCodeOriginal &&
                      !target.dataset.fallback
                    ) {
                      target.dataset.fallback = "true";
                      const originalQr = paymentData.qrCodeOriginal;
                      target.src =
                        originalQr.startsWith("http") ||
                        originalQr.startsWith("data:")
                          ? originalQr
                          : `data:image/png;base64,${originalQr}`;
                    }
                  }}
                />

                {isExpired && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                    <span className="text-white font-bold text-lg">
                      HẾT HẠN
                    </span>
                  </div>
                )}

                {paymentStatus === "completed" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/90 rounded-2xl">
                    <div className="text-center">
                      <Check className="w-16 h-16 text-white mx-auto mb-2" />
                      <span className="text-white font-bold text-lg">
                        THÀNH CÔNG
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-white/80 text-sm mt-4 text-center">
                {isExpired ? (
                  "Vui lòng đóng và tạo mã QR mới"
                ) : (
                  <>
                    Sử dụng app ngân hàng hoặc ví điện tử
                    <br />
                    để quét mã QR thanh toán
                  </>
                )}
              </p>

              {/* Open in new tab */}
              {!isExpired && (
                <button
                  onClick={handleOpenCheckout}
                  className="mt-4 px-6 py-2.5 rounded-full bg-white text-blue-600 font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Mở link thanh toán
                </button>
              )}

              {/* Security Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4">
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
                          {paymentData.accountName}
                        </span>
                      </li>
                      <li>
                        • STK:{" "}
                        <span className="font-semibold">
                          {paymentData.accountNumber?.replace("V3CAS", "")}
                        </span>
                      </li>
                      <li>• Xác nhận thông tin trên khớp với stk nhận tiền</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
