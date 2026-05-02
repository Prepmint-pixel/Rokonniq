import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useState } from "react";

interface CardCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCard: (name: string, purpose: string, description?: string) => void;
}

const PURPOSES = [
  { id: "professional", label: "Professional", icon: "💼" },
  { id: "personal", label: "Personal", icon: "👤" },
  { id: "freelance", label: "Freelance", icon: "🚀" },
  { id: "event", label: "Event/Networking", icon: "🎤" },
  { id: "business", label: "Business", icon: "🏢" },
  { id: "creative", label: "Creative", icon: "🎨" },
  { id: "other", label: "Other", icon: "📌" },
];

export default function CardCreationModal({
  isOpen,
  onClose,
  onCreateCard,
}: CardCreationModalProps) {
  const [cardName, setCardName] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState("professional");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleCreate = () => {
    if (!cardName.trim()) {
      setError("Please enter a card name");
      return;
    }

    onCreateCard(cardName, selectedPurpose, description);
    setCardName("");
    setSelectedPurpose("professional");
    setDescription("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Create New Card</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Card Name */}
          <div className="space-y-2">
            <Label htmlFor="cardName" className="text-sm font-semibold">
              Card Name
            </Label>
            <Input
              id="cardName"
              value={cardName}
              onChange={(e) => {
                setCardName(e.target.value);
                setError("");
              }}
              placeholder="e.g., Main Card, Freelance Card"
              className="w-full"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>

          {/* Purpose Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Card Purpose</Label>
            <div className="grid grid-cols-2 gap-2">
              {PURPOSES.map((purpose) => (
                <button
                  key={purpose.id}
                  onClick={() => setSelectedPurpose(purpose.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    selectedPurpose === purpose.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <span className="text-lg">{purpose.icon}</span>
                  <p className="text-xs font-medium text-slate-900 mt-1">
                    {purpose.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">
              Description (Optional)
            </Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this card..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Create Card
          </Button>
        </div>
      </div>
    </div>
  );
}
