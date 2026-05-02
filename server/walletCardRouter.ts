import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { walletCards } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { generatePKPass, validateCertificates } from "./pkpass";
import { generateGoogleWalletJWT, createGoogleWalletSaveUrl } from "./googleWallet";

export const walletCardRouter = router({
  /**
   * Create or update a wallet card
   */
  create: protectedProcedure
    .input(
      z.object({
        cardId: z.string(),
        type: z.enum(["loyalty", "gift", "membership", "event", "coupon"]),
        title: z.string(),
        description: z.string().optional(),
        logoUrl: z.string().optional(),
        backgroundColor: z.string().default("#1F2937"),
        textColor: z.string().default("#FFFFFF"),
        accentColor: z.string().default("#3B82F6"),
        barcode: z.string().optional(),
        barcodeFormat: z.enum(["QR", "CODE128", "PDF417"]).default("QR"),
        expiryDate: z.date().optional(),
        points: z.number().optional(),
        balance: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Check if wallet card already exists for this card
      const existing = await db
        .select()
        .from(walletCards)
        .where(
          and(
            eq(walletCards.userId, ctx.user.id),
            eq(walletCards.cardId, input.cardId)
          )
        );

      if (existing.length > 0) {
        // Update existing
        const result = await db
          .update(walletCards)
          .set({
            type: input.type,
            title: input.title,
            description: input.description,
            logoUrl: input.logoUrl,
            backgroundColor: input.backgroundColor,
            textColor: input.textColor,
            accentColor: input.accentColor,
            barcode: input.barcode,
            barcodeFormat: input.barcodeFormat,
            expiryDate: input.expiryDate,
            points: input.points,
            balance: input.balance,
            updatedAt: new Date(),
          })
          .where(eq(walletCards.id, existing[0].id))
          .returning();

        return result[0];
      } else {
        // Create new
        const result = await db
          .insert(walletCards)
          .values({
            userId: ctx.user.id,
            cardId: input.cardId,
            type: input.type,
            title: input.title,
            description: input.description,
            logoUrl: input.logoUrl,
            backgroundColor: input.backgroundColor,
            textColor: input.textColor,
            accentColor: input.accentColor,
            barcode: input.barcode,
            barcodeFormat: input.barcodeFormat,
            expiryDate: input.expiryDate,
            points: input.points,
            balance: input.balance,
          })
          .returning();

        return result[0];
      }
    }),

  /**
   * Get wallet card for a specific card
   */
  get: protectedProcedure
    .input(z.object({ cardId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const result = await db
        .select()
        .from(walletCards)
        .where(
          and(
            eq(walletCards.userId, ctx.user.id),
            eq(walletCards.cardId, input.cardId)
          )
        );

      return result[0] || null;
    }),

  /**
   * List all wallet cards for user
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const result = await db
        .select()
        .from(walletCards)
        .where(eq(walletCards.userId, ctx.user.id))
        .limit(input.limit)
        .offset(input.offset);

      return result;
    }),

  /**
   * Delete wallet card
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Verify ownership
      const card = await db
        .select()
        .from(walletCards)
        .where(eq(walletCards.id, input.id));

      if (!card.length || card[0].userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this wallet card",
        });
      }

      await db.delete(walletCards).where(eq(walletCards.id, input.id));

      return { success: true };
    }),

  /**
   * Generate Apple Wallet pass (.pkpass file)
   */
  generateApplePass: protectedProcedure
    .input(z.object({ cardId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const walletCard = await db
        .select()
        .from(walletCards)
        .where(
          and(
            eq(walletCards.userId, ctx.user.id),
            eq(walletCards.cardId, input.cardId)
          )
        );

      if (!walletCard.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Wallet card not found",
        });
      }

      // Validate certificates exist
      if (!validateCertificates()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "PKPass certificates not configured",
        });
      }

      // Generate PKPass
      const card = walletCard[0];
      const pkpassBuffer = await generatePKPass(input.cardId, {
        title: card.title,
        description: card.description || undefined,
        backgroundColor: card.backgroundColor,
        textColor: card.textColor,
        accentColor: card.accentColor,
        barcode: card.barcode || undefined,
        barcodeFormat: (card.barcodeFormat as "QR" | "CODE128" | "PDF417") || "QR",
        points: card.points || undefined,
        balance: card.balance || undefined,
        expiryDate: card.expiryDate || undefined,
        logoUrl: card.logoUrl || undefined,
      });

      return {
        url: `/api/wallet/apple-pass/${input.cardId}`,
        filename: `${card.title}.pkpass`,
        size: pkpassBuffer.length,
      };
    }),

  /**
   * Generate Google Wallet pass
   */
  generateGooglePass: protectedProcedure
    .input(z.object({ cardId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const walletCard = await db
        .select()
        .from(walletCards)
        .where(
          and(
            eq(walletCards.userId, ctx.user.id),
            eq(walletCards.cardId, input.cardId)
          )
        );

      if (!walletCard.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Wallet card not found",
        });
      }

      // Generate Google Wallet JWT
      const card = walletCard[0];
      const jwtToken = await generateGoogleWalletJWT({
        title: card.title,
        description: card.description || undefined,
        cardId: input.cardId,
        backgroundColor: card.backgroundColor,
        textColor: card.textColor,
        accentColor: card.accentColor,
        logoUrl: card.logoUrl || undefined,
        points: card.points || undefined,
        balance: card.balance || undefined,
      });

      const saveUrl = createGoogleWalletSaveUrl(jwtToken);

      return {
        url: saveUrl,
        jwt: jwtToken,
      };
    }),
});
