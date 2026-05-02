import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { walletCards } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import sharp from "sharp";

/**
 * Logo upload router for wallet passes
 */
export const logoUploadRouter = router({
  /**
   * Upload logo for wallet card
   */
  uploadLogo: protectedProcedure
    .input(
      z.object({
        cardId: z.string().min(1),
        file: z.instanceof(Buffer),
        filename: z.string().min(1),
        mimeType: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // Validate file size (max 5MB)
      if (input.file.length > 5 * 1024 * 1024) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File size exceeds 5MB limit",
        });
      }

      // Validate MIME type
      const allowedMimeTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
      if (!allowedMimeTypes.includes(input.mimeType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid file type. Allowed: ${allowedMimeTypes.join(", ")}`,
        });
      }

      try {
        // Process image: convert to PNG and resize to 1024x1024
        let processedBuffer = input.file;

        if (input.mimeType !== "image/svg+xml") {
          // Use sharp to process image
          processedBuffer = await sharp(input.file)
            .png()
            .resize(1024, 1024, {
              fit: "contain",
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .toBuffer();
        }

        // Upload to S3
        const fileKey = `wallet-logos/${userId}/${Date.now()}-${input.filename}`;
        const { url } = await storagePut(fileKey, processedBuffer, "image/png");

        // Update wallet card with logo URL
        const db = getDb() as any;
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
              eq(walletCards.userId, userId),
              eq(walletCards.cardId, input.cardId)
            )
          );

        if (!walletCard.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Wallet card not found",
          });
        }

        // Update the wallet card with new logo URL
        await db
          .update(walletCards)
          .set({ logoUrl: url })
          .where(eq(walletCards.id, walletCard[0].id));

        return {
          success: true,
          url,
          fileKey,
          message: "Logo uploaded successfully",
        };
      } catch (error) {
        console.error("Error uploading logo:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to upload logo",
        });
      }
    }),

  /**
   * Get logo URL for wallet card
   */
  getLogoUrl: protectedProcedure
    .input(z.object({ cardId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const db = getDb() as any;
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
            eq(walletCards.userId, userId),
            eq(walletCards.cardId, input.cardId)
          )
        );

      if (!walletCard.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Wallet card not found",
        });
      }

      return {
        logoUrl: walletCard[0].logoUrl || null,
        hasLogo: !!walletCard[0].logoUrl,
      };
    }),

  /**
   * Delete logo from wallet card
   */
  deleteLogo: protectedProcedure
    .input(z.object({ cardId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const db = getDb() as any;
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
            eq(walletCards.userId, userId),
            eq(walletCards.cardId, input.cardId)
          )
        );

      if (!walletCard.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Wallet card not found",
        });
      }

      // Clear logo URL
      await db
        .update(walletCards)
        .set({ logoUrl: null })
        .where(eq(walletCards.id, walletCard[0].id));

      return {
        success: true,
        message: "Logo deleted successfully",
      };
    }),
});
