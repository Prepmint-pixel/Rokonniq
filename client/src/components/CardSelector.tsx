import { Button } from "@/components/ui/button";
import { Plus, Trash2, Copy, Star } from "lucide-react";
import { Card } from "@/lib/cardManager";

interface CardSelectorProps {
  cards: Card[];
  activeCardId: string;
  onSelectCard: (cardId: string) => void;
  onCreateCard: () => void;
  onDeleteCard: (cardId: string) => void;
  onDuplicateCard: (cardId: string) => void;
  onSetPrimary: (cardId: string) => void;
}

export default function CardSelector({
  cards,
  activeCardId,
  onSelectCard,
  onCreateCard,
  onDeleteCard,
  onDuplicateCard,
  onSetPrimary,
}: CardSelectorProps) {
  const activeCard = cards.find((c) => c.id === activeCardId);

  return (
    <div className="w-full bg-white border-b border-[#dce6f5]">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#0d1e3a]">My Cards</h2>
            <p className="text-sm text-[#7a96b8]">
              {cards.length} card{cards.length !== 1 ? "s" : ""} • Active:{" "}
              <span className="font-medium text-[#3a5070]">{activeCard?.name}</span>
            </p>
          </div>
          <Button
            onClick={onCreateCard}
            className="flex items-center gap-2 bg-[#1a4fa8] hover:bg-[#0f3478] text-white rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>New Card</span>
          </Button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 overflow-x-auto pb-2">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => onSelectCard(card.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                activeCardId === card.id
                  ? "border-blue-600 bg-blue-50 shadow-md"
                  : "border-[#dce6f5] bg-white hover:border-blue-300 hover:shadow-sm"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-[#0d1e3a] text-sm truncate">
                    {card.name}
                  </h3>
                  <p className="text-xs text-[#7a96b8] truncate">{card.purpose}</p>
                </div>
                {card.isPrimary && (
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0 ml-2" />
                )}
              </div>

              {/* Card Info */}
              {card.description && (
                <p className="text-xs text-[#3a5070] mb-3 line-clamp-2">
                  {card.description}
                </p>
              )}

              {/* Card Contact Preview */}
              <div className="mb-3 pb-3 border-t border-[#dce6f5] pt-2">
                <p className="text-xs font-medium text-[#3a5070] truncate">
                  {card.data.name}
                </p>
                <p className="text-xs text-[#7a96b8] truncate">{card.data.title}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1">
                {!card.isPrimary && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetPrimary(card.id);
                    }}
                    className="flex-1 p-1 rounded text-xs text-[#3a5070] hover:bg-[#eef2f9] transition-colors"
                    title="Set as primary"
                  >
                    <Star className="w-3 h-3 mx-auto" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateCard(card.id);
                  }}
                  className="flex-1 p-1 rounded text-xs text-[#3a5070] hover:bg-[#eef2f9] transition-colors"
                  title="Duplicate card"
                >
                  <Copy className="w-3 h-3 mx-auto" />
                </button>
                {cards.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        confirm(
                          `Delete "${card.name}"? This action cannot be undone.`
                        )
                      ) {
                        onDeleteCard(card.id);
                      }
                    }}
                    className="flex-1 p-1 rounded text-xs text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete card"
                  >
                    <Trash2 className="w-3 h-3 mx-auto" />
                  </button>
                )}
              </div>

              {/* Updated timestamp */}
              <p className="text-xs text-[#a8bdd6] mt-2 text-center">
                {new Date(card.updatedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
