import { NextRequest, NextResponse } from "next/server";
import { parseMoMoSMS, extractPaymentCode } from "@/lib/sms-parser";
import { databases, DATABASE_ID, Query } from "@/lib/appwrite";
import { DAILY_ORDERS_COLLECTION } from "@/lib/api/daily-orders";

// Secret key để bảo vệ webhook (set trong SMS Forwarder)
const WEBHOOK_SECRET = process.env.SMS_WEBHOOK_SECRET || "your-secret-key-here";

// Collection để lưu log giao dịch
const PAYMENT_LOGS_COLLECTION = "payment_logs";

interface SMSForwarderPayload {
  // Format từ SMS Forwarder app
  from?: string;
  text?: string;
  sentStamp?: number;
  receivedStamp?: number;
  sim?: string;
  // Alternative format
  sender?: string;
  message?: string;
  timestamp?: string;
  // Secret for authentication
  secret?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SMSForwarderPayload = await request.json();

    // Verify secret
    const authHeader = request.headers.get("Authorization");
    const secretFromHeader = authHeader?.replace("Bearer ", "");
    const secretFromBody = body.secret;

    if (
      secretFromHeader !== WEBHOOK_SECRET &&
      secretFromBody !== WEBHOOK_SECRET
    ) {
      console.log("Unauthorized webhook attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract SMS content
    const smsBody = body.text || body.message || "";
    const smsSender = body.from || body.sender || "";

    console.log("Received SMS:", { from: smsSender, text: smsBody });

    // Check if SMS is from MoMo
    const isMoMoSMS =
      smsSender.includes("MoMo") ||
      smsSender.includes("MOMO") ||
      smsBody.toLowerCase().includes("momo") ||
      /^(9029|MoMo)/.test(smsSender);

    if (!isMoMoSMS) {
      return NextResponse.json({
        success: true,
        message: "Not a MoMo SMS, ignored",
      });
    }

    // Parse MoMo SMS
    const transaction = parseMoMoSMS(smsBody);

    if (!transaction) {
      console.log("Could not parse MoMo SMS:", smsBody);
      return NextResponse.json({
        success: true,
        message: "Could not parse SMS content",
      });
    }

    console.log("Parsed transaction:", transaction);

    // Extract payment code
    const paymentCode = transaction.paymentCode || extractPaymentCode(smsBody);

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

// GET endpoint để test webhook
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const secret = authHeader?.replace("Bearer ", "");

  if (secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    status: "ok",
    message: "SMS Webhook is running",
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
