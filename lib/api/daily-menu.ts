import { databases, DATABASE_ID, ID, Query } from "../appwrite";

// Collection ID for daily menus
export const DAILY_MENU_COLLECTION = "daily_menus";

/*
Schema for daily_menus collection in Appwrite:

Attributes:
- date: string (YYYY-MM-DD format, required, indexed, unique)
- menuItems: string (JSON array of menu items - stored as string)
- isActive: boolean (default: true)
- createdBy: string (user ID who created)
- createdAt: string (ISO datetime)
- updatedAt: string (ISO datetime)

Each menu item in the JSON array:
{
  id: string,
  name: string,
  description: string,
  price: number,
  category: string,
  image: string
}

Indexes to create:
1. date (ASC, unique)
2. isActive (ASC)
*/

export interface DailyMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
}

export interface DailyMenuDoc {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  date: string;
  menuItems: string; // JSON string of DailyMenuItem[]
  isActive: boolean;
  createdBy: string;
}

export interface DailyMenu {
  id: string;
  date: string;
  menuItems: DailyMenuItem[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Convert document to DailyMenu
function toDailyMenu(doc: DailyMenuDoc): DailyMenu {
  return {
    id: doc.$id,
    date: doc.date,
    menuItems: JSON.parse(doc.menuItems || "[]"),
    isActive: doc.isActive,
    createdBy: doc.createdBy,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
  };
}

// Get today's date in YYYY-MM-DD format (local timezone)
export function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Format date to display string
export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Create daily menu for a specific date
export async function createDailyMenu(
  date: string,
  menuItems: DailyMenuItem[],
  userId: string
): Promise<DailyMenu | null> {
  // Validate: max 6 items
  if (menuItems.length > 6) {
    console.error("Daily menu can have maximum 6 items");
    return null;
  }

  try {
    // Check if menu already exists for this date
    const existing = await getDailyMenuByDate(date);
    if (existing) {
      // Update existing menu
      return await updateDailyMenu(existing.id, menuItems);
    }

    const doc = await databases.createDocument(
      DATABASE_ID,
      DAILY_MENU_COLLECTION,
      ID.unique(),
      {
        date,
        menuItems: JSON.stringify(menuItems),
        isActive: true,
        createdBy: userId,
      }
    );
    return toDailyMenu(doc as unknown as DailyMenuDoc);
  } catch (error) {
    console.error("Error creating daily menu:", error);
    return null;
  }
}

// Get daily menu by date
export async function getDailyMenuByDate(
  date: string
): Promise<DailyMenu | null> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      DAILY_MENU_COLLECTION,
      [Query.equal("date", date), Query.limit(1)]
    );

    if (response.documents.length > 0) {
      return toDailyMenu(response.documents[0] as unknown as DailyMenuDoc);
    }
    return null;
  } catch (error) {
    console.error("Error fetching daily menu:", error);
    return null;
  }
}

// Get today's menu
export async function getTodayMenu(): Promise<DailyMenu | null> {
  return getDailyMenuByDate(getTodayDate());
}

// Update daily menu
export async function updateDailyMenu(
  menuId: string,
  menuItems: DailyMenuItem[]
): Promise<DailyMenu | null> {
  if (menuItems.length > 6) {
    console.error("Daily menu can have maximum 6 items");
    return null;
  }

  try {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      DAILY_MENU_COLLECTION,
      menuId,
      {
        menuItems: JSON.stringify(menuItems),
      }
    );
    return toDailyMenu(doc as unknown as DailyMenuDoc);
  } catch (error) {
    console.error("Error updating daily menu:", error);
    return null;
  }
}

// Add item to daily menu
export async function addItemToDailyMenu(
  date: string,
  item: DailyMenuItem,
  userId: string
): Promise<DailyMenu | null> {
  try {
    const existing = await getDailyMenuByDate(date);

    if (existing) {
      if (existing.menuItems.length >= 6) {
        console.error("Daily menu already has 6 items");
        return null;
      }

      // Check if item already exists
      const itemExists = existing.menuItems.some((i) => i.id === item.id);
      if (itemExists) {
        console.error("Item already exists in daily menu");
        return null;
      }

      const updatedItems = [...existing.menuItems, item];
      return await updateDailyMenu(existing.id, updatedItems);
    } else {
      // Create new daily menu with this item
      return await createDailyMenu(date, [item], userId);
    }
  } catch (error) {
    console.error("Error adding item to daily menu:", error);
    return null;
  }
}

// Remove item from daily menu
export async function removeItemFromDailyMenu(
  date: string,
  itemId: string
): Promise<DailyMenu | null> {
  try {
    const existing = await getDailyMenuByDate(date);

    if (!existing) {
      console.error("Daily menu not found");
      return null;
    }

    const updatedItems = existing.menuItems.filter((i) => i.id !== itemId);
    return await updateDailyMenu(existing.id, updatedItems);
  } catch (error) {
    console.error("Error removing item from daily menu:", error);
    return null;
  }
}

// Delete daily menu
export async function deleteDailyMenu(menuId: string): Promise<boolean> {
  try {
    await databases.deleteDocument(DATABASE_ID, DAILY_MENU_COLLECTION, menuId);
    return true;
  } catch (error) {
    console.error("Error deleting daily menu:", error);
    return false;
  }
}

// Get menus for a date range
export async function getDailyMenusInRange(
  startDate: string,
  endDate: string
): Promise<DailyMenu[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      DAILY_MENU_COLLECTION,
      [
        Query.greaterThanEqual("date", startDate),
        Query.lessThanEqual("date", endDate),
        Query.orderAsc("date"),
      ]
    );
    return response.documents.map((doc) =>
      toDailyMenu(doc as unknown as DailyMenuDoc)
    );
  } catch (error) {
    console.error("Error fetching daily menus in range:", error);
    return [];
  }
}

// Get upcoming menus (next 7 days)
export async function getUpcomingMenus(): Promise<DailyMenu[]> {
  const today = getTodayDate();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const endDate = nextWeek.toISOString().split("T")[0];

  return getDailyMenusInRange(today, endDate);
}

// Copy menu from one date to another
export async function copyDailyMenu(
  fromDate: string,
  toDate: string,
  userId: string
): Promise<DailyMenu | null> {
  try {
    const sourceMenu = await getDailyMenuByDate(fromDate);

    if (!sourceMenu) {
      console.error("Source menu not found");
      return null;
    }

    return await createDailyMenu(toDate, sourceMenu.menuItems, userId);
  } catch (error) {
    console.error("Error copying daily menu:", error);
    return null;
  }
}
