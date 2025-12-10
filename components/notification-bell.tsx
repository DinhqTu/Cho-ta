"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Notification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
  createNotification,
} from "@/lib/api/notifications";
import { getUserDailyOrders } from "@/lib/api/daily-orders";
import { formatMoney } from "@/lib/utils";
import { Bell, X, CheckCheck, CreditCard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isPushSupported,
  getPermissionStatus,
  requestPermission,
  subscribeToPush,
  registerServiceWorker,
  showLocalNotification,
} from "@/lib/push-notifications";

// Notification sound URL
const NOTIFICATION_SOUND_URL = "/assets/media/notification.mp3";

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return date.toLocaleDateString("vi-VN");
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: () => void;
}) {
  const getIcon = () => {
    switch (notification.type) {
      case "payment_reminder":
        return <CreditCard className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-[#D4AF37]" />;
    }
  };

  return (
    <div
      className={cn(
        "p-3 border-b border-[#E9D7B8]/30 hover:bg-[#FBF8F4] transition-colors cursor-pointer",
        !notification.isRead && "bg-[#D4AF37]/5"
      )}
      onClick={onMarkRead}
    >
      <div className="flex gap-3">
        <div className="shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "text-sm",
                notification.isRead
                  ? "text-[#2A2A2A]/70"
                  : "text-[#2A2A2A] font-medium"
              )}
            >
              {notification.title}
            </p>
            {!notification.isRead && (
              <div className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0 mt-1.5" />
            )}
          </div>
          <p className="text-xs text-[#2A2A2A]/50 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-[#2A2A2A]/40 mt-1">
            {formatTime(notification.$createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastReminderRef = useRef<string | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.5;
  }, []);

  // Play notification sound
  const playSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .catch((e) => console.log("Audio play failed:", e));
    }
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [notifs, count] = await Promise.all([
        getUserNotifications(user.$id),
        getUnreadCount(user.$id),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Check and send payment reminder
  const checkPaymentReminder = useCallback(async () => {
    if (!user) return;

    const now = new Date();
    const currentHour = now.getHours();

    // Only send reminders from 12:00 onwards
    if (currentHour < 12) return;

    // Check if we already sent a reminder this hour
    const reminderKey = `${now.toISOString().split("T")[0]}-${currentHour}`;
    if (lastReminderRef.current === reminderKey) return;

    try {
      // Get user's unpaid orders for today
      const orders = await getUserDailyOrders(user.$id);
      const unpaidOrders = orders.filter((o) => !o.isPaid);

      if (unpaidOrders.length > 0) {
        const totalUnpaid = unpaidOrders.reduce(
          (sum, o) => sum + o.menuItemPrice * o.quantity,
          0
        );

        // Create payment reminder notification
        await createNotification(
          user.$id,
          "💰 Nhắc thanh toán",
          `Bạn có ${
            unpaidOrders.length
          } món chưa thanh toán với tổng ${formatMoney(
            totalUnpaid
          )}. Vui lòng thanh toán để hoàn tất đơn hàng!`,
          "payment_reminder"
        );

        lastReminderRef.current = reminderKey;
        playSound();
        loadNotifications();
      }
    } catch (error) {
      console.error("Error checking payment reminder:", error);
    }
  }, [user, playSound, loadNotifications]);

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Initialize push notifications
  useEffect(() => {
    const initPush = async () => {
      if (isPushSupported()) {
        await registerServiceWorker();
        if (getPermissionStatus() === "granted") {
          await subscribeToPush();
        }
      }
    };
    initPush();
  }, []);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToNotifications(user.$id, (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      playSound();

      // Also show browser notification if permitted
      if (getPermissionStatus() === "granted") {
        showLocalNotification(
          notification.title,
          notification.message,
          "/summary"
        );
      }
    });

    return () => unsubscribe();
  }, [user, playSound]);

  // Check payment reminder every minute
  useEffect(() => {
    if (!user) return;

    // Check immediately
    checkPaymentReminder();

    // Then check every minute
    const interval = setInterval(checkPaymentReminder, 60000);

    return () => clearInterval(interval);
  }, [user, checkPaymentReminder]);

  // Handle mark as read
  const handleMarkRead = async (notification: Notification) => {
    if (notification.isRead) return;

    const success = await markAsRead(notification.$id);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.$id === notification.$id ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    if (!user || unreadCount === 0) return;

    const success = await markAllAsRead(user.$id);
    if (success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-[#FBF8F4] transition-colors"
      >
        <Bell className="w-5 h-5 text-[#2A2A2A]/70" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#E9D7B8]/50 overflow-hidden z-50">
            {/* Header */}
            <div className="p-3 border-b border-[#E9D7B8]/30 flex items-center justify-between bg-[#FBF8F4]">
              <h3 className="font-semibold text-[#2A2A2A]">Thông báo</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="p-1.5 rounded-lg hover:bg-white transition-colors"
                    title="Đánh dấu tất cả đã đọc"
                  >
                    <CheckCheck className="w-4 h-4 text-[#D4AF37]" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white transition-colors"
                >
                  <X className="w-4 h-4 text-[#2A2A2A]/50" />
                </button>
              </div>
            </div>

            {/* Push notification toggle */}
            <PushToggle />

            {/* Notifications list */}
            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-[#2A2A2A]/50">
                  Đang tải...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-10 h-10 text-[#2A2A2A]/20 mx-auto mb-2" />
                  <p className="text-sm text-[#2A2A2A]/50">
                    Chưa có thông báo nào
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationItem
                    key={notification.$id}
                    notification={notification}
                    onMarkRead={() => handleMarkRead(notification)}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Push notification toggle inside dropdown
function PushToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsSupported(isPushSupported());
    if (isPushSupported()) {
      setPermission(getPermissionStatus());
    }
  }, []);

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      const newPermission = await requestPermission();
      setPermission(newPermission);
      if (newPermission === "granted") {
        await subscribeToPush();
      }
    } catch (error) {
      console.error("Error enabling push:", error);
    }
    setIsLoading(false);
  };

  if (!isSupported) return null;

  if (permission === "granted") {
    return (
      <div className="px-3 py-2 border-b border-[#E9D7B8]/30 bg-green-50 flex items-center gap-2 text-green-700 text-xs">
        <Bell className="w-3.5 h-3.5" />
        <span>Thông báo đẩy đã bật</span>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="px-3 py-2 border-b border-[#E9D7B8]/30 bg-red-50 flex items-center gap-2 text-red-600 text-xs">
        <Settings className="w-3.5 h-3.5" />
        <span>Thông báo bị chặn. Bật trong cài đặt trình duyệt.</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleEnable}
      disabled={isLoading}
      className="w-full px-3 py-2 border-b border-[#E9D7B8]/30 bg-[#D4AF37]/10 flex items-center gap-2 text-[#D4AF37] text-xs hover:bg-[#D4AF37]/20 transition-colors"
    >
      <Bell className="w-3.5 h-3.5" />
      <span>
        {isLoading ? "Đang bật..." : "Bật thông báo đẩy để nhận nhắc nhở"}
      </span>
    </button>
  );
}
