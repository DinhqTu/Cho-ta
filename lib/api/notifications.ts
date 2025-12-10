import { databases, DATABASE_ID, ID, Query, client } from "../appwrite";

export const NOTIFICATIONS_COLLECTION = "notifications";

export interface Notification {
  $id: string;
  $createdAt: string;
  userId: string;
  title: string;
  message: string;
  type: "payment_reminder" | "order_update" | "general";
  isRead: boolean;
  date: string;
}

// Get today's date (local timezone)
function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Create a notification
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: Notification["type"] = "general"
): Promise<Notification | null> {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION,
      ID.unique(),
      {
        userId,
        title,
        message,
        type,
        isRead: false,
        date: getTodayDate(),
      }
    );
    return doc as unknown as Notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

// Get user's notifications
export async function getUserNotifications(
  userId: string
): Promise<Notification[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION,
      [
        Query.equal("userId", userId),
        Query.orderDesc("$createdAt"),
        Query.limit(50),
      ]
    );
    return response.documents as unknown as Notification[];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

// Get unread notifications count
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION,
      [
        Query.equal("userId", userId),
        Query.equal("isRead", false),
        Query.limit(100),
      ]
    );
    return response.total;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }
}

// Mark notification as read
export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION,
      notificationId,
      { isRead: true }
    );
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
}

// Mark all notifications as read
export async function markAllAsRead(userId: string): Promise<boolean> {
  try {
    const notifications = await getUserNotifications(userId);
    const unread = notifications.filter((n) => !n.isRead);
    for (const n of unread) {
      await markAsRead(n.$id);
    }
    return true;
  } catch (error) {
    console.error("Error marking all as read:", error);
    return false;
  }
}

// Subscribe to new notifications (realtime)
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
): () => void {
  const channel = `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_COLLECTION}.documents`;

  const unsubscribe = client.subscribe(channel, (response) => {
    if (
      response.events.includes(
        `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_COLLECTION}.documents.*.create`
      )
    ) {
      const notification = response.payload as unknown as Notification;
      if (notification.userId === userId) {
        callback(notification);
      }
    }
  });

  return unsubscribe;
}

// Delete a notification
export async function deleteNotification(
  notificationId: string
): Promise<boolean> {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION,
      notificationId
    );
    return true;
  } catch (error) {
    console.error("Error deleting notification:", error);
    return false;
  }
}
