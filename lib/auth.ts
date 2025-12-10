import { account, ID } from "./appwrite";
import { Models } from "appwrite";

export type User = Models.User<Models.Preferences>;

export async function createAccount(
  email: string,
  password: string,
  name: string
): Promise<User> {
  const user = await account.create(ID.unique(), email, password, name);
  // Auto login after registration
  await login(email, password);
  return user;
}

export async function login(
  email: string,
  password: string
): Promise<Models.Session> {
  // Try to delete existing session first
  try {
    await account.deleteSession("current");
  } catch {
    // No existing session, continue
  }

  return await account.createEmailPasswordSession(email, password);
}

export async function logout(): Promise<void> {
  try {
    await account.deleteSession("current");
  } catch {
    // Session might not exist
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await account.get();
  } catch {
    return null;
  }
}

export async function isLoggedIn(): Promise<boolean> {
  try {
    await account.get();
    return true;
  } catch {
    return false;
  }
}
