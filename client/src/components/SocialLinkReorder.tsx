import { useState } from "react";
import { GripVertical, Eye, EyeOff, Trash2 } from "lucide-react";
import { SocialLink } from "./CustomizationPanel";
import { Button } from "@/components/ui/button";

interface SocialLinkReorderProps {
  socialLinks: SocialLink[];
  socialLinkOrder?: string[];
  socialLinkVisibility?: Record<string, boolean>;
  onReorder: (newOrder: string[]) => void;
  onVisibilityChange: (linkId: string, visible: boolean) => void;
  onRemove: (linkId: string) => void;
}

const SOCIAL_ICONS: Record<string, string> = {
  twitter: "𝕏",
  github: "⚙️",
  instagram: "📷",
  facebook: "f",
  youtube: "▶️",
  tiktok: "♪",
  linkedin: "in",
};

export function SocialLinkReorder({
  socialLinks,
  socialLinkOrder = [],
  socialLinkVisibility = {},
  onReorder,
  onVisibilityChange,
  onRemove,
}: SocialLinkReorderProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Initialize order if not provided
  const orderedLinks = socialLinkOrder.length > 0
    ? socialLinkOrder
        .map((id) => socialLinks.find((link) => link.id === id))
        .filter((link) => link !== undefined) as SocialLink[]
    : socialLinks;

  const handleDragStart = (e: React.DragEvent, linkId: string) => {
    setDraggedId(linkId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (linkId: string) => {
    setDragOverId(linkId);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const newOrder = orderedLinks.map((link) => link.id);
    const draggedIndex = newOrder.indexOf(draggedId);
    const targetIndex = newOrder.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Swap positions
    [newOrder[draggedIndex], newOrder[targetIndex]] = [
      newOrder[targetIndex],
      newOrder[draggedIndex],
    ];

    onReorder(newOrder);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700">
        Drag to reorder social links. Toggle visibility with the eye icon.
      </p>

      <div className="space-y-2 bg-slate-50 rounded-lg p-3 border border-slate-200">
        {orderedLinks.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No social links added yet. Add links in the Social Links tab.
          </p>
        ) : (
          orderedLinks.map((link) => {
            const isVisible = socialLinkVisibility[link.id] !== false; // Default to visible
            const isDragging = draggedId === link.id;
            const isDragOver = dragOverId === link.id;

            return (
              <div
                key={link.id}
                draggable
                onDragStart={(e) => handleDragStart(e, link.id)}
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(link.id)}
                onDrop={(e) => handleDrop(e, link.id)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-2 rounded-md border transition-all cursor-move ${
                  isDragging
                    ? "opacity-50 bg-slate-100 border-slate-300"
                    : isDragOver
                      ? "bg-blue-50 border-blue-300"
                      : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Drag Handle */}
                <GripVertical className="w-4 h-4 text-slate-400 flex-shrink-0" />

                {/* Link Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {link.platform}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{link.url}</p>
                </div>

                {/* Visibility Toggle */}
                <button
                  onClick={() => onVisibilityChange(link.id, !isVisible)}
                  className="p-1 hover:bg-slate-200 rounded transition-colors flex-shrink-0"
                  title={isVisible ? "Hide link" : "Show link"}
                >
                  {isVisible ? (
                    <Eye className="w-4 h-4 text-slate-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Remove Button */}
                <button
                  onClick={() => onRemove(link.id)}
                  className="p-1 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                  title="Remove link"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {orderedLinks.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Reset to default order (LinkedIn first, then others)
            const defaultOrder = socialLinks.map((link) => link.id);
            onReorder(defaultOrder);
          }}
          className="w-full"
        >
          Reset Order
        </Button>
      )}
    </div>
  );
}
