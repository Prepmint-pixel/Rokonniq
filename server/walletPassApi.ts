import { Router, Request, Response } from "express";
import { getDb } from "./db";
import { walletCards } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { generatePKPass, validateCertificates } from "./pkpass";

const router = Router();

/**
 * Download Apple Wallet pass (.pkpass file)
 * GET /api/wallet/apple-pass/:cardId
 */
router.get("/apple-pass/:cardId", async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate certificates
    if (!validateCertificates()) {
      return res.status(500).json({ error: "PKPass certificates not configured" });
    }

    // Get wallet card from database
    const db = getDb() as any;
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const walletCard = await db
      .select()
      .from(walletCards)
      .where(
        and(
          eq(walletCards.userId, userId),
          eq(walletCards.cardId, cardId)
        )
      );

    if (!walletCard.length) {
      return res.status(404).json({ error: "Wallet card not found" });
    }

    const card = walletCard[0];

    // Generate PKPass
    const pkpassBuffer = await generatePKPass(cardId, {
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
    });

    // Send file
    res.setHeader("Content-Type", "application/vnd.apple.pkpass");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${card.title}.pkpass"`
    );
    res.setHeader("Content-Length", pkpassBuffer.length);
    res.send(pkpassBuffer);
  } catch (error) {
    console.error("Error downloading PKPass:", error);
    res.status(500).json({
      error: "Failed to generate PKPass",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Get PKPass info (metadata without downloading)
 * GET /api/wallet/apple-pass/:cardId/info
 */
router.get("/apple-pass/:cardId/info", async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get wallet card from database
    const db = getDb() as any;
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const walletCard = await db
      .select()
      .from(walletCards)
      .where(
        and(
          eq(walletCards.userId, userId),
          eq(walletCards.cardId, cardId)
        )
      );

    if (!walletCard.length) {
      return res.status(404).json({ error: "Wallet card not found" });
    }

    const card = walletCard[0];

    res.json({
      id: card.id,
      cardId: card.cardId,
      title: card.title,
      type: card.type,
      description: card.description,
      backgroundColor: card.backgroundColor,
      textColor: card.textColor,
      accentColor: card.accentColor,
      points: card.points,
      balance: card.balance,
      expiryDate: card.expiryDate,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    });
  } catch (error) {
    console.error("Error getting PKPass info:", error);
    res.status(500).json({
      error: "Failed to get PKPass info",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
