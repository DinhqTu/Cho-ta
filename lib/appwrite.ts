import { Client, Account, Databases, Storage, ID, Query } from "appwrite";

const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Storage bucket ID for chat images
export const CHAT_BUCKET_ID = "chat_images";

// Database and Collection IDs - you'll need to create these in Appwrite Console
export const DATABASE_ID = "fastfood_db";
export const COLLECTIONS = {
  USERS: "users",
  MENU_ITEMS: "menu_items",
  ORDERS: "orders",
  ORDER_ITEMS: "order_items",
  RESTAURANTS: "restaurants",
  DAILY_MENUS: "daily_menus",
};

export { ID, Query, client };
export default client;
