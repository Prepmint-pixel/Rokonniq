import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import { analyticsEvents, cardStats, type InsertAnalyticsEvent, type CardStat } from "../drizzle/schema";

/**
 * Log an analytics event for card interactions
 */
export async function logAnalyticsEvent(
  userId: number,
  cardId: string,
  eventType: InsertAnalyticsEvent["eventType"],
  metadata?: {
    platform?: string;
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    additionalData?: Record<string, unknown>;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Analytics] Database not available");
    return;
  }

  try {
    await db.insert(analyticsEvents).values({
      userId,
      cardId,
      eventType,
      platform: metadata?.platform,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
      referrer: metadata?.referrer,
      metadata: metadata?.additionalData ? JSON.stringify(metadata.additionalData) : null,
    });

    // Update card stats
    await updateCardStats(userId, cardId, eventType);
  } catch (error) {
    console.error("[Analytics] Failed to log event:", error);
  }
}

/**
 * Update aggregated card statistics
 */
async function updateCardStats(
  userId: number,
  cardId: string,
  eventType: InsertAnalyticsEvent["eventType"]
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Get or create card stats
    const existingStats = await db
      .select()
      .from(cardStats)
      .where(and(eq(cardStats.userId, userId), eq(cardStats.cardId, cardId)))
      .limit(1);

    const now = new Date();
    const updates: Record<string, unknown> = { updatedAt: now };

    // Increment appropriate counter
    switch (eventType) {
      case "wallet_add_apple":
        updates.walletAddAppleCount = sql`${cardStats.walletAddAppleCount} + 1`;
        updates.walletAddCount = sql`${cardStats.walletAddCount} + 1`;
        updates.lastWalletAddAt = now;
        break;
      case "wallet_add_google":
        updates.walletAddGoogleCount = sql`${cardStats.walletAddGoogleCount} + 1`;
        updates.walletAddCount = sql`${cardStats.walletAddCount} + 1`;
        updates.lastWalletAddAt = now;
        break;
      case "qr_scan":
        updates.qrScanCount = sql`${cardStats.qrScanCount} + 1`;
        updates.lastQrScanAt = now;
        break;
      case "card_view":
        updates.cardViewCount = sql`${cardStats.cardViewCount} + 1`;
        updates.lastCardViewAt = now;
        break;
      case "card_share":
        updates.cardShareCount = sql`${cardStats.cardShareCount} + 1`;
        break;
      case "vcard_download":
        updates.vcardDownloadCount = sql`${cardStats.vcardDownloadCount} + 1`;
        break;
      case "qr_download":
        updates.qrDownloadCount = sql`${cardStats.qrDownloadCount} + 1`;
        break;
    }

    if (existingStats.length > 0) {
      // Update existing stats
      await db
        .update(cardStats)
        .set(updates)
        .where(and(eq(cardStats.userId, userId), eq(cardStats.cardId, cardId)));
    } else {
      // Create new stats entry
      const newStats: any = {
        userId,
        cardId,
        walletAddCount: 0,
        walletAddAppleCount: 0,
        walletAddGoogleCount: 0,
        qrScanCount: 0,
        cardViewCount: 0,
        cardShareCount: 0,
        vcardDownloadCount: 0,
        qrDownloadCount: 0,
      };

      // Set the appropriate counter based on event type
      switch (eventType) {
        case "wallet_add_apple":
          newStats.walletAddAppleCount = 1;
          newStats.walletAddCount = 1;
          newStats.lastWalletAddAt = now;
          break;
        case "wallet_add_google":
          newStats.walletAddGoogleCount = 1;
          newStats.walletAddCount = 1;
          newStats.lastWalletAddAt = now;
          break;
        case "qr_scan":
          newStats.qrScanCount = 1;
          newStats.lastQrScanAt = now;
          break;
        case "card_view":
          newStats.cardViewCount = 1;
          newStats.lastCardViewAt = now;
          break;
        case "card_share":
          newStats.cardShareCount = 1;
          break;
        case "vcard_download":
          newStats.vcardDownloadCount = 1;
          break;
        case "qr_download":
          newStats.qrDownloadCount = 1;
          break;
      }

      await db.insert(cardStats).values(newStats);
    }
  } catch (error) {
    console.error("[Analytics] Failed to update card stats:", error);
  }
}

/**
 * Get card statistics for a specific card
 */
export async function getCardStats(userId: number, cardId: string): Promise<CardStat | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(cardStats)
      .where(and(eq(cardStats.userId, userId), eq(cardStats.cardId, cardId)))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Analytics] Failed to get card stats:", error);
    return null;
  }
}

/**
 * Get all card statistics for a user
 */
export async function getUserCardStats(userId: number): Promise<CardStat[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(cardStats)
      .where(eq(cardStats.userId, userId))
      .orderBy(desc(cardStats.walletAddCount));
  } catch (error) {
    console.error("[Analytics] Failed to get user card stats:", error);
    return [];
  }
}

/**
 * Get recent analytics events for a card
 */
export async function getCardEvents(
  userId: number,
  cardId: string,
  limit: number = 50
): Promise<typeof analyticsEvents.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.userId, userId), eq(analyticsEvents.cardId, cardId)))
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("[Analytics] Failed to get card events:", error);
    return [];
  }
}

/**
 * Get event count by type for a card
 */
export async function getEventCountsByType(
  userId: number,
  cardId: string
): Promise<Record<string, number>> {
  const db = await getDb();
  if (!db) return {};

  try {
    const result = await db
      .select({
        eventType: analyticsEvents.eventType,
        count: sql<number>`COUNT(*)`,
      })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.userId, userId), eq(analyticsEvents.cardId, cardId)))
      .groupBy(analyticsEvents.eventType);

    const counts: Record<string, number> = {};
    result.forEach((row) => {
      if (row.eventType) {
        counts[row.eventType] = row.count;
      }
    });
    return counts;
  } catch (error) {
    console.error("[Analytics] Failed to get event counts:", error);
    return {};
  }
}

/**
 * Get analytics summary for all user cards
 */
export async function getUserAnalyticsSummary(userId: number): Promise<{
  totalWalletAdds: number;
  totalQrScans: number;
  totalCardViews: number;
  totalShares: number;
  topCard: CardStat | null;
  recentEvents: typeof analyticsEvents.$inferSelect[];
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalWalletAdds: 0,
      totalQrScans: 0,
      totalCardViews: 0,
      totalShares: 0,
      topCard: null,
      recentEvents: [],
    };
  }

  try {
    const stats = await db
      .select()
      .from(cardStats)
      .where(eq(cardStats.userId, userId));

    const totalWalletAdds = stats.reduce((sum, s) => sum + s.walletAddCount, 0);
    const totalQrScans = stats.reduce((sum, s) => sum + s.qrScanCount, 0);
    const totalCardViews = stats.reduce((sum, s) => sum + s.cardViewCount, 0);
    const totalShares = stats.reduce((sum, s) => sum + s.cardShareCount, 0);

    const topCard = stats.length > 0 ? stats[0] : null;

    const recentEvents = await db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.userId, userId))
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(10);

    return {
      totalWalletAdds,
      totalQrScans,
      totalCardViews,
      totalShares,
      topCard,
      recentEvents,
    };
  } catch (error) {
    console.error("[Analytics] Failed to get user summary:", error);
    return {
      totalWalletAdds: 0,
      totalQrScans: 0,
      totalCardViews: 0,
      totalShares: 0,
      topCard: null,
      recentEvents: [],
    };
  }
}
