import React from "react";
import { Phone, Mail, Linkedin, Share2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CardActionButtonsProps {
  accentColor?: string;
  buttonRadius?: string;
  onCall?: () => void;
  onEmail?: () => void;
  onLinkedin?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onAppleWallet?: () => void;
  onGoogleWallet?: () => void;
  children?: React.ReactNode;
}

/**
 * ROKONNIQ Card Action Buttons
 * Full-width, stacked buttons with consistent spacing
 */
export default function CardActionButtons({
  accentColor = "#3b82f6",
  buttonRadius = "rounded-full",
  onCall,
  onEmail,
  onLinkedin,
  onShare,
  onEdit,
  onAppleWallet,
  onGoogleWallet,
  children,
}: CardActionButtonsProps) {
  const fullWidthButtonClass = `w-full ${buttonRadius} text-white font-medium py-3 shadow-md transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2`;

  return (
    <div className="w-full space-y-3">
      {/* Contact Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onCall}
          className={`flex-1 ${buttonRadius} bg-white border-2 border-slate-300 text-slate-700 font-medium py-3 transition-all duration-200 hover:bg-slate-50 flex items-center justify-center gap-2`}
        >
          <Phone className="w-4 h-4" />
          <span className="hidden sm:inline">Call</span>
        </button>
        <button
          onClick={onEmail}
          className={`flex-1 ${buttonRadius} bg-white border-2 border-slate-300 text-slate-700 font-medium py-3 transition-all duration-200 hover:bg-slate-50 flex items-center justify-center gap-2`}
        >
          <Mail className="w-4 h-4" />
          <span className="hidden sm:inline">Email</span>
        </button>
        <button
          onClick={onLinkedin}
          className={`flex-1 ${buttonRadius} bg-white border-2 border-slate-300 text-slate-700 font-medium py-3 transition-all duration-200 hover:bg-slate-50 flex items-center justify-center gap-2`}
        >
          <Linkedin className="w-4 h-4" />
          <span className="hidden sm:inline">LinkedIn</span>
        </button>
      </div>

      {/* Wallet Buttons */}
      {(onAppleWallet || onGoogleWallet) && (
        <div className="flex gap-2">
          {onAppleWallet && (
            <button
              onClick={onAppleWallet}
              className={`flex-1 ${fullWidthButtonClass}`}
              style={{ backgroundColor: accentColor }}
            >
              <span>🍎</span>
              <span className="hidden sm:inline">Apple Wallet</span>
            </button>
          )}
          {onGoogleWallet && (
            <button
              onClick={onGoogleWallet}
              className={`flex-1 ${fullWidthButtonClass}`}
              style={{ backgroundColor: accentColor }}
            >
              <span>🔵</span>
              <span className="hidden sm:inline">Google Wallet</span>
            </button>
          )}
        </div>
      )}

      {/* Primary Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onShare}
          className={`flex-1 ${fullWidthButtonClass}`}
          style={{ backgroundColor: accentColor }}
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
        <button
          onClick={onEdit}
          className={`flex-1 ${fullWidthButtonClass}`}
          style={{ backgroundColor: accentColor }}
        >
          <Edit2 className="w-4 h-4" />
          <span>Edit</span>
        </button>
      </div>

      {/* Additional children content */}
      {children}
    </div>
  );
}
