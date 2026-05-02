import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { digitalCards, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Card Router - Database Operations", () => {
  let db: any;
  let testUserId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Create a test user
    const openId = `test-user-${Date.now()}`;
    await db.insert(users).values({
      openId: openId,
      name: "Test User",
      email: "test@example.com",
      loginMethod: "test",
      role: "user",
    });
    
    // Get the inserted user ID
    const insertedUsers = await db
      .select()
      .from(users)
      .where(eq(users.openId, openId))
      .limit(1);
    
    testUserId = insertedUsers[0]?.id;
    if (!testUserId) {
      throw new Error("Failed to create test user");
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (db && testUserId) {
      await db.delete(digitalCards).where(eq(digitalCards.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("should create a card successfully", async () => {
    const cardId = `test-card-${Date.now()}`;
    
    const result = await db.insert(digitalCards).values({
      userId: testUserId,
      cardId: cardId,
      name: "Test Card",
      email: "card@example.com",
      isPrimary: 1,
    });

    expect(result).toBeDefined();

    // Verify the card was created
    const cards = await db
      .select()
      .from(digitalCards)
      .where(
        and(
          eq(digitalCards.userId, testUserId),
          eq(digitalCards.cardId, cardId)
        )
      );

    expect(cards.length).toBeGreaterThan(0);
    expect(cards[0].name).toBe("Test Card");
  });

  it("should prevent duplicate (userId, cardId) combinations", async () => {
    const cardId = `duplicate-test-${Date.now()}`;
    
    // Create first card
    await db.insert(digitalCards).values({
      userId: testUserId,
      cardId: cardId,
      name: "First Card",
      email: "first@example.com",
      isPrimary: 0,
    });

    // Try to create duplicate - should fail
    let errorThrown = false;
    try {
      await db.insert(digitalCards).values({
        userId: testUserId,
        cardId: cardId,
        name: "Duplicate Card",
        email: "duplicate@example.com",
        isPrimary: 0,
      });
    } catch (error: any) {
      // Expected to fail with duplicate constraint error
      errorThrown = true;
    }
    
    expect(errorThrown).toBe(true);
  });

  it("should update an existing card", async () => {
    const cardId = `update-test-${Date.now()}`;
    
    // Create card
    await db.insert(digitalCards).values({
      userId: testUserId,
      cardId: cardId,
      name: "Original Name",
      email: "original@example.com",
      title: "Original Title",
      isPrimary: 0,
    });

    // Update card
    await db
      .update(digitalCards)
      .set({
        name: "Updated Name",
        title: "Updated Title",
      })
      .where(
        and(
          eq(digitalCards.userId, testUserId),
          eq(digitalCards.cardId, cardId)
        )
      );

    // Verify update
    const cards = await db
      .select()
      .from(digitalCards)
      .where(
        and(
          eq(digitalCards.userId, testUserId),
          eq(digitalCards.cardId, cardId)
        )
      );

    expect(cards[0].name).toBe("Updated Name");
    expect(cards[0].title).toBe("Updated Title");
  });

  it("should delete a card", async () => {
    const cardId = `delete-test-${Date.now()}`;
    
    // Create card
    await db.insert(digitalCards).values({
      userId: testUserId,
      cardId: cardId,
      name: "Card to Delete",
      email: "delete@example.com",
      isPrimary: 0,
    });

    // Delete card
    await db
      .delete(digitalCards)
      .where(
        and(
          eq(digitalCards.userId, testUserId),
          eq(digitalCards.cardId, cardId)
        )
      );

    // Verify deletion
    const cards = await db
      .select()
      .from(digitalCards)
      .where(
        and(
          eq(digitalCards.userId, testUserId),
          eq(digitalCards.cardId, cardId)
        )
      );

    expect(cards.length).toBe(0);
  });
});
