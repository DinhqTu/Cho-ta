import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from "../appwrite";
import { User } from "../users-data";

export interface OrderDoc {
  $id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userColor: string;
  status: "pending" | "confirmed" | "completed";
  createdAt: string;
}

export interface OrderItemDoc {
  $id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  note?: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userColor: string;
}

export interface UserOrderData {
  user: User;
  itemId: string;
  quantity: number;
  note?: string;
}

// Create a new order session (for group ordering)
export async function createOrderSession(): Promise<string | null> {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.ORDERS,
      ID.unique(),
      {
        sessionId: ID.unique(),
        status: "pending",
        createdAt: new Date().toISOString(),
      }
    );
    return doc.$id;
  } catch (error) {
    console.error("Error creating order session:", error);
    return null;
  }
}

// Add items to an order
export async function addOrderItems(
  sessionId: string,
  items: UserOrderData[]
): Promise<boolean> {
  try {
    for (const item of items) {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.ORDER_ITEMS,
        ID.unique(),
        {
          orderId: sessionId,
          menuItemId: item.itemId,
          quantity: item.quantity,
          note: item.note || "",
          userId: item.user.id,
          userName: item.user.name,
          userAvatar: item.user.avatar,
          userColor: item.user.color,
        }
      );
    }
    return true;
  } catch (error) {
    console.error("Error adding order items:", error);
    return false;
  }
}

// Get all order items for a session
export async function getOrderItems(
  sessionId: string
): Promise<UserOrderData[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.ORDER_ITEMS,
      [Query.equal("orderId", sessionId)]
    );

    return response.documents.map((doc) => {
      const item = doc as unknown as OrderItemDoc;
      return {
        user: {
          id: item.userId,
          name: item.userName,
          avatar: item.userAvatar,
          color: item.userColor,
        },
        itemId: item.menuItemId,
        quantity: item.quantity,
        note: item.note,
      };
    });
  } catch (error) {
    console.error("Error fetching order items:", error);
    return [];
  }
}

// Get active order session
export async function getActiveOrderSession(): Promise<string | null> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.ORDERS,
      [
        Query.equal("status", "pending"),
        Query.orderDesc("createdAt"),
        Query.limit(1),
      ]
    );

    if (response.documents.length > 0) {
      return response.documents[0].$id;
    }
    return null;
  } catch (error) {
    console.error("Error fetching active session:", error);
    return null;
  }
}

// Update order status
export async function updateOrderStatus(
  sessionId: string,
  status: "pending" | "confirmed" | "completed"
): Promise<boolean> {
  try {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.ORDERS, sessionId, {
      status,
    });
    return true;
  } catch (error) {
    console.error("Error updating order status:", error);
    return false;
  }
}
