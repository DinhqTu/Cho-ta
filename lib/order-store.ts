import { MenuItem } from "./menu-data";
import { User } from "./users-data";

export interface OrderItem {
  item: MenuItem;
  quantity: number;
  note?: string;
}

export interface UserOrder {
  user: User;
  itemId: string;
  quantity: number;
  note?: string;
}

const ORDERS_KEY = "izakaya_orders";

export function saveOrdersToStorage(orders: UserOrder[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }
}

export function getOrdersFromStorage(): UserOrder[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(ORDERS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
  }
  return [];
}

export function clearOrdersFromStorage(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ORDERS_KEY);
  }
}
