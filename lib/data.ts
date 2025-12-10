export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  estimatedTime?: string;
  notes?: string;
}

export const mockOrders: Order[] = [
  {
    id: "ORD-001",
    customerName: "Sarah Johnson",
    items: [
      { name: "Margherita Pizza", quantity: 2, price: 14.99 },
      { name: "Caesar Salad", quantity: 1, price: 8.99 },
    ],
    total: 38.97,
    status: "preparing",
    createdAt: "2025-12-08T10:30:00",
    estimatedTime: "15 min",
  },
  {
    id: "ORD-002",
    customerName: "Mike Chen",
    items: [
      { name: "Spicy Ramen", quantity: 1, price: 12.99 },
      { name: "Gyoza (6pc)", quantity: 2, price: 7.99 },
    ],
    total: 28.97,
    status: "pending",
    createdAt: "2025-12-08T10:45:00",
    notes: "Extra spicy please!",
  },
  {
    id: "ORD-003",
    customerName: "Emily Davis",
    items: [
      { name: "Grilled Salmon", quantity: 1, price: 22.99 },
      { name: "Mashed Potatoes", quantity: 1, price: 5.99 },
      { name: "Sparkling Water", quantity: 2, price: 3.99 },
    ],
    total: 36.96,
    status: "ready",
    createdAt: "2025-12-08T09:15:00",
  },
  {
    id: "ORD-004",
    customerName: "James Wilson",
    items: [
      { name: "Burger Deluxe", quantity: 3, price: 15.99 },
      { name: "Fries", quantity: 3, price: 4.99 },
      { name: "Milkshake", quantity: 3, price: 6.99 },
    ],
    total: 83.91,
    status: "delivered",
    createdAt: "2025-12-08T08:00:00",
  },
  {
    id: "ORD-005",
    customerName: "Lisa Anderson",
    items: [{ name: "Veggie Wrap", quantity: 2, price: 11.99 }],
    total: 23.98,
    status: "cancelled",
    createdAt: "2025-12-08T11:00:00",
    notes: "Customer changed mind",
  },
  {
    id: "ORD-006",
    customerName: "Tom Baker",
    items: [
      { name: "Chicken Tikka", quantity: 1, price: 16.99 },
      { name: "Naan Bread", quantity: 2, price: 3.99 },
      { name: "Mango Lassi", quantity: 1, price: 4.99 },
    ],
    total: 29.96,
    status: "preparing",
    createdAt: "2025-12-08T10:50:00",
    estimatedTime: "20 min",
  },
];

export const statusConfig: Record<
  OrderStatus,
  { label: string; color: string }
> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  },
  preparing: {
    label: "Preparing",
    color: "bg-orange-500/20 text-orange-700 border-orange-500/30",
  },
  ready: {
    label: "Ready",
    color: "bg-green-500/20 text-green-700 border-green-500/30",
  },
  delivered: {
    label: "Delivered",
    color: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-500/20 text-red-700 border-red-500/30",
  },
};
