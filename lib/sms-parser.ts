// SMS Parser for MoMo payment notifications
// Parse SMS từ MoMo để extract thông tin giao dịch

export interface MoMoTransaction {
  amount: number;
  sender: string;
  content: string;
  balance?: number;
  timestamp: Date;
  paymentCode?: string; // Mã đơn hàng BCMxxxx
}

/**
 * Parse SMS từ MoMo để lấy thông tin giao dịch
 *
 * Các format SMS MoMo phổ biến:
 * 1. "Ban vua nhan 50,000d tu 0987654321. ND: BCM1234 TEN USER. SD: 1,500,000d"
 * 2. "Ban da nhan 50.000d tu so 0987654321. Noi dung: BCM1234. So du: 1.500.000d"
 * 3. "MOMO: +50,000d tu 0987654321 luc 10:30 05/12. ND: BCM1234. SD: 1,500,000d"
 */
export function parseMoMoSMS(smsBody: string): MoMoTransaction | null {
  try {
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
    const amountMatch = smsBody.match(
      /[+]?(\d{1,3}(?:[.,]\d{3})*)\s*d(?:ong)?/i
    );
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
    const paymentCodeMatch =
      content.match(/BCM[A-Z0-9]{8,}/i) || smsBody.match(/BCM[A-Z0-9]{8,}/i);
    const paymentCode = paymentCodeMatch
      ? paymentCodeMatch[0].toUpperCase()
      : undefined;

    return {
      amount,
      sender,
      content,
      balance,
      timestamp: new Date(),
      paymentCode,
    };
  } catch (error) {
    console.error("Error parsing MoMo SMS:", error);
    return null;
  }
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
