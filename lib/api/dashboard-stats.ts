import { databases, DATABASE_ID, Query } from "../appwrite";
import { DAILY_ORDERS_COLLECTION, DailyOrderDoc } from "./daily-orders";

// Helper to format date to YYYY-MM-DD (local timezone)
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Get date range helpers
export function getDateRange(period: "day" | "week" | "month"): {
  start: string;
  end: string;
} {
  const now = new Date();
  const end = formatLocalDate(now);

  let start: Date;
  switch (period) {
    case "day":
      start = now;
      break;
    case "week":
      start = new Date(now);
      start.setDate(start.getDate() - 6);
      break;
    case "month":
      start = new Date(now);
      start.setDate(start.getDate() - 29);
      break;
  }

  return {
    start: formatLocalDate(start),
    end,
  };
}

// Get orders for a date range
export async function getOrdersInRange(
  startDate: string,
  endDate: string
): Promise<DailyOrderDoc[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      [
        Query.greaterThanEqual("date", startDate),
        Query.lessThanEqual("date", endDate),
        Query.limit(1000),
      ]
    );
    return response.documents as unknown as DailyOrderDoc[];
  } catch (error) {
    console.error("Error fetching orders in range:", error);
    return [];
  }
}

// Dashboard stats interface
export interface DashboardStats {
  today: {
    orders: number;
    items: number;
    amount: number;
    users: number;
    paidAmount: number;
  };
  week: {
    orders: number;
    items: number;
    amount: number;
    users: number;
  };
  month: {
    orders: number;
    items: number;
    amount: number;
    users: number;
  };
  dailyData: {
    date: string;
    orders: number;
    amount: number;
    items: number;
  }[];
  topItems: {
    name: string;
    quantity: number;
    amount: number;
  }[];
  topUsers: {
    name: string;
    orders: number;
    amount: number;
  }[];
}

// Calculate stats from orders
function calculateStats(orders: DailyOrderDoc[]) {
  const userIds = new Set<string>();
  let totalItems = 0;
  let totalAmount = 0;
  let paidAmount = 0;

  for (const order of orders) {
    userIds.add(order.userId);
    totalItems += order.quantity;
    totalAmount += order.menuItemPrice * order.quantity;
    if (order.isPaid) {
      paidAmount += order.menuItemPrice * order.quantity;
    }
  }

  return {
    orders: orders.length,
    items: totalItems,
    amount: totalAmount,
    users: userIds.size,
    paidAmount,
  };
}

// Get user-specific stats
export async function getUserStats(userId: string): Promise<DashboardStats> {
  const today = formatLocalDate(new Date());

  // Get date ranges
  const weekRange = getDateRange("week");
  const monthRange = getDateRange("month");

  // Fetch all orders for the month for this user
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      [
        Query.equal("userId", userId),
        Query.greaterThanEqual("date", monthRange.start),
        Query.lessThanEqual("date", monthRange.end),
        Query.limit(1000),
      ]
    );
    const monthOrders = response.documents as unknown as DailyOrderDoc[];

    // Filter for different periods
    const todayOrders = monthOrders.filter((o) => o.date === today);
    const weekOrders = monthOrders.filter((o) => o.date >= weekRange.start);

    // Calculate stats
    const todayStats = calculateStats(todayOrders);
    const weekStats = calculateStats(weekOrders);
    const monthStats = calculateStats(monthOrders);

    // Daily data for chart (last 7 days)
    const dailyData: DashboardStats["dailyData"] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = formatLocalDate(date);
      const dayOrders = monthOrders.filter((o) => o.date === dateStr);
      const dayStats = calculateStats(dayOrders);

      dailyData.push({
        date: dateStr,
        orders: dayStats.orders,
        amount: dayStats.amount,
        items: dayStats.items,
      });
    }

    // Top items for this user (this month)
    const itemMap = new Map<
      string,
      { name: string; quantity: number; amount: number }
    >();
    for (const order of monthOrders) {
      const existing = itemMap.get(order.menuItemId);
      if (existing) {
        existing.quantity += order.quantity;
        existing.amount += order.menuItemPrice * order.quantity;
      } else {
        itemMap.set(order.menuItemId, {
          name: order.menuItemName,
          quantity: order.quantity,
          amount: order.menuItemPrice * order.quantity,
        });
      }
    }
    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      today: todayStats,
      week: weekStats,
      month: monthStats,
      dailyData,
      topItems,
      topUsers: [], // Not relevant for user-specific stats
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return {
      today: { orders: 0, items: 0, amount: 0, users: 0, paidAmount: 0 },
      week: { orders: 0, items: 0, amount: 0, users: 0 },
      month: { orders: 0, items: 0, amount: 0, users: 0 },
      dailyData: [],
      topItems: [],
      topUsers: [],
    };
  }
}

// Get dashboard stats (admin - all users)
export async function getDashboardStats(): Promise<DashboardStats> {
  const today = formatLocalDate(new Date());

  // Get date ranges
  const weekRange = getDateRange("week");
  const monthRange = getDateRange("month");

  // Fetch all orders for the month (includes week and today)
  const monthOrders = await getOrdersInRange(monthRange.start, monthRange.end);

  // Filter for different periods
  const todayOrders = monthOrders.filter((o) => o.date === today);
  const weekOrders = monthOrders.filter((o) => o.date >= weekRange.start);

  // Calculate stats
  const todayStats = calculateStats(todayOrders);
  const weekStats = calculateStats(weekOrders);
  const monthStats = calculateStats(monthOrders);

  // Daily data for chart (last 7 days)
  const dailyData: DashboardStats["dailyData"] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = formatLocalDate(date);
    const dayOrders = monthOrders.filter((o) => o.date === dateStr);
    const dayStats = calculateStats(dayOrders);

    dailyData.push({
      date: dateStr,
      orders: dayStats.orders,
      amount: dayStats.amount,
      items: dayStats.items,
    });
  }

  // Top items (this month)
  const itemMap = new Map<
    string,
    { name: string; quantity: number; amount: number }
  >();
  for (const order of monthOrders) {
    const existing = itemMap.get(order.menuItemId);
    if (existing) {
      existing.quantity += order.quantity;
      existing.amount += order.menuItemPrice * order.quantity;
    } else {
      itemMap.set(order.menuItemId, {
        name: order.menuItemName,
        quantity: order.quantity,
        amount: order.menuItemPrice * order.quantity,
      });
    }
  }
  const topItems = Array.from(itemMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Top users (this month)
  const userMap = new Map<
    string,
    { name: string; orders: number; amount: number }
  >();
  for (const order of monthOrders) {
    const existing = userMap.get(order.userId);
    if (existing) {
      existing.orders += 1;
      existing.amount += order.menuItemPrice * order.quantity;
    } else {
      userMap.set(order.userId, {
        name: order.userName,
        orders: 1,
        amount: order.menuItemPrice * order.quantity,
      });
    }
  }
  const topUsers = Array.from(userMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    today: todayStats,
    week: weekStats,
    month: monthStats,
    dailyData,
    topItems,
    topUsers,
  };
}
