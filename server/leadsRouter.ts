import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { capturedContacts, digitalCards } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const leadsRouter = router({
  /**
   * Capture a new lead from a card visitor
   * Public endpoint - no authentication required
   */
  capture: publicProcedure
    .input(
      z.object({
        cardId: z.string().min(1),
        firstName: z.string().min(1).max(255),
        lastName: z.string().max(255).optional(),
        email: z.string().email().max(320),
        phone: z.string().max(20).optional(),
        company: z.string().max(255).optional(),
        position: z.string().max(255).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Get the card to find the owner
      const card = await db
        .select()
        .from(digitalCards)
        .where(eq(digitalCards.cardId, input.cardId))
        .limit(1);

      if (!card || card.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Card not found",
        });
      }

      const userId = card[0].userId;

      // Create the captured contact
      await db.insert(capturedContacts).values({
        userId,
        cardId: input.cardId,
        firstName: input.firstName,
        lastName: input.lastName || null,
        email: input.email,
        phone: input.phone || null,
        company: input.company || null,
        position: input.position || null,
        notes: input.notes || null,
        source: "card_form",
      });

      return {
        success: true,
        message: "Lead captured successfully",
      };
    }),

  /**
   * Get all captured leads for a user
   */
  list: protectedProcedure
    .input(
      z.object({
        cardId: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      let query = db
        .select()
        .from(capturedContacts)
        .where(eq(capturedContacts.userId, ctx.user.id)) as any;

      if (input.cardId) {
        query = query.where(eq(capturedContacts.cardId, input.cardId));
      }

      const contacts = await query
        .orderBy(desc(capturedContacts.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return contacts;
    }),

  /**
   * Get a single captured lead
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const contact = await db
        .select()
        .from(capturedContacts)
        .where(
          and(
            eq(capturedContacts.id, input.id),
            eq(capturedContacts.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!contact || contact.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contact not found",
        });
      }

      return contact[0];
    }),

  /**
   * Delete a captured lead
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Verify ownership
      const contact = await db
        .select()
        .from(capturedContacts)
        .where(
          and(
            eq(capturedContacts.id, input.id),
            eq(capturedContacts.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!contact || contact.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contact not found",
        });
      }

      await db
        .delete(capturedContacts)
        .where(eq(capturedContacts.id, input.id));

      return { success: true };
    }),

  /**
   * Export leads as CSV
   */
  exportCsv: protectedProcedure
    .input(
      z.object({
        cardId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      let query = db
        .select()
        .from(capturedContacts)
        .where(eq(capturedContacts.userId, ctx.user.id)) as any;

      if (input.cardId) {
        query = query.where(eq(capturedContacts.cardId, input.cardId));
      }

      const contacts = await query.orderBy(
        desc(capturedContacts.createdAt)
      );

      // Generate CSV
      const headers = [
        "First Name",
        "Last Name",
        "Email",
        "Phone",
        "Company",
        "Position",
        "Notes",
        "Captured At",
      ];
      const rows = contacts.map((c: any) => [
        c.firstName,
        c.lastName || "",
        c.email,
        c.phone || "",
        c.company || "",
        c.position || "",
        c.notes || "",
        c.createdAt?.toISOString() || "",
      ]);

      const csv =
        [headers, ...rows]
          .map((row: any) => row.map((cell: any) => `"${cell}"`).join(","))
          .join("\n") + "\n";

      return {
        csv,
        filename: `leads-${new Date().toISOString().split("T")[0]}.csv`,
      };
    }),

  /**
   * Get lead statistics
   */
  stats: protectedProcedure
    .input(
      z.object({
        cardId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      let query = db
        .select()
        .from(capturedContacts)
        .where(eq(capturedContacts.userId, ctx.user.id)) as any;

      if (input.cardId) {
        query = query.where(eq(capturedContacts.cardId, input.cardId));
      }

      const contacts = await query;

      return {
        total: contacts.length,
        byCard: contacts.reduce(
          (acc: Record<string, number>, c: any) => {
            acc[c.cardId] = (acc[c.cardId] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      };
    }),
});
