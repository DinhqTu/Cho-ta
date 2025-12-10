import { databases, DATABASE_ID, ID, Query } from "../appwrite";

// Collection ID for user roles
export const USER_ROLES_COLLECTION = "user_roles";

export type UserRole = "admin" | "user";

export interface UserRoleDoc {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface UserRoleData {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

// Convert document to UserRoleData
function toUserRoleData(doc: UserRoleDoc): UserRoleData {
  return {
    id: doc.$id,
    userId: doc.userId,
    email: doc.email,
    name: doc.name,
    role: doc.role,
    createdAt: doc.$createdAt,
  };
}

// Get user role by userId
export async function getUserRole(
  userId: string
): Promise<UserRoleData | null> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      USER_ROLES_COLLECTION,
      [Query.equal("userId", userId), Query.limit(1)]
    );

    if (response.documents.length > 0) {
      return toUserRoleData(response.documents[0] as unknown as UserRoleDoc);
    }
    return null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
}

// Create or update user role
export async function setUserRole(
  userId: string,
  email: string,
  name: string,
  role: UserRole
): Promise<UserRoleData | null> {
  try {
    // Check if user role already exists
    const existing = await getUserRole(userId);

    if (existing) {
      // Update existing role
      const doc = await databases.updateDocument(
        DATABASE_ID,
        USER_ROLES_COLLECTION,
        existing.id,
        { role }
      );
      return toUserRoleData(doc as unknown as UserRoleDoc);
    }

    // Create new role
    const doc = await databases.createDocument(
      DATABASE_ID,
      USER_ROLES_COLLECTION,
      ID.unique(),
      {
        userId,
        email,
        name,
        role,
      }
    );
    return toUserRoleData(doc as unknown as UserRoleDoc);
  } catch (error) {
    console.error("Error setting user role:", error);
    return null;
  }
}

// Create default user role (called after registration)
export async function createDefaultUserRole(
  userId: string,
  email: string,
  name: string
): Promise<UserRoleData | null> {
  return setUserRole(userId, email, name, "user");
}

// Check if user is admin
export async function isUserAdmin(userId: string): Promise<boolean> {
  const userRole = await getUserRole(userId);
  return userRole?.role === "admin";
}

// Get all users with roles
export async function getAllUserRoles(): Promise<UserRoleData[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      USER_ROLES_COLLECTION,
      [Query.orderDesc("createdAt"), Query.limit(100)]
    );
    return response.documents.map((doc) =>
      toUserRoleData(doc as unknown as UserRoleDoc)
    );
  } catch (error) {
    console.error("Error fetching all user roles:", error);
    return [];
  }
}

// Initialize admin user (run once to set up admin)
export async function initializeAdminUser(
  userId: string,
  email: string,
  name: string
): Promise<UserRoleData | null> {
  return setUserRole(userId, email, name, "admin");
}
