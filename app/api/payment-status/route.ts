import { NextRequest, NextResponse } from "next/server";
import { checkPaymentStatus } from "@/lib/api/pending-payments";

/**
 * API để client polling check trạng thái thanh toán
 * GET /api/payment-status?code=BCMxxxx
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const paymentCode = searchParams.get("code");

  if (!paymentCode) {
    return NextResponse.json(
      { error: "Payment code is required" },
      { status: 400 }
    );
  }

  const result = await checkPaymentStatus(paymentCode);

  return NextResponse.json({
    code: paymentCode,
    status: result.status,
    isPaid: result.status === "completed",
    payment: result.payment
      ? {
          amount: result.payment.amount,
          paidAmount: result.payment.paidAmount,
          paidAt: result.payment.paidAt,
        }
      : null,
  });
}
