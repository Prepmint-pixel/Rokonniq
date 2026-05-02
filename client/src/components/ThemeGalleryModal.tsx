import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { THEMES } from "./themes";
import { CardStyle } from "./CustomizationPanel";

interface ThemeGalleryModalProps {
  onThemeSelect: (theme: CardStyle) => void;
  onClose: () => void;
}

// Theme showcase images
const THEME_IMAGES: Record<string, string> = {
  professional: "https://d2xsxph8kpxj0f.cloudfront.net/310519663330078692/TQa7FTf9yrF5GSDptm9S4c/theme-professional-RCD6wyQCXpGpEyQ3DZtdMR.webp",
  creative: "https://d2xsxph8kpxj0f.cloudfront.net/310519663330078692/TQa7FTf9yrF5GSDptm9S4c/theme-creative-WQ875XgdxYMA7YZaDK8qEQ.webp",
  minimal: "https://d2xsxph8kpxj0f.cloudfront.net/310519663330078692/TQa7FTf9yrF5GSDptm9S4c/theme-minimal-RYr6gmGEhTY3UmbTtiBjYi.webp",
  vibrant: "https://d2xsxph8kpxj0f.cloudfront.net/310519663330078692/TQa7FTf9yrF5GSDptm9S4c/theme-vibrant-cLETmdHorWWoh6Z7p4X8Pw.webp",
};

function ThemePreviewCard({ theme, isSelected, onSelect }: any) {
  // Get image for this theme
  const themeImageKey = theme.id.toLowerCase();
  const themeImage = THEME_IMAGES[themeImageKey];

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
        isSelected ? "border-blue-600 shadow-lg" : "border-slate-200 hover:border-blue-300"
      }`}
    >
      {/* Theme Showcase Image */}
      {themeImage && (
        <div className="aspect-video bg-gray-100 overflow-hidden">
          <img
            src={themeImage}
            alt={`${theme.name} theme preview`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Theme Info */}
      <div className="p-3 bg-slate-50 border-t">
        <p className="font-medium text-sm text-slate-900">{theme.name}</p>
        <p className="text-xs text-slate-600">{theme.description}</p>
      </div>
    </div>
  );
}

export function ThemeGalleryModal({ onThemeSelect, onClose }: ThemeGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 2;
  const totalPages = Math.ceil(THEMES.length / itemsPerPage);

  const currentThemes = THEMES.slice(
    currentIndex * itemsPerPage,
    (currentIndex + 1) * itemsPerPage
  );

  const handleNext = () => {
    if (currentIndex < totalPages - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Choose a Theme</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {currentThemes.map((theme) => (
              <ThemePreviewCard
                key={theme.id}
                theme={theme}
                isSelected={false}
                onSelect={() => onThemeSelect(theme.cardStyle)}
              />
            ))}
          </div>

          {/* Pagination Info */}
          <div className="text-center text-sm text-gray-600">
            {currentIndex + 1} of {totalPages}
          </div>
        </div>

        {/* Footer with Navigation */}
        <div className="flex items-center justify-between p-6 border-t bg-slate-50">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={16} />
            Previous
          </Button>

          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentIndex ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex === totalPages - 1}
          >
            Next
            <ChevronRight size={16} />
          </Button>
        </div>

        {/* Info Text */}
        <div className="px-6 pb-4 text-xs text-gray-600 text-center">
          Click on a theme to apply it to your card
        </div>
      </div>
    </div>
  );
}
