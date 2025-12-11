// Parser for MoMo payment notifications
// Hỗ trợ cả SMS và Notification từ app MoMo

export interface MoMoTransaction {
  amount: number;
  sender: string;
  content: string;
  balance?: number;
  timestamp: Date;
  paymentCode?: string; // Mã đơn hàng BCMxxxx
}

/**
 * Parse MoMo notification/SMS để lấy thông tin giao dịch
 *
 * Format notification từ SMS Forwarder (Zerogic):
 * - key: "Số tiền 2.000 ₫, kèm lời nhắn: \"BCM1234 TEN USER\"..."
 *
 * Format SMS MoMo:
 * - "Ban vua nhan 50,000d tu 0987654321. ND: BCM1234. SD: 1,500,000d"
 */
export function parseMoMoSMS(text: string): MoMoTransaction | null {
  try {
    // Try notification format first (from SMS Forwarder)
    const notificationResult = parseMoMoNotification(text);
    if (notificationResult) return notificationResult;

    // Fallback to SMS format
    return parseMoMoSMSFormat(text);
  } catch (error) {
    console.error("Error parsing MoMo message:", error);
    return null;
  }
}

/**
 * Parse MoMo notification format
 * Example: "Số tiền 2.000 ₫, kèm lời nhắn: \"DINH QUOC TU Chuyen tien\"."
 */
function parseMoMoNotification(text: string): MoMoTransaction | null {
  // Extract amount - "Số tiền 2.000 ₫" or "Số tiền 50.000 ₫"
  const amountMatch = text.match(/[Ss]ố tiền\s*(\d{1,3}(?:[.,]\d{3})*)\s*₫/);
  if (!amountMatch) return null;

  const amount = parseInt(amountMatch[1].replace(/[.,]/g, ""), 10);

  // Extract message content - kèm lời nhắn: "..."
  const messageMatch = text.match(/kèm lời nhắn:\s*["""]([^"""]+)["""]/i);
  const content = messageMatch ? messageMatch[1].trim() : "";

  // Extract payment code (BCMxxxx pattern)
  const paymentCode = extractPaymentCode(content) || extractPaymentCode(text);

  return {
    amount,
    sender: "MoMo",
    content,
    timestamp: new Date(),
    paymentCode: paymentCode || undefined,
  };
}

/**
 * Parse traditional SMS format from MoMo
 */
function parseMoMoSMSFormat(smsBody: string): MoMoTransaction | null {
  // Normalize text - remove diacritics for easier parsing
  const normalized = smsBody
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/đ/g, "d");

  // Check if this is a receive money SMS (not send)
  if (!normalized.includes("nhan") && !normalized.includes("+")) {
    return null;
  }

  // Extract amount - look for patterns like "50,000d", "50.000d", "+50,000d"
  const amountMatch = smsBody.match(/[+]?(\d{1,3}(?:[.,]\d{3})*)\s*d(?:ong)?/i);
  if (!amountMatch) return null;

  const amount = parseInt(amountMatch[1].replace(/[.,]/g, ""), 10);

  // Extract sender phone number
  const senderMatch = smsBody.match(/(?:tu|from)\s*(?:so\s*)?(\d{10,11})/i);
  const sender = senderMatch ? senderMatch[1] : "Unknown";

  // Extract content/description - look for ND:, Noi dung:, etc.
  const contentMatch = smsBody.match(/(?:nd|noi dung|n\.d)[:\s]+([^.]+)/i);
  const content = contentMatch ? contentMatch[1].trim() : "";

  // Extract balance if available
  const balanceMatch = smsBody.match(
    /(?:sd|so du|s\.d)[:\s]+(\d{1,3}(?:[.,]\d{3})*)\s*d/i
  );
  const balance = balanceMatch
    ? parseInt(balanceMatch[1].replace(/[.,]/g, ""), 10)
    : undefined;

  // Extract payment code (BCMxxxx pattern)
  const paymentCode =
    extractPaymentCode(content) || extractPaymentCode(smsBody);

  return {
    amount,
    sender,
    content,
    balance,
    timestamp: new Date(),
    paymentCode: paymentCode || undefined,
  };
}

/**
 * Validate if the transaction matches expected payment
 */
export function validatePayment(
  transaction: MoMoTransaction,
  expectedCode: string,
  expectedAmount: number
): { valid: boolean; reason?: string } {
  // Check payment code
  if (!transaction.paymentCode) {
    return {
      valid: false,
      reason: "Không tìm thấy mã đơn hàng trong nội dung",
    };
  }

  if (transaction.paymentCode !== expectedCode.toUpperCase()) {
    return { valid: false, reason: "Mã đơn hàng không khớp" };
  }

  // Check amount (allow 1% tolerance for rounding)
  const tolerance = expectedAmount * 0.01;
  if (Math.abs(transaction.amount - expectedAmount) > tolerance) {
    return {
      valid: false,
      reason: `Số tiền không khớp. Nhận: ${transaction.amount}, Cần: ${expectedAmount}`,
    };
  }

  return { valid: true };
}

/**
 * Extract payment code from any text
 */
export function extractPaymentCode(text: string): string | null {
  const match = text.match(/BCM[A-Z0-9]{8,}/i);
  return match ? match[0].toUpperCase() : null;
}
