import { NextRequest, NextResponse } from "next/server";
import { serverDatabases, DATABASE_ID, Query } from "@/lib/appwrite-server";
import { DAILY_ORDERS_COLLECTION, DailyOrderDoc } from "@/lib/api/daily-orders";
import {
  sendPaymentReminder,
  sendIndividualPaymentReminder,
  UnpaidUserInfo,
} from "@/lib/vchat";
import { MenuItemDoc } from "@/lib/api/menu";

// Get all unpaid orders grouped by user
async function getUnpaidOrdersByUser(): Promise<UnpaidUserInfo[]> {
  try {
    const response = await serverDatabases.listDocuments(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      [Query.equal("isPaid", false), Query.limit(500)],
    );

    const orders = response.documents as unknown as DailyOrderDoc[];

    // Group by user
    const userMap = new Map<
      string,
      {
        userName: string;
        userEmail: string;
        totalAmount: number;
        orderCount: number;
        dates: Set<string>;
      }
    >();

    for (const order of orders) {
      const existing = userMap.get(order.userId);
      const amount = (order.menuItemId as MenuItemDoc).price * order.quantity;

      if (existing) {
        existing.totalAmount += amount;
        existing.orderCount += 1;
        existing.dates.add(order.date);
      } else {
        userMap.set(order.userId, {
          userName: order.userName,
          userEmail: order.userEmail,
          totalAmount: amount,
          orderCount: 1,
          dates: new Set([order.date]),
        });
      }
    }

    return Array.from(userMap.values()).map((u) => ({
      ...u,
      dates: Array.from(u.dates).sort().reverse(),
    }));
  } catch (error) {
    console.error("Error fetching unpaid orders:", error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, sendToAll } = body;

    const unpaidUsers = await getUnpaidOrdersByUser();

    if (unpaidUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Không có đơn hàng chưa thanh toán",
      });
    }

    let success = false;

    if (sendToAll) {
      // Send summary message with all unpaid users
      success = await sendPaymentReminder(unpaidUsers);
    } else if (userId) {
      // Send reminder to specific user
      const user = unpaidUsers.find((u) => u.userEmail === userId);
      if (user) {
        success = await sendIndividualPaymentReminder(user);
      } else {
        return NextResponse.json(
          { success: false, message: "User không có đơn chưa thanh toán" },
          { status: 404 },
        );
      }
    } else {
      // Default: send summary to channel
      success = await sendPaymentReminder(unpaidUsers);
    }

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Đã gửi thông báo nhắc thanh toán",
        usersNotified: sendToAll || !userId ? unpaidUsers.length : 1,
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Không thể gửi thông báo" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in send-payment-reminder:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET endpoint to check unpaid orders without sending
export async function GET() {
  try {
    const unpaidUsers = await getUnpaidOrdersByUser();
    const totalAmount = unpaidUsers.reduce((sum, u) => sum + u.totalAmount, 0);

    return NextResponse.json({
      success: true,
      totalUsers: unpaidUsers.length,
      totalAmount,
      users: unpaidUsers,
    });
  } catch (error) {
    console.error("Error fetching unpaid summary:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
