import { useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CardCollection, Card } from "@/lib/cardManager";

export function useCardPersistence(
  cardCollection: CardCollection | null,
  onCardsLoaded: (collection: CardCollection) => void
) {
  const { isAuthenticated } = useAuth();
  const { data: serverCards, isLoading: cardsLoading } = trpc.cards.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const updateCardMutation = trpc.cards.update.useMutation();
  const createCardMutation = trpc.cards.create.useMutation();

  // Load cards from server on first auth
  useEffect(() => {
    if (!isAuthenticated || cardsLoading || !serverCards) return;

    if (serverCards.length === 0) {
      // No cards on server, create the current card
      if (cardCollection) {
        const activeCard = cardCollection.cards.find(
          (c) => c.id === cardCollection.activeCardId
        );
        if (activeCard && !activeCard.id.startsWith("temp-")) {
          createCardMutation.mutate({
            cardId: activeCard.id,
            name: activeCard.data.name,
            title: activeCard.data.title,
            company: activeCard.data.company,
            email: activeCard.data.email,
            phone: activeCard.data.phone,
            linkedin: activeCard.data.linkedin,
            website: activeCard.data.website,
            bio: activeCard.data.bio,
            profileImage: activeCard.data.profileImage,
            cardStyle: activeCard.data.cardStyle,
            socialLinks: activeCard.data.socialLinks,
            isPrimary: true,
          });
        }
      }
    } else {
      // Convert server cards to CardCollection format and load
      const cards: Card[] = serverCards.map((card) => ({
        id: card.cardId,
        name: card.name,
        purpose: card.cardType,
        data: {
          name: card.name,
          title: card.title || "",
          company: card.company || "",
          email: card.email,
          phone: card.phone || "",
          linkedin: card.linkedin || "",
          website: card.website || "",
          bio: card.bio || "",
          profileImage: card.profileImage || "",
          cardStyle: card.cardStyle ? JSON.parse(card.cardStyle) : {},
          socialLinks: card.socialLinks ? JSON.parse(card.socialLinks) : [],
        },
        createdAt: new Date(card.createdAt).getTime(),
        updatedAt: new Date(card.updatedAt).getTime(),
        isPrimary: card.isPrimary === 1,
      }));

      const primaryCard = serverCards.find((c) => c.isPrimary);
      onCardsLoaded({
        cards,
        activeCardId: primaryCard?.cardId || cards[0]?.id || "",
      });
    }
  }, [isAuthenticated, serverCards, cardsLoading]);

  // Save card to server when it changes
  const saveCardToServer = useCallback(
    (collection: CardCollection) => {
      if (!isAuthenticated) return;

      const activeCard = collection.cards.find((c) => c.id === collection.activeCardId);
      if (!activeCard) return;

      // Check if card exists on server
      const existsOnServer = serverCards?.some((c) => c.cardId === activeCard.id);

      if (existsOnServer) {
        updateCardMutation.mutate({
          cardId: activeCard.id,
          name: activeCard.data.name,
          title: activeCard.data.title,
          company: activeCard.data.company,
          email: activeCard.data.email,
          phone: activeCard.data.phone,
          linkedin: activeCard.data.linkedin,
          website: activeCard.data.website,
          bio: activeCard.data.bio,
          profileImage: activeCard.data.profileImage,
          cardStyle: activeCard.data.cardStyle,
          socialLinks: activeCard.data.socialLinks,
        });
      } else if (!activeCard.id.startsWith("temp-")) {
        createCardMutation.mutate({
          cardId: activeCard.id,
          name: activeCard.data.name,
          title: activeCard.data.title,
          company: activeCard.data.company,
          email: activeCard.data.email,
          phone: activeCard.data.phone,
          linkedin: activeCard.data.linkedin,
          website: activeCard.data.website,
          bio: activeCard.data.bio,
          profileImage: activeCard.data.profileImage,
          cardStyle: activeCard.data.cardStyle,
          socialLinks: activeCard.data.socialLinks,
          isPrimary: true,
        });
      }
    },
    [isAuthenticated, serverCards, updateCardMutation, createCardMutation]
  );

  return { saveCardToServer, cardsLoading };
}
