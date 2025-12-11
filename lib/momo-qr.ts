// MoMo QR Code Generator
// Tạo QR code động với số tiền và nội dung chuyển khoản tùy chỉnh

export interface MoMoQRConfig {
  phoneNumber: string; // Số điện thoại MoMo nhận tiền
  accountName: string; // Tên tài khoản MoMo
}

export interface MoMoPaymentInfo {
  amount: number; // Số tiền (đơn vị: nghìn đồng, VD: 50 = 50.000đ)
  comment: string; // Nội dung chuyển khoản
}

// Cấu hình MoMo mặc định - có thể override từ env
const DEFAULT_MOMO_CONFIG: MoMoQRConfig = {
  phoneNumber: process.env.NEXT_PUBLIC_MOMO_PHONE || "0123456789",
  accountName: process.env.NEXT_PUBLIC_MOMO_NAME || "BAT COM MAN",
};

/**
 * Tạo MoMo Deep Link để mở app MoMo trực tiếp
 * Format chuẩn của MoMo
 */
export function generateMoMoDeepLink(
  payment: MoMoPaymentInfo,
  config: MoMoQRConfig = DEFAULT_MOMO_CONFIG
): string {
  const actualAmount = payment.amount * 1000;
  const encodedComment = encodeURIComponent(payment.comment);

  // MoMo Deep Link format - chuyển tiền đến số điện thoại
  return `2|99|${config.phoneNumber}|||0|0|${actualAmount}|${payment.comment}|transfer_myqr`;
}

/**
 * Tạo URL QR code từ MoMo payment string
 * Sử dụng QR Server API để generate QR từ data string
 */
export function generateMoMoQRUrl(
  payment: MoMoPaymentInfo,
  config: MoMoQRConfig = DEFAULT_MOMO_CONFIG
): string {
  const actualAmount = payment.amount * 1000;

  // MoMo QR format: 2|99|phone|||0|0|amount|message|transfer_myqr
  const momoQRData = `2|99|${config.phoneNumber}|||0|0|${actualAmount}|${payment.comment}|transfer_myqr`;

  // Sử dụng QR Server API để tạo QR code
  const encodedData = encodeURIComponent(momoQRData);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}`;
}

/**
 * Tạo URL mở app MoMo trực tiếp (cho mobile)
 */
export function generateMoMoAppLink(
  payment: MoMoPaymentInfo,
  config: MoMoQRConfig = DEFAULT_MOMO_CONFIG
): string {
  const actualAmount = payment.amount * 1000;
  const encodedComment = encodeURIComponent(payment.comment);

  // MoMo app scheme
  return `momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=${config.phoneNumber}&v=3.0&amount=${actualAmount}&comment=${encodedComment}`;
}

/**
 * Tạo mã thanh toán unique để tracking
 * Format: BCM-{userId cuối 4 ký tự}-{ngày}-{random 4 số}
 */
export function generatePaymentCode(userId: string, date: string): string {
  const userShort = userId.slice(-4).toUpperCase();
  const dateShort = date.replace(/-/g, "").slice(-4); // MMDD
  const random = Math.floor(1000 + Math.random() * 9000); // 4 số random

  return `BCM${userShort}${dateShort}${random}`;
}

/**
 * Tạo nội dung chuyển khoản chuẩn
 */
export function generatePaymentComment(
  userName: string,
  date: string,
  paymentCode: string
): string {
  // Format ngày đẹp hơn
  const dateObj = new Date(date);
  const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

  return `${paymentCode} ${userName} ${formattedDate}`;
}

/**
 * Lấy cấu hình MoMo từ environment
 */
export function getMoMoConfig(): MoMoQRConfig {
  return {
    phoneNumber:
      process.env.NEXT_PUBLIC_MOMO_PHONE || DEFAULT_MOMO_CONFIG.phoneNumber,
    accountName:
      process.env.NEXT_PUBLIC_MOMO_NAME || DEFAULT_MOMO_CONFIG.accountName,
  };
}
