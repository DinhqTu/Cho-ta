"use client";

import { useState, useEffect } from "react";
import {
  isPushSupported,
  getPermissionStatus,
  requestPermission,
  subscribeToPush,
  unsubscribeFromPush,
  registerServiceWorker,
} from "@/lib/push-notifications";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const supported = isPushSupported();
      setIsSupported(supported);

      if (supported) {
        await registerServiceWorker();
        setPermission(getPermissionStatus());

        if (getPermissionStatus() === "granted") {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        }
      }
      setIsLoading(false);
    };

    init();
  }, []);

  const handleToggle = async () => {
    if (!isSupported) return;

    setIsLoading(true);

    try {
      if (isSubscribed) {
        // Unsubscribe
        await unsubscribeFromPush();
        setIsSubscribed(false);
      } else {
        // Request permission if needed
        if (permission !== "granted") {
          const newPermission = await requestPermission();
          setPermission(newPermission);

          if (newPermission !== "granted") {
            setIsLoading(false);
            return;
          }
        }

        // Subscribe
        const subscription = await subscribeToPush();
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error("Error toggling push notifications:", error);
    }

    setIsLoading(false);
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#2A2A2A]/50">
        <BellOff className="w-4 h-4" />
        <span>Trình duyệt không hỗ trợ thông báo</span>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500">
        <BellOff className="w-4 h-4" />
        <span>
          Thông báo đã bị chặn. Vui lòng bật trong cài đặt trình duyệt.
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
        isSubscribed
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-[#FBF8F4] text-[#2A2A2A]/70 hover:bg-[#F5EDE3]"
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      <span className="text-sm font-medium">
        {isLoading
          ? "Đang xử lý..."
          : isSubscribed
          ? "Đã bật thông báo"
          : "Bật thông báo đẩy"}
      </span>
    </button>
  );
}
