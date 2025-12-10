import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from "../appwrite";
import { MenuItem } from "../menu-data";

export interface MenuItemDoc {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isActive: boolean;
}

// Convert Appwrite document to MenuItem
function toMenuItem(doc: MenuItemDoc): MenuItem {
  return {
    id: doc.$id,
    name: doc.name,
    description: doc.description,
    price: doc.price,
    category: doc.category,
    image: doc.image || "",
  };
}

export async function fetchMenuItems(): Promise<MenuItem[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.MENU_ITEMS,
      [Query.equal("isActive", true), Query.orderAsc("category")]
    );
    return response.documents.map((doc) =>
      toMenuItem(doc as unknown as MenuItemDoc)
    );
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return [];
  }
}

export async function createMenuItem(
  item: Omit<MenuItem, "id">
): Promise<MenuItem | null> {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.MENU_ITEMS,
      ID.unique(),
      {
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image || "",
        isActive: true,
      }
    );
    return toMenuItem(doc as unknown as MenuItemDoc);
  } catch (error) {
    console.error("Error creating menu item:", error);
    return null;
  }
}

export async function updateMenuItemApi(
  id: string,
  updates: Partial<MenuItem>
): Promise<boolean> {
  try {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.MENU_ITEMS, id, {
      ...(updates.name && { name: updates.name }),
      ...(updates.description && { description: updates.description }),
      ...(updates.price && { price: updates.price }),
      ...(updates.category && { category: updates.category }),
      ...(updates.image && { image: updates.image }),
    });
    return true;
  } catch (error) {
    console.error("Error updating menu item:", error);
    return false;
  }
}

export async function deleteMenuItemApi(id: string): Promise<boolean> {
  try {
    // Soft delete - set isActive to false
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.MENU_ITEMS, id, {
      isActive: false,
    });
    return true;
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return false;
  }
}
