import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { digitalCards, InsertDigitalCard } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { storagePut } from "./storage";

export const cardRouter = router({
  // Get all cards for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    return db
      .select()
      .from(digitalCards)
      .where(eq(digitalCards.userId, ctx.user.id));
  }),

  // Get a specific card by cardId
  getById: protectedProcedure
    .input(z.object({ cardId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db
        .select()
        .from(digitalCards)
        .where(
          and(
            eq(digitalCards.cardId, input.cardId),
            eq(digitalCards.userId, ctx.user.id)
          )
        )
        .limit(1);
      return result[0] || null;
    }),

  // Get the primary card for the current user
  getPrimary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const result = await db
      .select()
      .from(digitalCards)
      .where(
        and(
          eq(digitalCards.userId, ctx.user.id),
          eq(digitalCards.isPrimary, 1)
        )
      )
      .limit(1);
    return result[0] || null;
  }),

  // Create a new card
  create: protectedProcedure
    .input(
      z.object({
        cardId: z.string(),
        name: z.string(),
        title: z.string().optional(),
        company: z.string().optional(),
        email: z.string().email(),
        phone: z.string().optional(),
        linkedin: z.string().optional(),
        website: z.string().optional(),
        bio: z.string().optional(),
        profileImage: z.string().optional(),
        cardStyle: z.any().optional(),
        socialLinks: z.any().optional(),
        cardType: z.string().default("professional"),
        isPrimary: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const cardData: InsertDigitalCard = {
        userId: ctx.user.id,
        cardId: input.cardId,
        name: input.name,
        title: input.title || null,
        company: input.company || null,
        email: input.email,
        phone: input.phone || null,
        linkedin: input.linkedin || null,
        website: input.website || null,
        bio: input.bio || null,
        profileImage: input.profileImage || null,
        cardStyle: input.cardStyle ? JSON.stringify(input.cardStyle) : null,
        socialLinks: input.socialLinks ? JSON.stringify(input.socialLinks) : null,
        cardType: input.cardType,
        isPrimary: input.isPrimary ? 1 : 0,
      };
      
      try {
        return await db.insert(digitalCards).values(cardData);
      } catch (error: any) {
        console.error("Card insert error:", error);
        throw error;
      }
    }),

  // Update an existing card
  update: protectedProcedure
    .input(
      z.object({
        cardId: z.string(),
        name: z.string().optional(),
        title: z.string().optional(),
        company: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        linkedin: z.string().optional(),
        website: z.string().optional(),
        bio: z.string().optional(),
        profileImage: z.string().optional(),
        cardStyle: z.any().optional(),
        socialLinks: z.any().optional(),
        cardType: z.string().optional(),
        isPrimary: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { cardId, ...updateData } = input;

      // Build update object, converting objects to JSON strings
      const updateObj: Partial<InsertDigitalCard> = {};
      if (updateData.name !== undefined) updateObj.name = updateData.name;
      if (updateData.title !== undefined) updateObj.title = updateData.title;
      if (updateData.company !== undefined) updateObj.company = updateData.company;
      if (updateData.email !== undefined) updateObj.email = updateData.email;
      if (updateData.phone !== undefined) updateObj.phone = updateData.phone;
      if (updateData.linkedin !== undefined) updateObj.linkedin = updateData.linkedin;
      if (updateData.website !== undefined) updateObj.website = updateData.website;
      if (updateData.bio !== undefined) updateObj.bio = updateData.bio;
      if (updateData.profileImage !== undefined) updateObj.profileImage = updateData.profileImage;
      if (updateData.cardStyle !== undefined)
        updateObj.cardStyle = JSON.stringify(updateData.cardStyle);
      if (updateData.socialLinks !== undefined)
        updateObj.socialLinks = JSON.stringify(updateData.socialLinks);
      if (updateData.cardType !== undefined) updateObj.cardType = updateData.cardType;
      if (updateData.isPrimary !== undefined) updateObj.isPrimary = updateData.isPrimary ? 1 : 0;

      return db
        .update(digitalCards)
        .set(updateObj)
        .where(
          and(
            eq(digitalCards.cardId, cardId),
            eq(digitalCards.userId, ctx.user.id)
          )
        );
    }),

  // Delete a card
  delete: protectedProcedure
    .input(z.object({ cardId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return db
        .delete(digitalCards)
        .where(
          and(
            eq(digitalCards.cardId, input.cardId),
            eq(digitalCards.userId, ctx.user.id)
          )
        );
    }),

  // Set a card as primary
  setPrimary: protectedProcedure
    .input(z.object({ cardId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // First, unset all other cards as primary
      await db
        .update(digitalCards)
        .set({ isPrimary: 0 })
        .where(eq(digitalCards.userId, ctx.user.id));

      // Then set the specified card as primary
      return db
        .update(digitalCards)
        .set({ isPrimary: 1 })
        .where(
          and(
            eq(digitalCards.cardId, input.cardId),
            eq(digitalCards.userId, ctx.user.id)
          )
        );
    }),

  // Upload background image to S3
  uploadBackgroundImage: protectedProcedure
    .input(
      z.object({
        cardId: z.string(),
        fileBuffer: z.string(), // Base64 encoded file
        fileName: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify card belongs to user
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const card = await db
        .select()
        .from(digitalCards)
        .where(
          and(
            eq(digitalCards.cardId, input.cardId),
            eq(digitalCards.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!card[0]) {
        throw new Error("Card not found or unauthorized");
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(input.fileBuffer, "base64");

      // Upload to S3
      const storageKey = `background-images/${ctx.user.id}/${input.cardId}/${input.fileName}`;
      const { url } = await storagePut(storageKey, buffer, input.mimeType);

      // Update card with new background image URL
      const currentCardStyle = card[0].cardStyle ? JSON.parse(card[0].cardStyle) : {};
      const updatedCardStyle = {
        ...currentCardStyle,
        backgroundType: "image",
        backgroundImageUrl: url,
        backgroundImageOpacity: 1,
        backgroundImagePosition: "cover",
        backgroundImageOverlay: "#000000",
        backgroundImageOverlayOpacity: 0.3,
      };

      await db
        .update(digitalCards)
        .set({ cardStyle: JSON.stringify(updatedCardStyle) })
        .where(
          and(
            eq(digitalCards.cardId, input.cardId),
            eq(digitalCards.userId, ctx.user.id)
          )
        );

      return { url, success: true };
    }),

  // Upload profile image to S3
  uploadProfileImage: protectedProcedure
    .input(
      z.object({
        cardId: z.string(),
        fileBuffer: z.string(), // Base64 encoded file
        fileName: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify card belongs to user
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const card = await db
        .select()
        .from(digitalCards)
        .where(
          and(
            eq(digitalCards.cardId, input.cardId),
            eq(digitalCards.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!card[0]) {
        throw new Error("Card not found or unauthorized");
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(input.fileBuffer, "base64");

      // Upload to S3
      const storageKey = `profile-images/${ctx.user.id}/${input.cardId}/${input.fileName}`;
      const { url } = await storagePut(storageKey, buffer, input.mimeType);

      // Update card with new image URL
      await db
        .update(digitalCards)
        .set({ profileImage: url })
        .where(
          and(
            eq(digitalCards.cardId, input.cardId),
            eq(digitalCards.userId, ctx.user.id)
          )
        );

      return { url, success: true };
    }),
});
