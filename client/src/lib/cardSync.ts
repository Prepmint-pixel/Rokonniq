import { CardCollection } from "./cardManager";

/**
 * Export card data as JSON file for cross-device sync
 */
export const exportCardData = (cardCollection: CardCollection): void => {
  const dataToExport = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    cardCollection,
  };

  const dataStr = JSON.stringify(dataToExport, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `contact-cards-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Import card data from JSON file
 */
export const importCardData = (file: File): Promise<CardCollection> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Validate the imported data structure
        if (!parsed.cardCollection || !Array.isArray(parsed.cardCollection.cards)) {
          throw new Error("Invalid card data format");
        }

        resolve(parsed.cardCollection as CardCollection);
      } catch (error) {
        reject(new Error(`Failed to import card data: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
};

/**
 * Generate a shareable link for card data (using data URL)
 * Note: Limited by browser URL length (~2000 chars), suitable for small datasets
 */
export const generateShareLink = (cardCollection: CardCollection): string => {
  const dataStr = JSON.stringify(cardCollection);
  const encoded = btoa(unescape(encodeURIComponent(dataStr)));
  const baseUrl = window.location.origin;
  return `${baseUrl}?cardData=${encoded}`;
};

/**
 * Parse card data from URL parameter
 */
export const parseCardDataFromUrl = (): CardCollection | null => {
  const params = new URLSearchParams(window.location.search);
  const cardData = params.get("cardData");

  if (!cardData) return null;

  try {
    const decoded = decodeURIComponent(escape(atob(cardData)));
    return JSON.parse(decoded) as CardCollection;
  } catch (error) {
    console.error("Failed to parse card data from URL:", error);
    return null;
  }
};

/**
 * Merge imported cards with existing cards (avoiding duplicates)
 */
export const mergeCardCollections = (
  existing: CardCollection,
  imported: CardCollection
): CardCollection => {
  const existingCardIds = new Set(existing.cards.map((c) => c.id));
  const newCards = imported.cards.filter((c) => !existingCardIds.has(c.id));

  return {
    ...existing,
    cards: [...existing.cards, ...newCards],
  };
};
