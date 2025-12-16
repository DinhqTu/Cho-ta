import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, PayOSWebhookData } from "@/lib/payos";
import { serverDatabases, DATABASE_ID, Query } from "@/lib/appwrite-server";
import { PAYOS_PAYMENTS_COLLECTION } from "../create-payment/route";

interface WebhookBody {
  code: string;
  desc: string;
  success: boolean;
  data: PayOSWebhookData;
  signature: string;
}

/**
 * Webhook endpoint để nhận callback từ PayOS khi thanh toán thành công
 * POST /api/payos/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body: WebhookBody = await request.json();

    console.log("PayOS Webhook received:", JSON.stringify(body, null, 2));

    // Verify signature
    if (!verifyWebhookSignature(body.data, body.signature)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { data } = body;

    // Tìm payment trong database
    const payments = await serverDatabases.listDocuments(
      DATABASE_ID,
      PAYOS_PAYMENTS_COLLECTION,
      [Query.equal("orderCode", data.orderCode.toString())]
    );

    if (payments.documents.length === 0) {
      console.error("Payment not found for orderCode:", data.orderCode);
      // Return success anyway to acknowledge webhook
      return NextResponse.json({ success: true });
    }

    const payment = payments.documents[0];

    // Update payment status
    if (body.success && data.code === "00") {
      await serverDatabases.updateDocument(
        DATABASE_ID,
        PAYOS_PAYMENTS_COLLECTION,
        payment.$id,
        {
          status: "completed",
          paidAt: new Date().toISOString(),
          paidAmount: data.amount,
          transactionReference: data.reference,
          counterAccountName: data.counterAccountName || "",
          counterAccountNumber: data.counterAccountNumber || "",
          counterAccountBankName: data.counterAccountBankName || "",
        }
      );

      console.log(`Payment ${data.orderCode} completed successfully`);

      // TODO: Thêm logic xử lý sau khi thanh toán thành công
      // Ví dụ: cập nhật trạng thái đơn hàng, gửi notification, etc.
    } else {
      // Payment failed or cancelled
      await serverDatabases.updateDocument(
        DATABASE_ID,
        PAYOS_PAYMENTS_COLLECTION,
        payment.$id,
        {
          status: "failed",
          failedAt: new Date().toISOString(),
          failReason: data.desc || body.desc,
        }
      );

      console.log(`Payment ${data.orderCode} failed: ${data.desc}`);
    }

    // Return success to acknowledge webhook
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PayOS webhook error:", error);
    // Return success anyway to prevent PayOS from retrying
    return NextResponse.json({ success: true });
  }
}

// PayOS cũng có thể gọi GET để verify endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "PayOS webhook endpoint is active",
  });
}
