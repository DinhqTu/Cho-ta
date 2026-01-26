import { databases, DATABASE_ID, ID, Query, COLLECTIONS } from "../appwrite";
import { User } from "../auth";

// Collection ID for restaurants
export const RESTAURANTS_COLLECTION = COLLECTIONS.RESTAURANTS;

/*
Schema for restaurants collection in Appwrite:

Attributes:
- name: string (required, size: 1000)
- description: string (optional, size: 1000)
- address: string (optional, size: 255)
- image: string (optional, size: 500) - URL to restaurant image
- orderDeadline: string (required, size: 255) - HH:mm format
- distance: string (optional, size: 255) - e.g., "1.5 km"
- deliveryTime: string (optional, size: 255) - e.g., "15-25 ph"
- freeship: boolean (required, default: false)
- status: string (required, default: "pending") - "pending", "approved", "rejected"
- createdBy: string (required, size: 255) - User ID who created the restaurant
- menuType: string (optional, default: "static") - "static" or "dynamic"
- $createdAt: datetime (auto)
- $updatedAt: datetime (auto)

Indexes to create in Appwrite Console:
1. status (ASC) - for filtering by approval status
2. name (ASC) - for search by name
3. orderDeadline (ASC) - for filtering by deadline
4. createdBy (ASC) - for filtering by creator
5. $createdAt (DESC) - for recent submissions
*/

export interface RestaurantDoc {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  description?: string;
  address?: string;
  image?: string;
  orderDeadline: string;
  distance?: string;
  deliveryTime?: string;
  freeship: boolean;
  status: "pending" | "approved" | "rejected";
  userId: string;
  createdBy: string;
  menuType?: "static" | "dynamic";
}

export interface RestaurantInput {
  name: string;
  description?: string;
  address?: string;
  image?: string;
  orderDeadline: string;
  distance?: string;
  deliveryTime?: string;
  freeship: boolean;
  createdBy: string;
  menuType?: "static" | "dynamic";
}

// Create new restaurant (pending approval)
export async function createRestaurant(
  data: RestaurantInput,
): Promise<RestaurantDoc | null> {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      RESTAURANTS_COLLECTION,
      ID.unique(),
      {
        ...data,
        status: "pending", // All new restaurants start as pending
      },
    );
    return doc as unknown as RestaurantDoc;
  } catch (error) {
    console.error("Error creating restaurant:", error);
    return null;
  }
}

// Get restaurant by ID
export async function getRestaurant(id: string): Promise<RestaurantDoc | null> {
  try {
    const doc = await databases.getDocument(
      DATABASE_ID,
      RESTAURANTS_COLLECTION,
      id,
    );
    return doc as unknown as RestaurantDoc;
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    return null;
  }
}

// Get all restaurants with optional filters
export async function getRestaurants(
  status?: "pending" | "approved" | "rejected",
  limit: number = 50,
): Promise<RestaurantDoc[]> {
  try {
    const queries: any[] = [Query.limit(limit)];

    if (status) {
      queries.push(Query.equal("status", status));
    }

    queries.push(Query.orderDesc("$createdAt"));

    const response = await databases.listDocuments(
      DATABASE_ID,
      RESTAURANTS_COLLECTION,
      queries,
    );
    return response.documents as unknown as RestaurantDoc[];
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return [];
  }
}

// Get approved restaurants (for public display)
export async function getApprovedRestaurants(
  limit: number = 50,
): Promise<RestaurantDoc[]> {
  return getRestaurants("approved", limit);
}

// Get pending restaurants (for admin review)
export async function getPendingRestaurants(): Promise<RestaurantDoc[]> {
  return getRestaurants("pending", 100);
}

// Get restaurants submitted by a user
export async function getUserRestaurants(
  userId: string,
  status?: "pending" | "approved" | "rejected",
): Promise<RestaurantDoc[]> {
  try {
    const queries: any[] = [Query.equal("createdBy", userId)];

    if (status) {
      queries.push(Query.equal("status", status));
    }

    queries.push(Query.orderDesc("$createdAt"));

    const response = await databases.listDocuments(
      DATABASE_ID,
      RESTAURANTS_COLLECTION,
      queries,
    );
    return response.documents as unknown as RestaurantDoc[];
  } catch (error) {
    console.error("Error fetching user restaurants:", error);
    return [];
  }
}

// Update restaurant status (admin only)
export async function updateRestaurantStatus(
  restaurantId: string,
  status: "approved" | "rejected",
): Promise<boolean> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      RESTAURANTS_COLLECTION,
      restaurantId,
      {
        status,
      },
    );
    return true;
  } catch (error) {
    console.error("Error updating restaurant status:", error);
    return false;
  }
}

// Update restaurant info
export async function updateRestaurant(
  restaurantId: string,
  data: Partial<RestaurantInput>,
): Promise<RestaurantDoc | null> {
  try {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      RESTAURANTS_COLLECTION,
      restaurantId,
      data,
    );
    return doc as unknown as RestaurantDoc;
  } catch (error) {
    console.error("Error updating restaurant:", error);
    return null;
  }
}

// Delete restaurant
export async function deleteRestaurant(restaurantId: string): Promise<boolean> {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      RESTAURANTS_COLLECTION,
      restaurantId,
    );
    return true;
  } catch (error) {
    console.error("Error deleting restaurant:", error);
    return false;
  }
}

// Search restaurants by name or address
export async function searchRestaurants(
  searchTerm: string,
  status: "pending" | "approved" | "rejected" = "approved",
): Promise<RestaurantDoc[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      RESTAURANTS_COLLECTION,
      [
        Query.equal("status", status),
        Query.search("name", searchTerm),
        Query.orderDesc("$createdAt"),
        Query.limit(50),
      ],
    );

    // Also search by address
    const addressResponse = await databases.listDocuments(
      DATABASE_ID,
      RESTAURANTS_COLLECTION,
      [
        Query.equal("status", status),
        Query.search("address", searchTerm),
        Query.orderDesc("$createdAt"),
        Query.limit(50),
      ],
    );

    // Combine and deduplicate results
    const allResults = [...response.documents, ...addressResponse.documents];

    const uniqueResults = allResults.filter(
      (doc, index, self) => index === self.findIndex((d) => d.$id === doc.$id),
    );

    return uniqueResults as unknown as RestaurantDoc[];
  } catch (error) {
    console.error("Error searching restaurants:", error);
    return [];
  }
}

// Get restaurant by name/slug (supports Vietnamese search)
export async function getRestaurantByName(
  slug: string,
): Promise<RestaurantDoc | null> {
  try {
    // Try exact match first
    const exactResponse = await databases.listDocuments(
      DATABASE_ID,
      RESTAURANTS_COLLECTION,
      [
        Query.equal("name", slug),
        Query.equal("status", "approved"),
        Query.limit(1),
      ],
    );

    if (exactResponse.documents.length > 0) {
      return exactResponse.documents[0] as unknown as RestaurantDoc;
    }

    // If no exact match, try search with Vietnamese support
    const searchResponse = await databases.listDocuments(
      DATABASE_ID,
      RESTAURANTS_COLLECTION,
      [
        Query.equal("status", "approved"),
        Query.search("name", slug),
        Query.limit(10),
      ],
    );

    // Find the best match by comparing slugified names
    const bestMatch = searchResponse.documents.find((doc: any) => {
      const docSlug = generateRestaurantSlug(doc.name);
      return docSlug === slug;
    });

    if (bestMatch) {
      return bestMatch as unknown as RestaurantDoc;
    }

    return null;
  } catch (error) {
    console.error("Error fetching restaurant by name:", error);
    return null;
  }
}

// Generate URL-friendly slug from restaurant name (supports Vietnamese)
export function generateRestaurantSlug(name: string): string {
  return (
    name
      .toLowerCase()
      // Vietnamese character normalization
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Replace Vietnamese characters
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
      .replace(/[èéẹẻẽêềếệểễ]/g, "e")
      .replace(/[ìíịỉĩ]/g, "i")
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
      .replace(/[ùúụủũưừứựửữ]/g, "u")
      .replace(/[ỳýỵỷỹ]/g, "y")
      .replace(/[đ]/g, "d")
      // Remove special characters except spaces and hyphens
      .replace(/[^a-z0-9\s-]/g, "")
      // Replace spaces with hyphens
      .replace(/\s+/g, "-")
      // Remove multiple hyphens
      .replace(/-+/g, "-")
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, "")
      .trim()
  );
}

// Get restaurant by ID
export async function getRestaurantById(
  restaurantId: string,
): Promise<RestaurantDoc | null> {
  try {
    const response = await databases.getDocument(
      DATABASE_ID,
      RESTAURANTS_COLLECTION,
      restaurantId,
    );
    return response as unknown as RestaurantDoc;
  } catch (error) {
    console.error("Error fetching restaurant by ID:", error);
    return null;
  }
}
