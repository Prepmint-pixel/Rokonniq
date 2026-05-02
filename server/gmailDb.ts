import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { gmailCredentials } from "../drizzle/schema";

/**
 * Save or update Gmail credentials for a user
 */
export async function saveGmailCredentials(
  userId: number,
  email: string,
  accessToken: string,
  refreshToken: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(gmailCredentials)
    .where(eq(gmailCredentials.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing credentials
    return db
      .update(gmailCredentials)
      .set({
        email,
        accessToken,
        refreshToken: refreshToken || existing[0].refreshToken,
        isConnected: 1,
        updatedAt: new Date(),
      })
      .where(eq(gmailCredentials.userId, userId));
  } else {
    // Insert new credentials
    return db.insert(gmailCredentials).values({
      userId,
      email,
      accessToken,
      refreshToken,
      isConnected: 1,
    });
  }
}

/**
 * Get Gmail credentials for a user
 */
export async function getGmailCredentials(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(gmailCredentials)
    .where(eq(gmailCredentials.userId, userId))
    .limit(1);

  return result[0] || null;
}

/**
 * Update Gmail access token
 */
export async function updateGmailAccessToken(userId: number, accessToken: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(gmailCredentials)
    .set({
      accessToken,
      updatedAt: new Date(),
    })
    .where(eq(gmailCredentials.userId, userId));
}

/**
 * Disconnect Gmail account
 */
export async function disconnectGmail(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(gmailCredentials)
    .set({
      isConnected: 0,
      updatedAt: new Date(),
    })
    .where(eq(gmailCredentials.userId, userId));
}

/**
 * Check if user has Gmail connected
 */
export async function hasGmailConnected(userId: number): Promise<boolean> {
  const credentials = await getGmailCredentials(userId);
  return credentials !== null && credentials.isConnected === 1;
}
