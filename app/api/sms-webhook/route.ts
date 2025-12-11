import { NextResponse } from "next/server";
import { parseMoMoSMS, extractPaymentCode } from "@/lib/sms-parser";
import { databases, DATABASE_ID, Query } from "@/lib/appwrite";
import { DAILY_ORDERS_COLLECTION } from "@/lib/api/daily-orders";

interface SMSForwarderPayload {
  // Format từ SMS Forwarder app (Zerogic) - Notification
  sender?: string; // "MoMo"
  time?: string; // "9:51 SA 11-12"
  key?: string; // Nội dung notification: "Số tiền 2.000 ₫, kèm lời nhắn: \"...\""
  // Format SMS truyền thống
  from?: string;
  text?: string;
  message?: string;
  sentStamp?: number;
  receivedStamp?: number;
  sim?: string;
}

export async function POST(request: Request) {
  try {
    const body: SMSForwarderPayload = await request.json();

    console.log("=== SMS Webhook ===");
    console.log("Body:", JSON.stringify(body, null, 2));

    // Extract content - ưu tiên key (notification) > text > message
    const content = body.key || body.text || body.message || "";
    const sender = body.sender || body.from || "";

    console.log("Received:", { sender, content: content.substring(0, 100) });

    // Check if from MoMo
    const isMoMo =
      sender.toLowerCase().includes("momo") ||
      content.toLowerCase().includes("momo") ||
      content.includes("₫") || // Notification format có ký hiệu ₫
      /^(9029|MoMo)/.test(sender);

    if (!isMoMo) {
      console.log("Not a MoMo notification, ignored");
      return NextResponse.json({
        success: true,
        message: "Not a MoMo notification, ignored",
      });
    }

    // Parse MoMo notification/SMS
    const transaction = parseMoMoSMS(content);

    if (!transaction) {
      console.log("Could not parse MoMo content:", content);
      return NextResponse.json({
        success: true,
        message: "Could not parse content",
      });
    }

    console.log("Parsed transaction:", {
      amount: transaction.amount,
      content: transaction.content,
      paymentCode: transaction.paymentCode,
    });

    // Extract payment code
    const paymentCode = transaction.paymentCode || extractPaymentCode(content);

    if (!paymentCode) {
      console.log("No payment code found in SMS");
      return NextResponse.json({
        success: true,
        message: "No payment code found",
        transaction,
      });
    }

    // Find matching unpaid orders by payment code pattern
    // Payment code format: BCM{userId4chars}{date4chars}{random4digits}
    // We need to search in order notes or a separate payment tracking collection

    const result = await processPayment(paymentCode, transaction.amount);

    return NextResponse.json({
      success: true,
      message: result.message,
      transaction,
      ordersUpdated: result.ordersUpdated,
    });
  } catch (error) {
    console.error("SMS Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint để test webhook (không cần auth)
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "SMS Webhook is running. Use POST to send SMS data.",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Process payment and update order status
 */
async function processPayment(
  paymentCode: string,
  amount: number
): Promise<{ message: string; ordersUpdated: number }> {
  try {
    // Tìm pending payments với mã này
    const pendingPayments = await databases.listDocuments(
      DATABASE_ID,
      "pending_payments",
      [
        Query.equal("paymentCode", paymentCode),
        Query.equal("status", "pending"),
      ]
    );

    if (pendingPayments.documents.length === 0) {
      return {
        message: "No pending payment found for this code",
        ordersUpdated: 0,
      };
    }

    const payment = pendingPayments.documents[0];
    const expectedAmount = payment.amount as number;

    // Verify amount (allow small tolerance)
    const tolerance = expectedAmount * 0.01;
    if (Math.abs(amount - expectedAmount) > tolerance) {
      // Log mismatch but still process if code matches
      console.warn(
        `Amount mismatch: expected ${expectedAmount}, got ${amount}`
      );
    }

    // Update payment status
    await databases.updateDocument(
      DATABASE_ID,
      "pending_payments",
      payment.$id,
      {
        status: "completed",
        paidAmount: amount,
        paidAt: new Date().toISOString(),
      }
    );

    // Update all related orders to paid
    const orderIds = (payment.orderIds as string[]) || [];
    let updatedCount = 0;

    for (const orderId of orderIds) {
      try {
        await databases.updateDocument(
          DATABASE_ID,
          DAILY_ORDERS_COLLECTION,
          orderId,
          { isPaid: true }
        );
        updatedCount++;
      } catch (err) {
        console.error(`Failed to update order ${orderId}:`, err);
      }
    }

    return {
      message: `Payment verified. Updated ${updatedCount} orders.`,
      ordersUpdated: updatedCount,
    };
  } catch (error) {
    console.error("Error processing payment:", error);
    return { message: "Error processing payment", ordersUpdated: 0 };
  }
}
