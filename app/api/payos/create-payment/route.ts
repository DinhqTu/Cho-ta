import { NextRequest, NextResponse } from "next/server";
import { createPayOSPayment, generateOrderCode, PayOSItem } from "@/lib/payos";
import { serverDatabases, DATABASE_ID, ID, Query } from "@/lib/appwrite-server";

// Collection để lưu PayOS payments
export const PAYOS_PAYMENTS_COLLECTION = "payos_payments";

export interface CreatePaymentBody {
  amount: number; // Số tiền (đơn vị: đồng)
  description: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  orderIds?: string[];
  items?: PayOSItem[];
}

/**
 * Tìm pending payment đã tồn tại và chưa hết hạn
 */
async function findExistingPayOSPayment(userId: string, amount: number) {
  try {
    const now = new Date().toISOString();
    const response = await serverDatabases.listDocuments(
      DATABASE_ID,
      PAYOS_PAYMENTS_COLLECTION,
      [
        Query.equal("userId", userId),
        Query.equal("amount", amount),
        Query.equal("status", "pending"),
        Query.greaterThan("expiresAt", now),
        Query.orderDesc("$createdAt"),
        Query.limit(1),
      ]
    );

    if (response.documents.length > 0) {
      return response.documents[0];
    }
    return null;
  } catch (error) {
    console.error("Error finding existing PayOS payment:", error);
    return null;
  }
}

/**
 * API tạo payment link PayOS
 * POST /api/payos/create-payment
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentBody = await request.json();
    const {
      amount,
      description,
      userId,
      userName,
      userEmail,
      orderIds,
      items,
    } = body;

    if (!amount || !description || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: amount, description, userId" },
        { status: 400 }
      );
    }

    if (amount < 2000) {
      return NextResponse.json(
        { error: "Minimum amount is 2000 VND" },
        { status: 400 }
      );
    }

    // Kiểm tra xem đã có pending payment chưa hết hạn không
    const existingPayment = await findExistingPayOSPayment(userId, amount);

    if (existingPayment) {
      // Tạo VietQR URL với description từ PayOS (đã chứa mã đơn hàng)
      const vietQRUrl = `https://img.vietqr.io/image/${existingPayment.bin}-${
        existingPayment.accountNumber
      }-compact2.png?amount=${
        existingPayment.amount
      }&addInfo=${encodeURIComponent(
        existingPayment.description
      )}&accountName=${encodeURIComponent(existingPayment.accountName)}`;

      return NextResponse.json({
        success: true,
        reused: true,
        data: {
          orderCode: parseInt(existingPayment.orderCode),
          amount: existingPayment.amount,
          qrCode: vietQRUrl,
          checkoutUrl: existingPayment.checkoutUrl,
          accountNumber: existingPayment.accountNumber,
          accountName: existingPayment.accountName,
          bin: existingPayment.bin,
          description: existingPayment.description,
          expiresAt: existingPayment.expiresAt,
        },
      });
    }

    // Generate unique order code
    const orderCode = generateOrderCode();

    // Get base URL for callbacks
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";

    // Set expiry to 15 minutes from now
    const expiredAt = Math.floor(Date.now() / 1000) + 15 * 60;

    // Tạo description có chứa orderCode để PayOS có thể xác định giao dịch
    // PayOS yêu cầu description không quá 25 ký tự và chỉ chứa a-zA-Z0-9 và khoảng trắng
    const payosDescription = `DH${orderCode}`;

    // Create PayOS payment
    const payosResponse = await createPayOSPayment({
      orderCode,
      amount,
      description,
      cancelUrl: `${baseUrl}/order?payment=cancelled`,
      returnUrl: `${baseUrl}/order?payment=success&orderCode=${orderCode}`,
      buyerName: userName,
      buyerEmail: userEmail,
      items,
      expiredAt,
    });

    if (payosResponse.code !== "00" || !payosResponse.data) {
      console.error("PayOS error:", payosResponse);
      return NextResponse.json(
        { error: payosResponse.desc || "Failed to create payment" },
        { status: 500 }
      );
    }

    // Save payment info to database
    try {
      await serverDatabases.createDocument(
        DATABASE_ID,
        PAYOS_PAYMENTS_COLLECTION,
        ID.unique(),
        {
          orderCode: orderCode.toString(),
          paymentLinkId: payosResponse.data.paymentLinkId,
          userId,
          userName: userName || "",
          userEmail: userEmail || "",
          amount,
          description: payosResponse.data.description, // Lưu description từ PayOS (đã có orderCode)
          orderIds: orderIds || [],
          status: "pending",
          qrCode: payosResponse.data.qrCode,
          checkoutUrl: payosResponse.data.checkoutUrl,
          accountNumber: payosResponse.data.accountNumber,
          accountName: payosResponse.data.accountName,
          bin: payosResponse.data.bin,
          expiresAt: new Date(expiredAt * 1000).toISOString(),
        }
      );
    } catch (dbError) {
      console.error("Failed to save payment to database:", dbError);
      // Continue anyway - payment was created successfully
    }

    // Tạo VietQR URL với description từ PayOS (đã chứa mã đơn hàng)
    const vietQRUrl = `https://img.vietqr.io/image/${payosResponse.data.bin}-${
      payosResponse.data.accountNumber
    }-compact2.png?amount=${
      payosResponse.data.amount
    }&addInfo=${encodeURIComponent(
      payosResponse.data.description
    )}&accountName=${encodeURIComponent(payosResponse.data.accountName)}`;

    return NextResponse.json({
      success: true,
      data: {
        orderCode,
        amount: payosResponse.data.amount,
        qrCode: vietQRUrl,
        checkoutUrl: payosResponse.data.checkoutUrl,
        accountNumber: payosResponse.data.accountNumber,
        accountName: payosResponse.data.accountName,
        bin: payosResponse.data.bin,
        description: payosResponse.data.description,
        expiresAt: new Date(expiredAt * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error("Create PayOS payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
