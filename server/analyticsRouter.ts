import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { type InsertAnalyticsEvent } from "../drizzle/schema";
import {
  logAnalyticsEvent,
  getCardStats,
  getUserCardStats,
  getCardEvents,
  getEventCountsByType,
  getUserAnalyticsSummary,
} from "./analyticsDb";

/**
 * Analytics router for tracking and retrieving card engagement metrics
 */
export const analyticsRouter = router({
  /**
   * Log an analytics event (called from client)
   */
  logEvent: protectedProcedure
    .input(
      z.object({
        cardId: z.string(),
        eventType: z.enum([
          "wallet_add_apple" as const,
          "wallet_add_google" as const,
          "qr_scan" as const,
          "card_view" as const,
          "card_share" as const,
          "vcard_download" as const,
          "qr_download" as const,
        ]),
        metadata: z
          .object({
            platform: z.string().optional(),
            userAgent: z.string().optional(),
            ipAddress: z.string().optional(),
            referrer: z.string().optional(),
            additionalData: z.record(z.string(), z.any()).optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        return { success: false, error: "Not authenticated" };
      }

      try {
        const eventType = input.eventType as InsertAnalyticsEvent["eventType"];
        await logAnalyticsEvent(ctx.user.id, input.cardId, eventType, input.metadata);
        return { success: true };
      } catch (error) {
        console.error("Error logging analytics event:", error);
        return { success: false, error: "Failed to log event" };
      }
    }),

  /**
   * Get statistics for a specific card
   */
  getCardStats: protectedProcedure
    .input(
      z.object({
        cardId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        return null;
      }

      try {
        return await getCardStats(ctx.user.id, input.cardId);
      } catch (error) {
        console.error("Error getting card stats:", error);
        return null;
      }
    }),

  /**
   * Get all card statistics for the current user
   */
  getUserCardStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return [];
    }

    try {
      return await getUserCardStats(ctx.user.id);
    } catch (error) {
      console.error("Error getting user card stats:", error);
      return [];
    }
  }),

  /**
   * Get recent events for a specific card
   */
  getCardEvents: protectedProcedure
    .input(
      z.object({
        cardId: z.string(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        return [];
      }

      try {
        return await getCardEvents(ctx.user.id, input.cardId, input.limit);
      } catch (error) {
        console.error("Error getting card events:", error);
        return [];
      }
    }),

  /**
   * Get event counts by type for a card
   */
  getEventCountsByType: protectedProcedure
    .input(
      z.object({
        cardId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        return {};
      }

      try {
        return await getEventCountsByType(ctx.user.id, input.cardId);
      } catch (error) {
        console.error("Error getting event counts:", error);
        return {};
      }
    }),

  /**
   * Get analytics summary for all user cards
   */
  getUserSummary: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
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
      return await getUserAnalyticsSummary(ctx.user.id);
    } catch (error) {
      console.error("Error getting user summary:", error);
      return {
        totalWalletAdds: 0,
        totalQrScans: 0,
        totalCardViews: 0,
        totalShares: 0,
        topCard: null,
        recentEvents: [],
      };
    }
  }),
});
