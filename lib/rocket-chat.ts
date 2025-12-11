// Rocket Chat webhook integration for payment reminders

const ROCKET_CHAT_WEBHOOK_URL =
  "https://vchat.syncbim.com/hooks/693a845e4326ada38f1880b2/cxZwnn77C2cFFRZWZxAs3YXzHkS47DoFjzDbBK4PATHNp7ap";

export interface RocketChatAttachment {
  title?: string;
  title_link?: string;
  text?: string;
  image_url?: string;
  color?: string;
}

export interface RocketChatMessage {
  text: string;
  attachments?: RocketChatAttachment[];
}

export async function sendRocketChatMessage(
  message: RocketChatMessage
): Promise<boolean> {
  try {
    const response = await fetch(ROCKET_CHAT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error("Failed to send Rocket Chat message:", response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending Rocket Chat message:", error);
    return false;
  }
}

export interface UnpaidUserInfo {
  userName: string;
  userEmail: string;
  totalAmount: number;
  orderCount: number;
  dates: string[];
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export async function sendPaymentReminder(
  users: UnpaidUserInfo[]
): Promise<boolean> {
  if (users.length === 0) return true;

  const totalAmount = users.reduce((sum, u) => sum + u.totalAmount, 0);

  // Build user list text
  const userLines = users
    .map(
      (u, i) =>
        `${i + 1}. *${u.userName}* - ${formatMoney(u.totalAmount)} (${
          u.orderCount
        } đơn)`
    )
    .join("\n");

  const message: RocketChatMessage = {
    text: `🔔 *Nhắc nhở thanh toán đơn hàng*`,
    attachments: [
      {
        title: "Danh sách người dùng chưa thanh toán",
        text: userLines,
        color: "#D4AF37",
      },
      {
        text: `💰 *Tổng cộng:* ${formatMoney(
          totalAmount
        )}\n📅 Vui lòng thanh toán sớm nhất có thể!`,
        color: "#FF6B6B",
      },
    ],
  };

  return sendRocketChatMessage(message);
}

export async function sendIndividualPaymentReminder(
  user: UnpaidUserInfo
): Promise<boolean> {
  const dateList = user.dates
    .map((d) => {
      const date = new Date(d);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    })
    .join(", ");

  const message: RocketChatMessage = {
    text: `🔔 *Nhắc nhở thanh toán*`,
    attachments: [
      {
        title: `Xin chào ${user.userName}!`,
        text: `Bạn có *${
          user.orderCount
        } đơn hàng* chưa thanh toán.\n📅 Ngày: ${dateList}\n💰 Tổng tiền: *${formatMoney(
          user.totalAmount
        )}*`,
        color: "#D4AF37",
      },
      {
        text: `Vui lòng thanh toán qua QR code trong ứng dụng. Cảm ơn bạn! 🙏`,
        color: "#4ECDC4",
      },
    ],
  };

  return sendRocketChatMessage(message);
}

export interface PaymentSuccessInfo {
  userName: string;
  userEmail: string;
  amount: number;
  orderCount: number;
  paymentCode: string;
}

export async function sendPaymentSuccessNotification(
  payment: PaymentSuccessInfo
): Promise<boolean> {
  const message: RocketChatMessage = {
    text: `✅ *Thanh toán thành công*`,
    attachments: [
      {
        title: `${payment.userName} đã thanh toán`,
        text: `💰 Số tiền: *${formatMoney(payment.amount)}*\n📦 Số đơn: ${
          payment.orderCount
        }\n🔖 Mã: ${payment.paymentCode}`,
        color: "#4ECDC4",
      },
    ],
  };

  return sendRocketChatMessage(message);
}
