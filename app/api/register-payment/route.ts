import { NextRequest, NextResponse } from "next/server";
import { createPendingPayment } from "@/lib/api/pending-payments";

/**
 * API để đăng ký pending payment khi user mở QR modal
 * POST /api/register-payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { paymentCode, userId, userName, userEmail, amount, orderIds, date } =
      body;

    if (!paymentCode || !userId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const payment = await createPendingPayment({
      paymentCode,
      userId,
      userName: userName || "Unknown",
      userEmail: userEmail || "",
      amount,
      orderIds: orderIds || [],
      date: date || new Date().toISOString().split("T")[0],
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Failed to create pending payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.$id,
        paymentCode: payment.paymentCode,
        amount: payment.amount,
        expiresAt: payment.expiresAt,
      },
    });
  } catch (error) {
    console.error("Register payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
