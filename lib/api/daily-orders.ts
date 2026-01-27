import { databases, DATABASE_ID, ID, Query, COLLECTIONS } from "../appwrite";
import { User } from "../auth";
import { MenuItemDoc } from "./menu";
import { RestaurantDoc } from "./restaurants";

// Collection ID for daily orders
export const DAILY_ORDERS_COLLECTION = "daily_orders";

/*
Schema for daily_orders collection in Appwrite:
- $id: string (auto)
- date: string (YYYY-MM-DD format, indexed)
- restaurantId: string (reference to restaurants collection, indexed)
- menuItemIds: array (relationship to menu_items collection)
- userId: string (Appwrite user ID)
- userName: string
- userEmail: string
- quantity: number
- note: string (optional)
- isPaid: boolean
- createdAt: string (ISO datetime) - Appwrite $createdAt
- updatedAt: string (ISO datetime) - Appwrite $updatedAt

Indexes to create in Appwrite Console:
1. date (ASC) - for filtering by date
2. date + userId (ASC) - for user's orders
3. restaurantId (ASC) - for restaurant orders
4. isPaid (ASC) - for payment status
*/

export interface DailyOrderDoc {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  userName: string;
  userEmail: string;
  menuItemId: string | MenuItemDoc;
  quantity: number;
  note?: string;
  isPaid: boolean;
  date: string;
  restaurantId: string | RestaurantDoc;
}

export interface DailyOrderInput {
  restaurantId: string;
  menuItemId: string; // Changed to single relationship
  quantity: number;
  note?: string;
}

export interface DailyOrderWithDetails extends DailyOrderDoc {
  menuItemDetails: MenuItemDoc[]; // Keep array for consistency but will have 1 item
  restaurantDetails?: RestaurantDoc; // Restaurant details when restaurantId is a relationship
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
  date?: string,
): Promise<DailyOrderDoc | null> {
  const orderDate = date || getTodayDate();

  try {
    // Create new order - 1 row per menu item

    const doc = await databases.createDocument(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      ID.unique(),
      {
        date: orderDate,
        restaurantId: order.restaurantId,
        menuItemId: order.menuItemId,
        userId: user.$id,
        userName: user.name || "Unknown",
        userEmail: user.email,
        quantity: order.quantity,
        note: order.note || "",
        isPaid: false,
      },
    );
    return doc as unknown as DailyOrderDoc;
  } catch (error) {
    console.error("Error saving daily order:", error);
    return null;
  }
}

// Save multiple orders at once
export async function saveDailyOrders(
  user: User,
  orders: DailyOrderInput[],
  date?: string,
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
export async function getDailyOrders(
  date?: string,
  restaurantId?: string,
): Promise<DailyOrderDoc[]> {
  const orderDate = date || getTodayDate();

  try {
    const queries = [Query.equal("date", orderDate)];

    if (restaurantId) {
      queries.push(Query.equal("restaurantId", restaurantId));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      queries,
    );
    return response.documents as unknown as DailyOrderDoc[];
  } catch (error) {
    console.error("Error fetching daily orders:", error);
    return [];
  }
}

// Get orders for a specific restaurant on a specific date
export async function getRestaurantDailyOrders(
  restaurantId: string,
  date?: string,
): Promise<DailyOrderDoc[]> {
  const orderDate = date || getTodayDate();

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      [
        Query.equal("date", orderDate),
        Query.equal("restaurantId", restaurantId),
      ],
    );
    return response.documents as unknown as DailyOrderDoc[];
  } catch (error) {
    console.error("Error fetching restaurant daily orders:", error);
    return [];
  }
}

// Get orders for a specific user on a date
export async function getUserDailyOrders(
  userId: string,
  date?: string,
  restaurantId?: string,
): Promise<DailyOrderDoc[]> {
  const orderDate = date || getTodayDate();

  try {
    const queries = [
      Query.equal("date", orderDate),
      Query.equal("userId", userId),
    ];

    if (restaurantId) {
      queries.push(Query.equal("restaurantId", restaurantId));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      queries,
    );
    return response.documents as unknown as DailyOrderDoc[];
  } catch (error) {
    console.error("Error fetching user daily orders:", error);
    return [];
  }
}

// Get all orders for a date with menu item details
export async function getAllDailyOrdersWithDetails(
  date?: string,
  restaurantId?: string,
): Promise<DailyOrderWithDetails[]> {
  const orderDate = date || getTodayDate();

  try {
    const queries = [Query.equal("date", orderDate)];

    if (restaurantId) {
      queries.push(Query.equal("restaurantId", restaurantId));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      queries,
    );

    const orders = response.documents as unknown as DailyOrderDoc[];

    // Process each order to fetch menu item details
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        let menuItemDetails: MenuItemDoc[] = [];

        if (order.menuItemId) {
          try {
            // Fetch single menu item by ID
            const menuItemResponse = await databases.getDocument(
              DATABASE_ID,
              COLLECTIONS.MENU_ITEMS,
              order.menuItemId as string,
            );
            menuItemDetails = [menuItemResponse as unknown as MenuItemDoc];
          } catch (e) {
            console.error("Error fetching menu item details:", e);
          }
        }

        return {
          ...order,
          menuItemDetails,
        };
      }),
    );

    return ordersWithDetails;
  } catch (error) {
    console.error("Error fetching all daily orders with details:", error);
    return [];
  }
}

export async function getUserDailyOrdersWithDetails(
  userId: string,
  date?: string,
  restaurantId?: string,
): Promise<DailyOrderWithDetails[]> {
  const orderDate = date || getTodayDate();

  try {
    const queries = [
      Query.equal("date", orderDate),
      Query.equal("userId", userId),
      Query.select(["*", "menuItemId.*"]),
    ];

    if (restaurantId) {
      queries.push(Query.equal("restaurantId", restaurantId));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      queries,
    );

    const orders = response.documents as unknown as DailyOrderDoc[];

    return orders.map((order: any) => ({
      ...order,
      menuItemDetails: order.menuItemId ? [order.menuItemId] : [], // Single item in array
    }));
  } catch (error) {
    console.error("Error fetching user daily orders with details:", error);
    return [];
  }
}

// Update payment status
export async function updateOrderPaymentStatus(
  orderId: string,
  isPaid: boolean,
): Promise<boolean> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      orderId,
      { isPaid },
    );
    return true;
  } catch (error) {
    console.error("Error updating payment status:", error);
    return false;
  }
}

// Update order quantity
export async function updateOrderQuantity(
  orderId: string,
  quantity: number,
): Promise<boolean> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      orderId,
      { quantity },
    );
    return true;
  } catch (error) {
    console.error("Error updating order quantity:", error);
    return false;
  }
}

// Update order with quantity and note
export async function updateOrder(
  orderId: string,
  quantity: number,
  note?: string,
): Promise<boolean> {
  try {
    const updateData: any = { quantity };
    if (note !== undefined) {
      updateData.note = note;
    }

    await databases.updateDocument(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      orderId,
      updateData,
    );
    return true;
  } catch (error) {
    console.error("Error updating order:", error);
    return false;
  }
}

// Delete a daily order
export async function deleteDailyOrder(orderId: string): Promise<boolean> {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      orderId,
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
  date?: string,
): Promise<boolean> {
  const orderDate = date || getTodayDate();

  try {
    const orders = await getUserDailyOrders(userId, orderDate);
    for (const order of orders) {
      await databases.deleteDocument(
        DATABASE_ID,
        DAILY_ORDERS_COLLECTION,
        order.$id,
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
  menuItemDetails: MenuItemDoc[];
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
  date?: string,
  restaurantId?: string,
): Promise<DailyOrderSummary[]> {
  const orders = await getDailyOrders(date, restaurantId);

  const summaryMap = new Map<string, DailyOrderSummary>();

  for (const order of orders) {
    // Use menuItemId as key
    const key = order.menuItemId as string;
    const existing = summaryMap.get(key);

    // Fetch menu item details for this order
    let menuItemDetails: MenuItemDoc[] = [];
    if (order.menuItemId) {
      try {
        const menuItemResponse = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.MENU_ITEMS,
          order.menuItemId as string,
        );
        menuItemDetails = [menuItemResponse as unknown as MenuItemDoc];
      } catch (e) {
        console.error("Error fetching menu item details:", e);
      }
    }

    // Calculate total amount from menu item prices
    const totalAmount = menuItemDetails.reduce(
      (sum, item) => sum + (item.price || 0) * order.quantity,
      0,
    );

    if (existing) {
      existing.totalQuantity += order.quantity;
      existing.totalAmount += totalAmount;
      existing.orders.push({
        orderId: order.$id,
        userId: order.userId,
        userName: order.userName,
        quantity: order.quantity,
        note: order.note,
      });
    } else {
      summaryMap.set(key, {
        menuItemId: order.menuItemId as string,
        menuItemDetails,
        totalQuantity: order.quantity,
        totalAmount,
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
    (a, b) => b.totalQuantity - a.totalQuantity,
  );
}

// Get unpaid orders for a user (all dates)
export interface UnpaidOrdersByDate {
  date: string;
  orders: DailyOrderDoc[];
  totalAmount: number;
}

export async function getUserUnpaidOrders(
  userId: string,
  restaurantId?: string,
): Promise<UnpaidOrdersByDate[]> {
  try {
    const queries = [
      Query.equal("userId", userId),
      Query.equal("isPaid", false),
      Query.orderDesc("date"),
      Query.limit(100),
    ];

    if (restaurantId) {
      queries.push(Query.equal("restaurantId", restaurantId));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      queries,
    );

    const orders = response.documents as unknown as DailyOrderDoc[];

    // Group by date
    const dateMap = new Map<string, DailyOrderDoc[]>();
    for (const order of orders) {
      const existing = dateMap.get(order.date);
      if (existing) {
        existing.push(order);
      } else {
        dateMap.set(order.date, [order]);
      }
    }

    // Convert to array with totals - need to fetch menu item details for pricing
    return await Promise.all(
      Array.from(dateMap.entries()).map(async ([date, dateOrders]) => {
        let totalAmount = 0;

        // Calculate total amount by fetching menu item details
        for (const order of dateOrders) {
          if (order.menuItemId) {
            try {
              const menuItemResponse = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.MENU_ITEMS,
                order.menuItemId as string,
              );
              const menuItem = menuItemResponse as unknown as MenuItemDoc;
              const orderTotal = (menuItem.price || 0) * order.quantity;
              totalAmount += orderTotal;
            } catch (e) {
              console.error("Error calculating order total:", e);
            }
          }
        }

        return {
          date,
          orders: dateOrders,
          totalAmount,
        };
      }),
    );
  } catch (error) {
    console.error("Error fetching user unpaid orders:", error);
    return [];
  }
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

export async function getDailyStats(
  date?: string,
  restaurantId?: string,
): Promise<DailyStats> {
  const orderDate = date || getTodayDate();
  const orders = await getDailyOrders(orderDate, restaurantId);

  const userIds = new Set<string>();
  const itemCounts = new Map<string, { name: string; quantity: number }>();
  let totalItems = 0;
  let totalAmount = 0;

  for (const order of orders) {
    userIds.add(order.userId);
    totalItems += order.quantity;

    // Fetch menu item details to calculate price and get name
    if (order.menuItemId) {
      try {
        const menuItemResponse = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.MENU_ITEMS,
          order.menuItemId as string,
        );
        const menuItem = menuItemResponse as unknown as MenuItemDoc;

        // Calculate total amount for this order
        const orderTotal = (menuItem.price || 0) * order.quantity;
        totalAmount += orderTotal;

        // Update item counts for top items
        const existing = itemCounts.get(menuItem.$id);
        if (existing) {
          existing.quantity += order.quantity;
        } else {
          itemCounts.set(menuItem.$id, {
            name: menuItem.name,
            quantity: order.quantity,
          });
        }
      } catch (e) {
        console.error("Error fetching menu items for stats:", e);
      }
    }
  }

  const topItems = Array.from(itemCounts.values())
    .sort((a: any, b: any) => b.quantity - a.quantity)
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

// Get all orders for a user with details
export async function getAllUserOrdersWithDetails(
  userId: string,
  limit?: number,
  offset?: number,
): Promise<DailyOrderWithDetails[]> {
  try {
    const queries = [
      Query.equal("userId", userId),
      Query.orderDesc("$createdAt"), // Most recent first
      Query.limit(limit || 100),
    ];

    if (offset) {
      queries.push(Query.offset(offset));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      queries,
    );

    const orders = response.documents as unknown as DailyOrderDoc[];

    // Fetch menu item and restaurant details for each order
    const ordersWithDetails: DailyOrderWithDetails[] = await Promise.all(
      orders.map(async (order) => {
        try {
          // Skip API calls if essential data is missing
          if (!order.menuItemId || typeof order.menuItemId !== "string") {
            // Return order with empty details - no API calls made
            return {
              ...order,
              menuItemDetails: [],
              restaurantDetails: undefined,
            };
          }

          // Fetch menu item details
          const menuItemResponse = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.MENU_ITEMS,
            order.menuItemId,
          );

          const menuItem = menuItemResponse as unknown as MenuItemDoc;

          // Fetch restaurant details only if restaurantId exists and is valid
          let restaurantDetails: RestaurantDoc | undefined;
          if (
            order.restaurantId &&
            typeof order.restaurantId === "string" &&
            order.restaurantId.trim()
          ) {
            try {
              const restaurantResponse = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.RESTAURANTS,
                order.restaurantId,
              );
              restaurantDetails =
                restaurantResponse as unknown as RestaurantDoc;
            } catch (restaurantError) {
              console.error(
                `Failed to fetch restaurant ${order.restaurantId}:`,
                restaurantError,
              );
            }
          } else if (
            order.restaurantId &&
            typeof order.restaurantId === "object"
          ) {
            // restaurantId is already a populated RestaurantDoc
            restaurantDetails = order.restaurantId as RestaurantDoc;
          }

          return {
            ...order,
            menuItemDetails: [menuItem],
            restaurantDetails,
          };
        } catch (error) {
          console.error(
            `Failed to fetch menu item ${order.menuItemId}:`,
            error,
          );
          // Return order with empty details if fetch fails
          return {
            ...order,
            menuItemDetails: [],
            restaurantDetails: undefined,
          };
        }
      }),
    );

    return ordersWithDetails;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw error;
  }
}
