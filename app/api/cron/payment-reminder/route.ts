import { NextRequest, NextResponse } from "next/server";
import { serverDatabases, DATABASE_ID, Query } from "@/lib/appwrite-server";
import {
  DAILY_ORDERS_COLLECTION,
  DailyOrderDoc,
  getTodayDate,
} from "@/lib/api/daily-orders";
import { sendPaymentReminder, UnpaidUserInfo } from "@/lib/vchat";
import { MenuItemDoc } from "@/lib/api/menu";

// Secret key để bảo vệ cron endpoint
const CRON_SECRET = process.env.CRONJOB_SECRET || "your-cron-secret-key";

// Chỉ gửi reminder trong khoảng thời gian này (14:00 - 18:00)
const REMINDER_START_HOUR = 14;
const REMINDER_END_HOUR = 18;

function isWithinReminderTime(): boolean {
  const now = new Date();
  // Chuyển sang timezone Vietnam (UTC+7)
  const vietnamHour = (now.getUTCHours() + 7) % 24;
  return vietnamHour >= REMINDER_START_HOUR && vietnamHour < REMINDER_END_HOUR;
}

// Lấy danh sách user chưa thanh toán hôm nay
async function getTodayUnpaidUsers(): Promise<UnpaidUserInfo[]> {
  try {
    const today = getTodayDate();

    const response = await serverDatabases.listDocuments(
      DATABASE_ID,
      DAILY_ORDERS_COLLECTION,
      [
        Query.equal("date", today),
        Query.equal("isPaid", false),
        Query.limit(500),
      ],
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
      dates: Array.from(u.dates),
    }));
  } catch (error) {
    console.error("Error fetching unpaid users:", error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  // Verify cron secret từ header hoặc query param
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const secretParam = searchParams.get("secret");

  const providedSecret = authHeader?.replace("Bearer ", "") || secretParam;

  if (providedSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Kiểm tra có trong khung giờ gửi reminder không
  if (!isWithinReminderTime()) {
    return NextResponse.json({
      success: true,
      message: "Outside reminder hours (14:00-18:00 Vietnam time)",
      sent: false,
    });
  }

  try {
    const unpaidUsers = await getTodayUnpaidUsers();

    if (unpaidUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No unpaid orders today",
        sent: false,
      });
    }

    const sent = await sendPaymentReminder(unpaidUsers);

    return NextResponse.json({
      success: true,
      message: sent ? "Payment reminder sent" : "Failed to send reminder",
      sent,
      usersCount: unpaidUsers.length,
      totalAmount: unpaidUsers.reduce((sum, u) => sum + u.totalAmount, 0),
    });
  } catch (error) {
    console.error("Cron payment reminder error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST cũng được hỗ trợ cho một số cron services
export async function POST(request: NextRequest) {
  return GET(request);
}
