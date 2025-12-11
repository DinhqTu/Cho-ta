import { Client, Databases, ID, Query } from "node-appwrite";

// Server-side Appwrite client với API key
const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!); // API key cho server

export const serverDatabases = new Databases(client);

export const DATABASE_ID = "fastfood_db";

export { ID, Query };
