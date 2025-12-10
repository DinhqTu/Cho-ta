import { MenuItem } from "./menu-data";

const MENU_KEY = "izakaya_menu_items";

// Default menu items
export const defaultMenuItems: MenuItem[] = [
  {
    id: "m-001",
    name: "Sushi Set A",
    description: "10 pieces of seasonal sushi.",
    price: 12.5,
    image: "/assets/menu/sushi-set-a.jpg",
    category: "Sushi",
  },
  {
    id: "m-002",
    name: "Ramen Tonkotsu",
    description: "Pork broth, chashu, egg, noodles.",
    price: 9,
    image: "/assets/menu/ramen.jpg",
    category: "Noodles",
  },
  {
    id: "m-003",
    name: "Gyoza",
    description: "Pan-fried pork dumplings (6 pcs).",
    price: 6.5,
    image: "/assets/menu/gyoza.jpg",
    category: "Appetizers",
  },
  {
    id: "m-004",
    name: "Yakitori Set",
    description: "Grilled chicken skewers with tare sauce.",
    price: 8,
    image: "/assets/menu/yakitori.jpg",
    category: "Grilled",
  },
  {
    id: "m-005",
    name: "Tempura Udon",
    description: "Hot udon with crispy shrimp tempura.",
    price: 11,
    image: "/assets/menu/tempura-udon.jpg",
    category: "Noodles",
  },
  {
    id: "m-006",
    name: "Matcha Mochi",
    description: "Soft rice cakes with green tea filling.",
    price: 5,
    image: "/assets/menu/matcha-mochi.jpg",
    category: "Desserts",
  },
];

export function getMenuItems(): MenuItem[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(MENU_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return defaultMenuItems;
      }
    }
  }
  return defaultMenuItems;
}

export function saveMenuItems(items: MenuItem[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(MENU_KEY, JSON.stringify(items));
  }
}

export function addMenuItem(item: Omit<MenuItem, "id">): MenuItem {
  const items = getMenuItems();
  const newItem: MenuItem = {
    ...item,
    id: `m-${Date.now()}`,
  };
  items.push(newItem);
  saveMenuItems(items);
  return newItem;
}

export function updateMenuItem(id: string, updates: Partial<MenuItem>): void {
  const items = getMenuItems();
  const index = items.findIndex((item) => item.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    saveMenuItems(items);
  }
}

export function deleteMenuItem(id: string): void {
  const items = getMenuItems();
  const filtered = items.filter((item) => item.id !== id);
  saveMenuItems(filtered);
}

export function resetMenuItems(): void {
  saveMenuItems(defaultMenuItems);
}

export const menuCategories = [
  "Cá",
  "Thịt heo",
  "Thịt bò",
  "Thịt gà",
  "Thịt vịt",
  "Ếch",
  "Trứng",
  "Rau củ",
  "Đậu hũ",
  "Canh",
  "Cơm",
  "Món khác",
];

export const categoryEmoji: Record<string, string> = {
  Cá: "🐟",
  "Thịt heo": "🐖",
  "Thịt bò": "🐄",
  "Thịt gà": "🐓",
  "Thịt vịt": "🪿",
  Trứng: "🥚",
  Ếch: "🐸",
  "Rau củ": "🥬",
  "Đậu hũ": "🧈",
  Canh: "🍲",
  Cơm: "🍚",
  "Món khác": "🍽️",
};
