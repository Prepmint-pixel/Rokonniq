import { ContactData, CardStyle, SocialLink } from "@/components/CustomizationPanel";

export interface Card {
  id: string;
  name: string;
  purpose: string;
  description?: string;
  data: ContactData;
  createdAt: number;
  updatedAt: number;
  isPrimary: boolean;
}

export interface CardCollection {
  cards: Card[];
  activeCardId: string;
}

const STORAGE_KEY = "contactCards";
const ACTIVE_CARD_KEY = "activeCardId";

// Default card template
const createDefaultCard = (name: string, purpose: string): Card => {
  const DEFAULT_PROFILE_IMAGE =
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663330078692/TQa7FTf9yrF5GSDptm9S4c/profile-placeholder-NaBe9owkGZ9ozdbrALSiiV.webp";

  return {
    id: generateCardId(),
    name,
    purpose,
    description: "",
    data: {
      name: "Your Name",
      title: "Your Title",
      email: "email@example.com",
      phone: "+1 (555) 123-4567",
      linkedin: "https://linkedin.com/in/yourprofile",
      profileImage: DEFAULT_PROFILE_IMAGE,
      website: "",
      bio: "",
      socialLinks: [],
      cardStyle: {
        backgroundType: "solid",
        headerColor: "#0f172a",
        buttonStyle: "rounded",
        frameStyle: "glassmorphism",
        accentColor: "#3b82f6",
        titleFont: "Arial",
        titleSize: 28,
        textFont: "Arial",
        textColor: "#1f2937",
        showBranding: true,
      }
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPrimary: false,
  };
};

// Generate unique card ID
export const generateCardId = (): string => {
  return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Load all cards from localStorage
export const loadCards = (): CardCollection => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const activeCardId = localStorage.getItem(ACTIVE_CARD_KEY);

    if (!stored) {
      // Create default card if none exist
      const defaultCard = createDefaultCard("Primary Card", "professional");
      defaultCard.isPrimary = true;
      const collection: CardCollection = {
        cards: [defaultCard],
        activeCardId: defaultCard.id,
      };
      saveCards(collection);
      return collection;
    }

    const cards: Card[] = JSON.parse(stored);
    const validActiveId =
      activeCardId && cards.some((c) => c.id === activeCardId)
        ? activeCardId
        : cards[0]?.id || "";

    return {
      cards,
      activeCardId: validActiveId,
    };
  } catch (error) {
    console.error("Error loading cards:", error);
    const defaultCard = createDefaultCard("Primary Card", "professional");
    defaultCard.isPrimary = true;
    return {
      cards: [defaultCard],
      activeCardId: defaultCard.id,
    };
  }
};

// Save all cards to localStorage
export const saveCards = (collection: CardCollection): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collection.cards));
    localStorage.setItem(ACTIVE_CARD_KEY, collection.activeCardId);
  } catch (error) {
    console.error("Error saving cards:", error);
  }
};

// Get active card
export const getActiveCard = (collection: CardCollection): Card | undefined => {
  return collection.cards.find((c) => c.id === collection.activeCardId);
};

// Create new card
export const createCard = (
  collection: CardCollection,
  name: string,
  purpose: string,
  description?: string
): CardCollection => {
  const newCard = createDefaultCard(name, purpose);
  if (description) {
    newCard.description = description;
  }

  return {
    ...collection,
    cards: [...collection.cards, newCard],
    activeCardId: newCard.id,
  };
};

// Update card
export const updateCard = (
  collection: CardCollection,
  cardId: string,
  updates: Partial<Card>
): CardCollection => {
  return {
    ...collection,
    cards: collection.cards.map((card) =>
      card.id === cardId
        ? {
            ...card,
            ...updates,
            updatedAt: Date.now(),
          }
        : card
    ),
  };
};

// Update card data
export const updateCardData = (
  collection: CardCollection,
  cardId: string,
  data: ContactData
): CardCollection => {
  return updateCard(collection, cardId, { data });
};

// Delete card
export const deleteCard = (
  collection: CardCollection,
  cardId: string
): CardCollection => {
  const remainingCards = collection.cards.filter((c) => c.id !== cardId);

  if (remainingCards.length === 0) {
    const defaultCard = createDefaultCard("Primary Card", "professional");
    defaultCard.isPrimary = true;
    return {
      cards: [defaultCard],
      activeCardId: defaultCard.id,
    };
  }

  const newActiveId =
    collection.activeCardId === cardId
      ? remainingCards[0].id
      : collection.activeCardId;

  return {
    cards: remainingCards,
    activeCardId: newActiveId,
  };
};

// Switch active card
export const switchCard = (
  collection: CardCollection,
  cardId: string
): CardCollection => {
  if (collection.cards.some((c) => c.id === cardId)) {
    return {
      ...collection,
      activeCardId: cardId,
    };
  }
  return collection;
};

// Duplicate card
export const duplicateCard = (
  collection: CardCollection,
  cardId: string
): CardCollection => {
  const cardToDuplicate = collection.cards.find((c) => c.id === cardId);
  if (!cardToDuplicate) {
    return collection;
  }

  const newCard: Card = {
    ...cardToDuplicate,
    id: generateCardId(),
    name: `${cardToDuplicate.name} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPrimary: false,
  };

  return {
    ...collection,
    cards: [...collection.cards, newCard],
    activeCardId: newCard.id,
  };
};

// Set primary card
export const setPrimaryCard = (
  collection: CardCollection,
  cardId: string
): CardCollection => {
  return {
    ...collection,
    cards: collection.cards.map((card) => ({
      ...card,
      isPrimary: card.id === cardId,
    })),
  };
};

// Get cards by purpose
export const getCardsByPurpose = (
  collection: CardCollection,
  purpose: string
): Card[] => {
  return collection.cards.filter((c) => c.purpose === purpose);
};

// Get all purposes
export const getAllPurposes = (collection: CardCollection): string[] => {
  const purposes = new Set(collection.cards.map((c) => c.purpose));
  return Array.from(purposes);
};

// Export card as JSON
export const exportCard = (card: Card): string => {
  return JSON.stringify(card, null, 2);
};

// Import card from JSON
export const importCard = (
  collection: CardCollection,
  jsonString: string
): CardCollection => {
  try {
    const importedCard: Card = JSON.parse(jsonString);
    // Generate new ID to avoid conflicts
    importedCard.id = generateCardId();
    importedCard.createdAt = Date.now();
    importedCard.updatedAt = Date.now();
    importedCard.isPrimary = false;

    return {
      ...collection,
      cards: [...collection.cards, importedCard],
      activeCardId: importedCard.id,
    };
  } catch (error) {
    console.error("Error importing card:", error);
    return collection;
  }
};
