import { Card } from "./cardManager";

/**
 * Card Sharing Utilities
 * Handles generation of unique shareable links and card encoding for public sharing
 */

// Generate a unique share token for a card
export const generateShareToken = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// Generate a shareable URL for a card
export const generateShareUrl = (cardId: string, shareToken?: string): string => {
  const baseUrl = window.location.origin;
  const token = shareToken || generateShareToken();
  return `${baseUrl}/share/${token}`;
};

// Encode card data for URL sharing
export const encodeCardData = (card: Card): string => {
  try {
    const encoded = btoa(JSON.stringify(card));
    return encoded;
  } catch (error) {
    console.error("Error encoding card data:", error);
    return "";
  }
};

// Decode card data from URL (returns ContactData, not Card)
export const decodeCardData = (encoded: string): any | null => {
  try {
    const decoded = atob(encoded);
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Error decoding card data:", error);
    return null;
  }
};

// Create a shareable link with embedded card data
export const createEmbeddedShareLink = (card: Card): string => {
  const baseUrl = window.location.origin;
  // Encode only the card data (contactData), not the card wrapper
  const encoded = btoa(JSON.stringify(card.data));
  return `${baseUrl}/view?card=${encoded}`;
};

// Generate social media share URLs
export const generateSocialShareUrls = (
  cardName: string,
  shareUrl: string
) => {
  const text = `Check out my digital contact card: ${cardName}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(text);

  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    email: `mailto:?subject=Check out my contact card&body=${encodedText}%0A${shareUrl}`,
  };
};

// Store share metadata locally
export interface ShareMetadata {
  cardId: string;
  shareToken: string;
  shareUrl: string;
  createdAt: number;
  viewCount: number;
  lastViewedAt?: number;
}

const SHARE_METADATA_KEY = "cardShareMetadata";

export const saveShareMetadata = (metadata: ShareMetadata[]): void => {
  try {
    localStorage.setItem(SHARE_METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error("Error saving share metadata:", error);
  }
};

export const loadShareMetadata = (): ShareMetadata[] => {
  try {
    const stored = localStorage.getItem(SHARE_METADATA_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading share metadata:", error);
    return [];
  }
};

export const getShareMetadataForCard = (cardId: string): ShareMetadata | undefined => {
  const metadata = loadShareMetadata();
  return metadata.find((m) => m.cardId === cardId);
};

export const updateShareMetadata = (
  cardId: string,
  updates: Partial<ShareMetadata>
): void => {
  const metadata = loadShareMetadata();
  const index = metadata.findIndex((m) => m.cardId === cardId);

  if (index !== -1) {
    metadata[index] = { ...metadata[index], ...updates };
  } else {
    const newMetadata: ShareMetadata = {
      cardId,
      shareToken: generateShareToken(),
      shareUrl: generateShareUrl(cardId),
      createdAt: Date.now(),
      viewCount: 0,
      ...updates,
    };
    metadata.push(newMetadata);
  }

  saveShareMetadata(metadata);
};

export const incrementViewCount = (cardId: string): void => {
  const metadata = loadShareMetadata();
  const index = metadata.findIndex((m) => m.cardId === cardId);

  if (index !== -1) {
    metadata[index].viewCount += 1;
    metadata[index].lastViewedAt = Date.now();
    saveShareMetadata(metadata);
  }
};

export const getShareStats = (cardId: string) => {
  const metadata = getShareMetadataForCard(cardId);
  if (!metadata) {
    return {
      viewCount: 0,
      lastViewedAt: null,
      shareUrl: null,
    };
  }

  return {
    viewCount: metadata.viewCount,
    lastViewedAt: metadata.lastViewedAt
      ? new Date(metadata.lastViewedAt).toLocaleDateString()
      : "Never",
    shareUrl: metadata.shareUrl,
  };
};

// Generate a QR code URL for the share link
export const generateQRCodeUrl = (shareUrl: string): string => {
  const encodedUrl = encodeURIComponent(shareUrl);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;
};
