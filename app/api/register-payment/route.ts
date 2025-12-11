import { NextRequest, NextResponse } from "next/server";
import {
  createPendingPayment,
  findExistingPendingPayment,
} from "@/lib/api/pending-payments";

/**
 * API để đăng ký pending payment khi user mở QR modal
 * Sẽ tái sử dụng payment đã tồn tại nếu chưa hết hạn
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

    const paymentDate = date || new Date().toISOString().split("T")[0];

    // Kiểm tra xem đã có pending payment chưa hết hạn không
    const existingPayment = await findExistingPendingPayment(
      userId,
      paymentDate,
      amount
    );

    if (existingPayment) {
      // Trả về payment đã tồn tại, client sẽ dùng paymentCode này
      return NextResponse.json({
        success: true,
        reused: true,
        payment: {
          id: existingPayment.$id,
          paymentCode: existingPayment.paymentCode,
          amount: existingPayment.amount,
          expiresAt: existingPayment.expiresAt,
        },
      });
    }

    // Tạo mới nếu chưa có
    const payment = await createPendingPayment({
      paymentCode,
      userId,
      userName: userName || "Unknown",
      userEmail: userEmail || "",
      amount,
      orderIds: orderIds || [],
      date: paymentDate,
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Failed to create pending payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reused: false,
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
