"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { formatMoney } from "@/lib/utils";
import {
  generateMoMoQRUrl,
  generateMoMoAppLink,
  generatePaymentCode,
  generatePaymentComment,
  getMoMoConfig,
} from "@/lib/momo-qr";
import {
  X,
  Check,
  Loader2,
  Copy,
  Smartphone,
  RefreshCw,
  Clock,
} from "lucide-react";

const EXPIRY_MINUTES = 15;

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
    "pending" | "completed" | "expired" | "error"
  >("pending");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [timeLeft, setTimeLeft] = useState(EXPIRY_MINUTES * 60); // seconds
  const [mounted, setMounted] = useState(false);
  const hasGeneratedCode = useRef(false);
  const expiryTime = useRef<Date | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate payment code và register khi modal mở
  useEffect(() => {
    if (open && !hasGeneratedCode.current) {
      // Generate code tạm để gửi lên server
      const tempCode = generatePaymentCode(userId, date);
      setPaymentStatus("pending");
      setLastChecked(null);
      setIsAnimating(true);
      hasGeneratedCode.current = true;

      // Register và lấy payment code từ server (có thể là code cũ nếu đã tồn tại)
      registerPendingPayment(tempCode);

      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }

    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      hasGeneratedCode.current = false;
      expiryTime.current = null;
      setIsAnimating(true);
      setPaymentCode(""); // Reset payment code khi đóng modal
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, userId, date]);

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

  const registerPendingPayment = async (tempCode: string) => {
    try {
      const response = await fetch("/api/register-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentCode: tempCode,
          userId,
          userName,
          userEmail,
          amount: amount * 1000,
          orderIds,
          date,
          expiryMinutes: EXPIRY_MINUTES,
        }),
      });

      if (!response.ok) {
        console.error("Failed to register payment:", await response.text());
        // Fallback: dùng code tạm nếu API lỗi
        setPaymentCode(tempCode);
        setTimeLeft(EXPIRY_MINUTES * 60);
        expiryTime.current = new Date();
        expiryTime.current.setMinutes(
          expiryTime.current.getMinutes() + EXPIRY_MINUTES
        );
        return;
      }

      const data = await response.json();

      // Sử dụng payment code từ server (có thể là code cũ nếu đã tồn tại)
      setPaymentCode(data.payment.paymentCode);

      // Tính thời gian còn lại dựa trên expiresAt từ server
      const serverExpiresAt = new Date(data.payment.expiresAt);
      expiryTime.current = serverExpiresAt;
      const remainingSeconds = Math.max(
        0,
        Math.floor((serverExpiresAt.getTime() - Date.now()) / 1000)
      );
      setTimeLeft(remainingSeconds);

      // Nếu đã hết hạn thì set status expired
      if (remainingSeconds <= 0) {
        setPaymentStatus("expired");
      }
    } catch (error) {
      console.error("Failed to register pending payment:", error);
      // Fallback: dùng code tạm nếu có lỗi
      setPaymentCode(tempCode);
      setTimeLeft(EXPIRY_MINUTES * 60);
      expiryTime.current = new Date();
      expiryTime.current.setMinutes(
        expiryTime.current.getMinutes() + EXPIRY_MINUTES
      );
    }
  };

  const checkPaymentStatus = useCallback(async () => {
    if (!paymentCode || !enableAutoCheck || paymentStatus === "expired") return;

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
  }, [paymentCode, enableAutoCheck, paymentStatus, onConfirm]);

  // Auto polling check payment status mỗi 5 giây
  useEffect(() => {
    if (
      !open ||
      !enableAutoCheck ||
      paymentStatus === "completed" ||
      paymentStatus === "expired"
    )
      return;

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

  // Format time left as MM:SS
  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const isExpired = paymentStatus === "expired" || timeLeft <= 0;

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
            {enableAutoCheck && !isExpired && (
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
            {isExpired ? (
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 bg-gray-400 text-white"
              >
                <X className="w-5 h-5" />
                Đóng và tạo mã mới
              </button>
            ) : (
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
            )}
          </div>

          {/* Right Column - QR Code */}
          <div
            className={`p-6 flex flex-col items-center justify-center relative md:flex-1 ${
              isExpired ? "bg-gray-400" : "bg-[#ae2070]"
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

            {/* QR Code with frame */}
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
                src={qrUrl}
                alt="MoMo QR Code"
                className="w-64 h-64 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/assets/images/momo_qr.jpg";
                }}
              />

              {isExpired && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                  <span className="text-white font-bold text-lg">HẾT HẠN</span>
                </div>
              )}
            </div>

            <p className="text-white/80 text-sm mt-4 text-center">
              {isExpired ? (
                "Vui lòng đóng và tạo mã QR mới"
              ) : (
                <>
                  Sử dụng{" "}
                  <span className="font-semibold text-white">App MoMo</span>{" "}
                  hoặc ứng dụng
                  <br />
                  camera hỗ trợ QR code để quét mã
                </>
              )}
            </p>

            {/* Open MoMo App Button */}
            {!isExpired && (
              <button
                onClick={handleOpenMoMo}
                className="mt-4 px-6 py-2.5 rounded-full bg-white text-[#ae2070] font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Mở app MoMo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
