import { NextRequest, NextResponse } from "next/server";
import { getPayOSPaymentInfo } from "@/lib/payos";
import { serverDatabases, DATABASE_ID, Query } from "@/lib/appwrite-server";
import { PAYOS_PAYMENTS_COLLECTION } from "../create-payment/route";
import { DAILY_ORDERS_COLLECTION } from "@/lib/api/daily-orders";

/**
 * API kiểm tra trạng thái thanh toán PayOS
 * GET /api/payos/check-status?orderCode=123456
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderCode = searchParams.get("orderCode");

    if (!orderCode) {
      return NextResponse.json(
        { error: "orderCode is required" },
        { status: 400 },
      );
    }

    // Lấy thông tin từ PayOS API
    const payosInfo = await getPayOSPaymentInfo(parseInt(orderCode));

    if (payosInfo.code !== "00" || !payosInfo.data) {
      return NextResponse.json({
        success: false,
        error: payosInfo.desc || "Payment not found",
        status: "not_found",
      });
    }

    const { data } = payosInfo;

    // Nếu đã thanh toán, cập nhật database
    if (data.status === "PAID") {
      try {
        const payments = await serverDatabases.listDocuments(
          DATABASE_ID,
          PAYOS_PAYMENTS_COLLECTION,
          [Query.equal("orderCode", orderCode)],
        );

        if (payments.documents.length > 0) {
          const payment = payments.documents[0];

          // Chỉ update nếu chưa completed
          if (payment.status !== "completed") {
            await serverDatabases.updateDocument(
              DATABASE_ID,
              PAYOS_PAYMENTS_COLLECTION,
              payment.$id,
              {
                status: "completed",
                paidAt: new Date().toISOString(),
                paidAmount: data.amountPaid,
              },
            );

            // Cập nhật trạng thái isPaid cho các orders liên quan
            if (payment.orderIds && payment.orderIds.length > 0) {
              for (const orderId of payment.orderIds) {
                try {
                  await serverDatabases.updateDocument(
                    DATABASE_ID,
                    DAILY_ORDERS_COLLECTION,
                    orderId,
                    { isPaid: true },
                  );
                } catch (orderError) {
                  console.error(
                    `Failed to update order ${orderId}:`,
                    orderError,
                  );
                }
              }
            }
          }
        }
      } catch (dbError) {
        console.error("Failed to update payment status:", dbError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        orderCode: data.orderCode,
        amount: data.amount,
        amountPaid: data.amountPaid,
        amountRemaining: data.amountRemaining,
        status: data.status,
        isPaid: data.status === "PAID",
        createdAt: data.createdAt,
        transactions: data.transactions,
        cancellationReason: data.cancellationReason,
        canceledAt: data.canceledAt,
      },
    });
  } catch (error) {
    console.error("Check PayOS status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
