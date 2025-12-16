import crypto from "crypto";

// PayOS Configuration
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || "";
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || "";
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || "";

const PAYOS_API_URL = "https://api-merchant.payos.vn";

export interface PayOSPaymentRequest {
  orderCode: number;
  amount: number;
  description: string;
  cancelUrl: string;
  returnUrl: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  items?: PayOSItem[];
  expiredAt?: number; // Unix timestamp
}

export interface PayOSItem {
  name: string;
  quantity: number;
  price: number;
}

export interface PayOSPaymentResponse {
  code: string;
  desc: string;
  data: {
    bin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    orderCode: number;
    currency: string;
    paymentLinkId: string;
    status: string;
    checkoutUrl: string;
    qrCode: string;
  } | null;
  signature: string;
}

export interface PayOSWebhookData {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  counterAccountBankId: string;
  counterAccountBankName: string;
  counterAccountName: string;
  counterAccountNumber: string;
  virtualAccountName: string;
  virtualAccountNumber: string;
}

export interface PayOSPaymentInfo {
  code: string;
  desc: string;
  data: {
    id: string;
    orderCode: number;
    amount: number;
    amountPaid: number;
    amountRemaining: number;
    status: "PENDING" | "PAID" | "PROCESSING" | "CANCELLED" | "EXPIRED";
    createdAt: string;
    transactions: PayOSTransaction[];
    cancellationReason: string | null;
    canceledAt: string | null;
  } | null;
}

export interface PayOSTransaction {
  reference: string;
  amount: number;
  accountNumber: string;
  description: string;
  transactionDateTime: string;
  virtualAccountName: string;
  virtualAccountNumber: string;
  counterAccountBankId: string;
  counterAccountBankName: string;
  counterAccountName: string;
  counterAccountNumber: string;
}

/**
 * Tạo signature cho PayOS request
 */
function createSignature(data: Record<string, unknown>): string {
  // Sort keys alphabetically and create query string
  const sortedKeys = Object.keys(data).sort();
  const signData = sortedKeys.map((key) => `${key}=${data[key]}`).join("&");

  return crypto
    .createHmac("sha256", PAYOS_CHECKSUM_KEY)
    .update(signData)
    .digest("hex");
}

/**
 * Verify webhook signature từ PayOS
 */
export function verifyWebhookSignature(
  data: PayOSWebhookData,
  signature: string
): boolean {
  const signData = {
    orderCode: data.orderCode,
    amount: data.amount,
    description: data.description,
    accountNumber: data.accountNumber,
    reference: data.reference,
    transactionDateTime: data.transactionDateTime,
    currency: data.currency,
    paymentLinkId: data.paymentLinkId,
    code: data.code,
    desc: data.desc,
    counterAccountBankId: data.counterAccountBankId || "",
    counterAccountBankName: data.counterAccountBankName || "",
    counterAccountName: data.counterAccountName || "",
    counterAccountNumber: data.counterAccountNumber || "",
    virtualAccountName: data.virtualAccountName || "",
    virtualAccountNumber: data.virtualAccountNumber || "",
  };

  const calculatedSignature = createSignature(signData);
  return calculatedSignature === signature;
}

/**
 * Tạo payment link với PayOS
 */
export async function createPayOSPayment(
  request: PayOSPaymentRequest
): Promise<PayOSPaymentResponse> {
  const signatureData = {
    amount: request.amount,
    cancelUrl: request.cancelUrl,
    description: request.description,
    orderCode: request.orderCode,
    returnUrl: request.returnUrl,
  };

  const signature = createSignature(signatureData);

  const payload = {
    ...request,
    signature,
  };

  const response = await fetch(`${PAYOS_API_URL}/v2/payment-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": PAYOS_CLIENT_ID,
      "x-api-key": PAYOS_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  return result as PayOSPaymentResponse;
}

/**
 * Lấy thông tin payment từ PayOS
 */
export async function getPayOSPaymentInfo(
  orderCode: number
): Promise<PayOSPaymentInfo> {
  const response = await fetch(
    `${PAYOS_API_URL}/v2/payment-requests/${orderCode}`,
    {
      method: "GET",
      headers: {
        "x-client-id": PAYOS_CLIENT_ID,
        "x-api-key": PAYOS_API_KEY,
      },
    }
  );

  const result = await response.json();
  return result as PayOSPaymentInfo;
}

/**
 * Hủy payment link
 */
export async function cancelPayOSPayment(
  orderCode: number,
  cancellationReason?: string
): Promise<{ code: string; desc: string }> {
  const response = await fetch(
    `${PAYOS_API_URL}/v2/payment-requests/${orderCode}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": PAYOS_CLIENT_ID,
        "x-api-key": PAYOS_API_KEY,
      },
      body: JSON.stringify({
        cancellationReason: cancellationReason || "User cancelled",
      }),
    }
  );

  const result = await response.json();
  return result;
}

/**
 * Generate unique order code (số nguyên dương, tối đa 9007199254740991)
 * Format: timestamp cuối + random 4 số
 */
export function generateOrderCode(): number {
  const timestamp = Date.now() % 10000000000; // Lấy 10 số cuối của timestamp
  const random = Math.floor(1000 + Math.random() * 9000); // 4 số random
  return parseInt(`${timestamp}${random}`);
}
