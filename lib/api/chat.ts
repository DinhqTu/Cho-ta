import {
  databases,
  DATABASE_ID,
  ID,
  Query,
  client,
  storage,
  CHAT_BUCKET_ID,
} from "../appwrite";
import { User } from "../auth";

export const CHAT_COLLECTION = "chat_messages";

// Upload image to Appwrite Storage
export async function uploadChatImage(file: File): Promise<string | null> {
  try {
    const response = await storage.createFile(
      CHAT_BUCKET_ID,
      ID.unique(),
      file
    );
    // Get the file URL
    const fileUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${CHAT_BUCKET_ID}/files/${response.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
    return fileUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
}

export interface ChatMessage {
  $id: string;
  $createdAt: string;
  userId: string;
  userName: string;
  message: string;
  imageUrl?: string;
  messageType: "text" | "image" | "gif";
  date: string;
}

// Get today's date (local timezone)
function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Send a chat message
export async function sendMessage(
  user: User,
  message: string,
  messageType: "text" | "image" | "gif" = "text",
  imageUrl?: string
): Promise<ChatMessage | null> {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      CHAT_COLLECTION,
      ID.unique(),
      {
        userId: user.$id,
        userName: user.name || "Anonymous",
        message: message.trim(),
        messageType,
        imageUrl: imageUrl || "",
        date: getTodayDate(),
      }
    );
    return doc as unknown as ChatMessage;
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
}

// Get messages for today
export async function getTodayMessages(): Promise<ChatMessage[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      CHAT_COLLECTION,
      [
        Query.equal("date", getTodayDate()),
        Query.orderAsc("$createdAt"),
        Query.limit(100),
      ]
    );
    return response.documents as unknown as ChatMessage[];
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}

// Subscribe to new messages (realtime)
export function subscribeToMessages(
  callback: (message: ChatMessage) => void
): () => void {
  const channel = `databases.${DATABASE_ID}.collections.${CHAT_COLLECTION}.documents`;

  const unsubscribe = client.subscribe(channel, (response) => {
    if (
      response.events.includes(
        `databases.${DATABASE_ID}.collections.${CHAT_COLLECTION}.documents.*.create`
      )
    ) {
      callback(response.payload as unknown as ChatMessage);
    }
  });

  return unsubscribe;
}

// Delete a message (only own messages)
export async function deleteMessage(messageId: string): Promise<boolean> {
  try {
    await databases.deleteDocument(DATABASE_ID, CHAT_COLLECTION, messageId);
    return true;
  } catch (error) {
    console.error("Error deleting message:", error);
    return false;
  }
}
