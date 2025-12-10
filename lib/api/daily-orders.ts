import { databases, DATABASE_ID, ID, Query } from "../appwrite";
import { User } from "../auth";

// Collection ID for daily orders
export const DAILY_ORDERS_COLLECTION = "daily_orders";

/*
Schema for daily_orders collection in Appwrite:
- $id: string (auto)
- date: string (YYYY-MM-DD format, indexed)
- menuItemId: string (reference to menu item)
- menuItemName: string (denormalized for quick access)
- menuItemPrice: number
- menuItemCategory: string
- userId: string (Appwrite user ID)
- userName: string
- userEmail: string
- quantity: number
- note: string (optional)
- createdAt: string (ISO datetime)
- updatedAt: string (ISO datetime)

Indexes to create in Appwrite Console:
1. date (ASC) - for filtering by date
2. date + menuItemId (ASC) - for grouping
3. date + userId (ASC) - for user's orders
*/

export interface DailyOrderDoc {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  date: string;
  menuItemId: string;
  menuItemName: string;
  menuItemPrice: number;
  menuItemCategory: string;
  userId: string;
  userName: string;
  userEmail: string;
  quantity: number;
  note?: string;
  isPaid?: boolean;
}

export interface DailyOrderInput {
  menuItemId: string;
  menuItemName: string;
  menuItemPrice: number;
  menuItemCategory: string;
  quantity: number;
  note?: string;
}

// Get today's date in YYYY-MM-DD format (local timezone)
export function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Get date string for a specific date
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Create or update a daily order
export async function saveDailyOrder(
  user: User,
  order: DailyOrderInput,
  date?: string
): Promise<DailyOrderDoc | null> {
  const orderDate = date || getTodayDate();

  try {
    // Check if user already has an order for this item today
    const existing = await databases.listDocuments(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      [
        Query.equal("date", orderDate),
        Query.equal("userId", user.$id),
        Query.equal("menuItemId", order.menuItemId),
      ]
    );

    if (existing.documents.length > 0) {
      // Update existing order
      const doc = await databases.updateDocument(
        DATABASE_ID,
        DAILY_ORDERS_COLLECTION,
        existing.documents[0].$id,
        {
          quantity: order.quantity,
          note: order.note || "",
        }
      );
      return doc as unknown as DailyOrderDoc;
    } else {
      // Create new order
      const doc = await databases.createDocument(
        DATABASE_ID,
        DAILY_ORDERS_COLLECTION,
        ID.unique(),
        {
          date: orderDate,
          menuItemId: order.menuItemId,
          menuItemName: order.menuItemName,
          menuItemPrice: order.menuItemPrice,
          menuItemCategory: order.menuItemCategory,
          userId: user.$id,
          userName: user.name || "Unknown",
          userEmail: user.email,
          quantity: order.quantity,
          note: order.note || "",
          isPaid: false,
        }
      );
      return doc as unknown as DailyOrderDoc;
    }
  } catch (error) {
    console.error("Error saving daily order:", error);
    return null;
  }
}

// Save multiple orders at once
export async function saveDailyOrders(
  user: User,
  orders: DailyOrderInput[],
  date?: string
): Promise<boolean> {
  try {
    for (const order of orders) {
      await saveDailyOrder(user, order, date);
    }
    return true;
  } catch (error) {
    console.error("Error saving daily orders:", error);
    return false;
  }
}

// Get all orders for a specific date
export async function getDailyOrders(date?: string): Promise<DailyOrderDoc[]> {
  const orderDate = date || getTodayDate();

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      [
        Query.equal("date", orderDate),
        Query.orderAsc("menuItemCategory"),
        Query.orderAsc("menuItemName"),
      ]
    );
    return response.documents as unknown as DailyOrderDoc[];
  } catch (error) {
    console.error("Error fetching daily orders:", error);
    return [];
  }
}

// Get orders for a specific user on a date
export async function getUserDailyOrders(
  userId: string,
  date?: string
): Promise<DailyOrderDoc[]> {
  const orderDate = date || getTodayDate();

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      [Query.equal("date", orderDate), Query.equal("userId", userId)]
    );
    return response.documents as unknown as DailyOrderDoc[];
  } catch (error) {
    console.error("Error fetching user daily orders:", error);
    return [];
  }
}

// Update payment status
export async function updateOrderPaymentStatus(
  orderId: string,
  isPaid: boolean
): Promise<boolean> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      orderId,
      { isPaid }
    );
    return true;
  } catch (error) {
    console.error("Error updating payment status:", error);
    return false;
  }
}

// Delete a daily order
export async function deleteDailyOrder(orderId: string): Promise<boolean> {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      orderId
    );
    return true;
  } catch (error) {
    console.error("Error deleting daily order:", error);
    return false;
  }
}

// Delete all orders for a user on a specific date
export async function deleteUserDailyOrders(
  userId: string,
  date?: string
): Promise<boolean> {
  const orderDate = date || getTodayDate();

  try {
    const orders = await getUserDailyOrders(userId, orderDate);
    for (const order of orders) {
      await databases.deleteDocument(
        DATABASE_ID,
        DAILY_ORDERS_COLLECTION,
        order.$id
      );
    }
    return true;
  } catch (error) {
    console.error("Error deleting user daily orders:", error);
    return false;
  }
}

// Get summary of orders grouped by menu item for a date
export interface DailyOrderSummary {
  menuItemId: string;
  menuItemName: string;
  menuItemPrice: number;
  menuItemCategory: string;
  totalQuantity: number;
  totalAmount: number;
  orders: {
    orderId: string;
    userId: string;
    userName: string;
    quantity: number;
    note?: string;
  }[];
}

export async function getDailyOrderSummary(
  date?: string
): Promise<DailyOrderSummary[]> {
  const orders = await getDailyOrders(date);

  const summaryMap = new Map<string, DailyOrderSummary>();

  for (const order of orders) {
    const existing = summaryMap.get(order.menuItemId);

    if (existing) {
      existing.totalQuantity += order.quantity;
      existing.totalAmount += order.quantity * order.menuItemPrice;
      existing.orders.push({
        orderId: order.$id,
        userId: order.userId,
        userName: order.userName,
        quantity: order.quantity,
        note: order.note,
      });
    } else {
      summaryMap.set(order.menuItemId, {
        menuItemId: order.menuItemId,
        menuItemName: order.menuItemName,
        menuItemPrice: order.menuItemPrice,
        menuItemCategory: order.menuItemCategory,
        totalQuantity: order.quantity,
        totalAmount: order.quantity * order.menuItemPrice,
        orders: [
          {
            orderId: order.$id,
            userId: order.userId,
            userName: order.userName,
            quantity: order.quantity,
            note: order.note,
          },
        ],
      });
    }
  }

  return Array.from(summaryMap.values()).sort(
    (a, b) => b.totalQuantity - a.totalQuantity
  );
}

// Get total stats for a date
export interface DailyStats {
  date: string;
  totalOrders: number;
  totalItems: number;
  totalAmount: number;
  uniqueUsers: number;
  topItems: { name: string; quantity: number }[];
}

export async function getDailyStats(date?: string): Promise<DailyStats> {
  const orderDate = date || getTodayDate();
  const orders = await getDailyOrders(orderDate);

  const userIds = new Set<string>();
  const itemCounts = new Map<string, { name: string; quantity: number }>();
  let totalItems = 0;
  let totalAmount = 0;

  for (const order of orders) {
    userIds.add(order.userId);
    totalItems += order.quantity;
    totalAmount += order.quantity * order.menuItemPrice;

    const existing = itemCounts.get(order.menuItemId);
    if (existing) {
      existing.quantity += order.quantity;
    } else {
      itemCounts.set(order.menuItemId, {
        name: order.menuItemName,
        quantity: order.quantity,
      });
    }
  }

  const topItems = Array.from(itemCounts.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3);

  return {
    date: orderDate,
    totalOrders: orders.length,
    totalItems,
    totalAmount,
    uniqueUsers: userIds.size,
    topItems,
  };
}
