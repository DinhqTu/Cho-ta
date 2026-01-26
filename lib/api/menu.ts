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
      [
        Query.equal("isActive", true),
        Query.orderAsc("category"),
        Query.limit(500),
      ],
    );
    return response.documents.map((doc) =>
      toMenuItem(doc as unknown as MenuItemDoc),
    );
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return [];
  }
}

// Fetch menu items as documents (for admin management)
export async function fetchMenuItemsForAdmin(): Promise<MenuItemDoc[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.MENU_ITEMS,
      [
        Query.orderAsc("category"),
        Query.orderDesc("$createdAt"),
        Query.limit(500),
      ],
    );
    return response.documents.map((doc) => doc as unknown as MenuItemDoc);
  } catch (error) {
    console.error("Error fetching menu items for admin:", error);
    return [];
  }
}

// Fetch menu items for a specific restaurant
export async function fetchMenuItemsForRestaurant(
  restaurantId: string,
): Promise<MenuItemDoc[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.MENU_ITEMS,
      [
        Query.equal("restaurantId", restaurantId),
        Query.equal("isActive", true),
        Query.orderAsc("category"),
        Query.orderAsc("name"),
        Query.limit(500),
      ],
    );
    return response.documents.map((doc) => doc as unknown as MenuItemDoc);
  } catch (error) {
    console.error("Error fetching menu items for restaurant:", error);
    return [];
  }
}

// Fetch restaurant menu (selected items for a restaurant)
export async function fetchRestaurantMenu(
  restaurantId: string,
): Promise<string[]> {
  try {
    const restaurant = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.RESTAURANTS,
      restaurantId,
    );
    return (restaurant as any).menuItems || [];
  } catch (error) {
    console.error("Error fetching restaurant menu:", error);
    return [];
  }
}

// Update restaurant menu
export async function updateRestaurantMenu(
  restaurantId: string,
  menuItems: string[],
): Promise<boolean> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.RESTAURANTS,
      restaurantId,
      {
        menuItems: menuItems,
      },
    );
    return true;
  } catch (error) {
    console.error("Error updating restaurant menu:", error);
    return false;
  }
}

// Create daily menu document
export async function createDailyMenu(
  restaurantId: string,
  menuItems: string[],
  menuType: "static" | "dynamic",
  date?: string,
): Promise<boolean> {
  try {
    // Get restaurant info to include menuType
    const restaurant = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.RESTAURANTS,
      restaurantId,
    );

    const finalMenuType = menuType || (restaurant as any).menuType || "static";

    // For static menus, use a fixed date or no date filtering
    // For dynamic menus, always use the provided date or today
    let finalDate = date;
    if (finalMenuType === "static") {
      // Static menus can use a fixed date or default date
      finalDate = date || new Date().toISOString().split("T")[0];
    } else {
      // Dynamic menus must use specific date
      finalDate = date || new Date().toISOString().split("T")[0];
    }

    // Create daily menu document with both fields
    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.DAILY_MENUS,
      ID.unique(),
      {
        restaurantId: restaurantId,
        menuItem: menuItems, // Store as relationship array
        menuType: finalMenuType,
        date: finalDate,
        isActive: true,
        // Appwrite automatically adds $createdAt and $updatedAt
      },
    );
    return true;
  } catch (error) {
    console.error("Error creating daily menu:", error);
    return false;
  }
}

// Get daily menus for restaurant
export async function getDailyMenus(
  restaurantId: string,
  date?: string,
  menuType?: "static" | "dynamic",
): Promise<any[]> {
  try {
    const queries = [
      Query.equal("restaurantId", restaurantId),
      Query.equal("isActive", true),
      Query.orderDesc("$createdAt"), // Use Appwrite's built-in timestamp
    ];

    // Add menuType filter
    if (menuType) {
      queries.push(Query.equal("menuType", menuType));
    }

    // For dynamic menus, also filter by date
    // For static menus, date is optional
    if (date && menuType === "dynamic") {
      queries.push(Query.equal("date", date));
    } else if (date && menuType === "static") {
      // For static menus, try to find by date but don't require it
      queries.push(Query.equal("date", date));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.DAILY_MENUS,
      queries,
    );

    // Parse menuItems from both JSON string and relationship array
    const parsedDocuments = response.documents.map((doc: any) => {
      let menuItemsArray: string[] = [];

      // Try to use menuItem relationship first (new data)
      if (doc.menuItem) {
        // Appwrite relationship might be object or array
        if (Array.isArray(doc.menuItem)) {
          menuItemsArray = doc.menuItem.map((item: any) => item.$id || item);
        } else if (doc.menuItem.$id) {
          menuItemsArray = [doc.menuItem.$id];
        } else if (typeof doc.menuItem === "string") {
          menuItemsArray = [doc.menuItem];
        } else {
          menuItemsArray = [];
        }
      }
      // Fallback to menuItems JSON string (old data)
      else if (doc.menuItems) {
        try {
          menuItemsArray = JSON.parse(doc.menuItems || "[]");
        } catch (e) {
          menuItemsArray = [];
        }
      } else {
        console.log("No menu items found");
      }

      return {
        ...doc,
        menuItems: menuItemsArray,
      };
    });

    return parsedDocuments;
  } catch (error) {
    console.error("Error fetching daily menus:", error);
    return [];
  }
}

// Update daily menu
export async function updateDailyMenu(
  menuId: string,
  menuItems: string[],
  menuType: "static" | "dynamic",
): Promise<boolean> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.DAILY_MENUS,
      menuId,
      {
        menuItem: menuItems, // Store as relationship array
        menuType: menuType,
        // Appwrite automatically updates $updatedAt
      },
    );
    return true;
  } catch (error) {
    console.error("Error updating daily menu:", error);
    return false;
  }
}
export async function getDailyMenusWithDetails(
  restaurantId: string,
  date?: string,
  menuType?: "static" | "dynamic",
): Promise<any[]> {
  try {
    const queries = [
      Query.equal("restaurantId", restaurantId),
      Query.equal("isActive", true),
      Query.orderDesc("$createdAt"),
      Query.select(["*", "menuItem.*"]),
    ];

    if (menuType) {
      queries.push(Query.equal("menuType", menuType));
    }

    if (date && menuType === "dynamic") {
      queries.push(Query.equal("date", date));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.DAILY_MENUS,
      queries,
    );

    return response.documents.map((doc: any) => ({
      ...doc,
      menuItemDetails: doc.menuItem ?? [], // 🔥 populate sẵn
    }));
  } catch (error) {
    console.error("Error fetching daily menus with details:", error);
    return [];
  }
}

export async function createMenuItem(
  item: Omit<MenuItem, "id">,
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
      },
    );
    return toMenuItem(doc as unknown as MenuItemDoc);
  } catch (error) {
    console.error("Error creating menu item:", error);
    return null;
  }
}

// Create menu item for admin (returns document)
export async function createMenuItemForAdmin(
  item: Omit<MenuItem, "id">,
  restaurantId?: string,
): Promise<MenuItemDoc | null> {
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
        restaurantId: restaurantId || null,
      },
    );
    return doc as unknown as MenuItemDoc;
  } catch (error) {
    console.error("Error creating menu item:", error);
    return null;
  }
}

export async function updateMenuItemApi(
  id: string,
  updates: Partial<MenuItem>,
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
