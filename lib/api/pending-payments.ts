import { databases, DATABASE_ID, ID, Query } from "../appwrite";

// Collection để track pending payments
export const PENDING_PAYMENTS_COLLECTION = "pending_payments";

/*
Schema for pending_payments collection in Appwrite:
- $id: string (auto)
- paymentCode: string (unique, indexed) - Mã thanh toán BCMxxxx
- userId: string
- userName: string
- userEmail: string
- amount: number - Số tiền cần thanh toán (đơn vị: đồng)
- orderIds: string[] - Danh sách order IDs liên quan
- date: string - Ngày đặt hàng (YYYY-MM-DD)
- status: 'pending' | 'completed' | 'expired' | 'cancelled'
- createdAt: string
- paidAt: string (optional)
- paidAmount: number (optional)
- expiresAt: string - Thời gian hết hạn

Indexes to create:
1. paymentCode (unique)
2. userId + status
3. status + createdAt
*/

export interface PendingPayment {
  $id: string;
  paymentCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  orderIds: string[];
  date: string;
  status: "pending" | "completed" | "expired" | "cancelled";
  createdAt: string;
  paidAt?: string;
  paidAmount?: number;
  expiresAt: string;
}

export interface CreatePaymentInput {
  paymentCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  orderIds: string[];
  date: string;
}

/**
 * Tạo pending payment mới
 */
export async function createPendingPayment(
  input: CreatePaymentInput
): Promise<PendingPayment | null> {
  try {
    // Check if payment code already exists
    const existing = await databases.listDocuments(
      DATABASE_ID,
      PENDING_PAYMENTS_COLLECTION,
      [Query.equal("paymentCode", input.paymentCode)]
    );

    if (existing.documents.length > 0) {
      // Return existing if still pending
      const existingPayment = existing
        .documents[0] as unknown as PendingPayment;
      if (existingPayment.status === "pending") {
        return existingPayment;
      }
    }

    // Set expiry to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const doc = await databases.createDocument(
      DATABASE_ID,
      PENDING_PAYMENTS_COLLECTION,
      ID.unique(),
      {
        ...input,
        status: "pending",
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      }
    );

    return doc as unknown as PendingPayment;
  } catch (error) {
    console.error("Error creating pending payment:", error);
    return null;
  }
}

/**
 * Lấy pending payment theo code
 */
export async function getPendingPaymentByCode(
  paymentCode: string
): Promise<PendingPayment | null> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PENDING_PAYMENTS_COLLECTION,
      [
        Query.equal("paymentCode", paymentCode),
        Query.equal("status", "pending"),
      ]
    );

    if (response.documents.length > 0) {
      return response.documents[0] as unknown as PendingPayment;
    }
    return null;
  } catch (error) {
    console.error("Error fetching pending payment:", error);
    return null;
  }
}

/**
 * Lấy tất cả pending payments của user
 */
export async function getUserPendingPayments(
  userId: string
): Promise<PendingPayment[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PENDING_PAYMENTS_COLLECTION,
      [
        Query.equal("userId", userId),
        Query.equal("status", "pending"),
        Query.orderDesc("createdAt"),
      ]
    );

    return response.documents as unknown as PendingPayment[];
  } catch (error) {
    console.error("Error fetching user pending payments:", error);
    return [];
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: "completed" | "expired" | "cancelled",
  paidAmount?: number
): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = { status };

    if (status === "completed") {
      updateData.paidAt = new Date().toISOString();
      if (paidAmount !== undefined) {
        updateData.paidAmount = paidAmount;
      }
    }

    await databases.updateDocument(
      DATABASE_ID,
      PENDING_PAYMENTS_COLLECTION,
      paymentId,
      updateData
    );

    return true;
  } catch (error) {
    console.error("Error updating payment status:", error);
    return false;
  }
}

/**
 * Check payment status by code
 */
export async function checkPaymentStatus(
  paymentCode: string
): Promise<{ status: string; payment?: PendingPayment }> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PENDING_PAYMENTS_COLLECTION,
      [Query.equal("paymentCode", paymentCode)]
    );

    if (response.documents.length === 0) {
      return { status: "not_found" };
    }

    const payment = response.documents[0] as unknown as PendingPayment;
    return { status: payment.status, payment };
  } catch (error) {
    console.error("Error checking payment status:", error);
    return { status: "error" };
  }
}

/**
 * Cleanup expired payments
 */
export async function cleanupExpiredPayments(): Promise<number> {
  try {
    const now = new Date().toISOString();

    const response = await databases.listDocuments(
      DATABASE_ID,
      PENDING_PAYMENTS_COLLECTION,
      [
        Query.equal("status", "pending"),
        Query.lessThan("expiresAt", now),
        Query.limit(100),
      ]
    );

    let count = 0;
    for (const doc of response.documents) {
      await databases.updateDocument(
        DATABASE_ID,
        PENDING_PAYMENTS_COLLECTION,
        doc.$id,
        { status: "expired" }
      );
      count++;
    }

    return count;
  } catch (error) {
    console.error("Error cleaning up expired payments:", error);
    return 0;
  }
}
