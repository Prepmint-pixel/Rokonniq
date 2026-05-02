import { Button } from "@/components/ui/button";
import { X, Copy, Check, Share2, Twitter, Linkedin, Facebook, Mail } from "lucide-react";
import { useState } from "react";
import { Card } from "@/lib/cardManager";
import {
  createEmbeddedShareLink,
  generateSocialShareUrls,
  getShareStats,
  generateQRCodeUrl,
} from "@/lib/cardSharing";

interface CardSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card;
}

export default function CardSharingModal({
  isOpen,
  onClose,
  card,
}: CardSharingModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"link" | "social" | "stats">("link");

  if (!isOpen) return null;

  const shareLink = createEmbeddedShareLink(card);
  const socialUrls = generateSocialShareUrls(card.name, shareLink);
  const stats = getShareStats(card.id);
  const qrCodeUrl = generateQRCodeUrl(shareLink);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenSocialShare = (url: string) => {
    window.open(url, "share", "width=600,height=400");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Share Card</h2>
            <p className="text-sm text-slate-500">{card.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("link")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "link"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Link
          </button>
          <button
            onClick={() => setActiveTab("social")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "social"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Social
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "stats"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Stats
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Link Tab */}
          {activeTab === "link" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-900 block mb-2">
                  Shareable Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-600 bg-slate-50 font-mono truncate"
                  />
                  <Button
                    onClick={handleCopyLink}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Share this link with anyone to let them view your contact card
                </p>
              </div>

              {/* QR Code */}
              <div>
                <label className="text-sm font-semibold text-slate-900 block mb-2">
                  QR Code
                </label>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-center">
                  <img
                    src={qrCodeUrl}
                    alt="Share QR Code"
                    className="w-32 h-32"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Scan this QR code to view the card
                </p>
              </div>
            </div>
          )}

          {/* Social Tab */}
          {activeTab === "social" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 mb-4">
                Share your contact card on social media
              </p>

              <button
                onClick={() => handleOpenSocialShare(socialUrls.twitter)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
              >
                <Twitter className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Twitter</p>
                  <p className="text-xs text-slate-500">Share on Twitter</p>
                </div>
              </button>

              <button
                onClick={() => handleOpenSocialShare(socialUrls.linkedin)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
              >
                <Linkedin className="w-5 h-5 text-blue-700 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900">LinkedIn</p>
                  <p className="text-xs text-slate-500">Share on LinkedIn</p>
                </div>
              </button>

              <button
                onClick={() => handleOpenSocialShare(socialUrls.facebook)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
              >
                <Facebook className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Facebook</p>
                  <p className="text-xs text-slate-500">Share on Facebook</p>
                </div>
              </button>

              <button
                onClick={() => handleOpenSocialShare(socialUrls.email)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
              >
                <Mail className="w-5 h-5 text-slate-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Email</p>
                  <p className="text-xs text-slate-500">Share via email</p>
                </div>
              </button>

              <button
                onClick={() => handleOpenSocialShare(socialUrls.whatsapp)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
              >
                <span className="text-2xl flex-shrink-0">💬</span>
                <div>
                  <p className="text-sm font-medium text-slate-900">WhatsApp</p>
                  <p className="text-xs text-slate-500">Share on WhatsApp</p>
                </div>
              </button>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === "stats" && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-900 font-medium mb-1">
                  Total Views
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.viewCount}
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-900 font-medium mb-1">
                  Last Viewed
                </p>
                <p className="text-lg font-semibold text-slate-700">
                  {stats.lastViewedAt}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-900 font-medium mb-2">
                  Sharing Tips
                </p>
                <ul className="text-xs text-green-800 space-y-1">
                  <li>✓ Share on multiple platforms for better reach</li>
                  <li>✓ Include a personal message when sharing</li>
                  <li>✓ Update your card regularly to keep info fresh</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button
            onClick={handleCopyLink}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Copy Link
          </Button>
        </div>
      </div>
    </div>
  );
}
