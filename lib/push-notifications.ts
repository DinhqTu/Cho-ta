// Web Push Notifications utility

// VAPID public key - you need to generate your own
// Generate at: https://vapidkeys.com/ or use web-push library
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// Get current permission status
export function getPermissionStatus(): NotificationPermission {
  if (!("Notification" in window)) return "denied";
  return Notification.permission;
}

// Request notification permission
export async function requestPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return "denied";
  }
  return await Notification.requestPermission();
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.log("Service Worker not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("Service Worker registered:", registration);
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      return subscription;
    }

    // Subscribe
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    console.log("Push subscription:", subscription);
    return subscription;
  } catch (error) {
    console.error("Failed to subscribe to push:", error);
    return null;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to unsubscribe:", error);
    return false;
  }
}

// Get current subscription
export async function getSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error("Failed to get subscription:", error);
    return null;
  }
}

// Show local notification (when app is open)
export function showLocalNotification(
  title: string,
  body: string,
  url?: string
): void {
  if (Notification.permission !== "granted") return;

  const notification = new Notification(title, {
    body,
    icon: "/assets/images/logo_batcomman.jpg",
    badge: "/assets/images/logo_batcomman.jpg",
  });

  notification.onclick = () => {
    window.focus();
    if (url) {
      window.location.href = url;
    }
    notification.close();
  };
}

// Initialize push notifications
export async function initPushNotifications(): Promise<{
  supported: boolean;
  permission: NotificationPermission;
  subscription: PushSubscription | null;
}> {
  const supported = isPushSupported();

  if (!supported) {
    return { supported: false, permission: "denied", subscription: null };
  }

  await registerServiceWorker();
  const permission = getPermissionStatus();
  let subscription: PushSubscription | null = null;

  if (permission === "granted") {
    subscription = await subscribeToPush();
  }

  return { supported, permission, subscription };
}
