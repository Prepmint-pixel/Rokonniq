import { Mail, Phone, Linkedin, Globe, Twitter, Github, Instagram, Facebook, Youtube, Download, Copy, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { decodeCardData, generateSocialShareUrls } from "@/lib/cardSharing";
import { ContactData, CardStyle } from "@/components/CustomizationPanel";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";

const getSocialIcon = (platform: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    Twitter: <Twitter className="w-4 h-4" />,
    GitHub: <Github className="w-4 h-4" />,
    Instagram: <Instagram className="w-4 h-4" />,
    Facebook: <Facebook className="w-4 h-4" />,
    YouTube: <Youtube className="w-4 h-4" />,
    TikTok: <span className="text-xs font-bold">TK</span>,
  };
  return iconMap[platform] || <Globe className="w-4 h-4" />;
};

const getFrameClasses = (frameStyle?: string) => {
  switch (frameStyle) {
    case "solid":
      return "bg-white border border-slate-200 shadow-lg";
    case "gradient":
      return "bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-xl";
    case "minimal":
      return "bg-white border border-slate-100 shadow-sm";
    case "glassmorphism":
    default:
      return "backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl";
  }
};

const getButtonRadiusClass = (buttonStyle?: string) => {
  switch (buttonStyle) {
    case "square":
      return "rounded-lg";
    case "pill":
      return "rounded-full";
    case "rounded":
    default:
      return "rounded-xl";
  }
};

export default function SharedCard() {
  const [location] = useLocation();
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Extract card data from URL
    const params = new URLSearchParams(window.location.search);
    const cardData = params.get("card");

    if (cardData) {
      const decodedData = decodeCardData(cardData);
      if (decodedData) {
        setContactData(decodedData);
        setLoading(false);
      } else {
        setError("Invalid card data");
        setLoading(false);
      }
    } else {
      setError("No card data found");
      setLoading(false);
    }
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading contact card...</p>
        </div>
      </div>
    );
  }

  if (error || !contactData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Card Not Found</h1>
          <p className="text-slate-600 mb-6">
            {error || "The contact card you're looking for doesn't exist or has expired."}
          </p>
          <Button
            onClick={() => window.location.href = "/"}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const cardStyle: CardStyle = contactData.cardStyle || {
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

  const buttonRadiusClass = getButtonRadiusClass(cardStyle.buttonStyle);
  const frameClass = getFrameClasses(cardStyle.frameStyle);

  const generateVCard = (): string => {
    return `BEGIN:VCARD
VERSION:3.0
FN:${contactData.name}
TITLE:${contactData.title}
EMAIL:${contactData.email}
TEL:${contactData.phone}
URL:${contactData.linkedin}
END:VCARD`;
  };

  const vCardData = generateVCard();

  const handleDownloadQR = () => {
    const canvas = qrRef.current?.querySelector("svg") as SVGElement;
    if (canvas) {
      const svgData = new XMLSerializer().serializeToString(canvas);
      const canvas2d = document.createElement("canvas");
      const ctx = canvas2d.getContext("2d");
      const img = new Image();

      canvas2d.width = 200;
      canvas2d.height = 200;

      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
        const link = document.createElement("a");
        link.href = canvas2d.toDataURL("image/png");
        link.download = `${contactData.name.replace(/\s+/g, "_")}_contact.png`;
        link.click();
      };

      img.src =
        "data:image/svg+xml;base64," +
        btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  const handleDownloadVCard = () => {
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(vCardData)
    );
    element.setAttribute("download", `${contactData.name.replace(/\s+/g, "_")}.vcf`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socialShareUrls = generateSocialShareUrls(
    contactData.name,
    window.location.href
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-40"
          style={{ backgroundColor: `${cardStyle.accentColor}20` }}
        ></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-50/30 rounded-full blur-3xl opacity-30"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Share info banner */}
          <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-900 text-center">
              📱 This is a shared contact card. You can save it or share it further.
            </p>
          </div>

          {/* Card container */}
          <div className={`${frameClass} rounded-3xl overflow-hidden mb-6`}>
            {/* Header section */}
            <div
              className="relative h-32 overflow-hidden"
              style={{ backgroundColor: cardStyle.headerColor }}
            >
              {/* Decorative elements */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-2xl"></div>
              </div>
            </div>

            {/* Profile section */}
            <div className="relative px-6 pb-6">
              {/* Profile image - positioned to overlap header */}
              <div className="flex justify-center -mt-16 mb-6">
                <div className="relative">
                  <img
                    src={contactData.profileImage}
                    alt="Profile"
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                  <div className="absolute inset-0 rounded-full border-4 border-white/20 shadow-lg"></div>
                </div>
              </div>

              {/* Name and title */}
              <div className="text-center mb-2">
                <h1 className="text-3xl font-bold text-slate-900 mb-1">
                  {contactData.name}
                </h1>
                <p className="text-base font-medium" style={{ color: cardStyle.accentColor }}>
                  {contactData.title}
                </p>
              </div>

              {/* Bio */}
              {contactData.bio && (
                <p className="text-sm text-slate-600 text-center mb-4 italic">
                  {contactData.bio}
                </p>
              )}

              {/* Decorative line */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div
                  className="flex-1 h-px"
                  style={{
                    backgroundImage: `linear-gradient(to right, transparent, ${cardStyle.accentColor}40, transparent)`,
                  }}
                ></div>
              </div>

              {/* Contact info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail className="w-4 h-4 flex-shrink-0" style={{ color: cardStyle.accentColor }} />
                  <span className="truncate">{contactData.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone className="w-4 h-4 flex-shrink-0" style={{ color: cardStyle.accentColor }} />
                  <span className="truncate">{contactData.phone}</span>
                </div>
                {contactData.website && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Globe className="w-4 h-4 flex-shrink-0" style={{ color: cardStyle.accentColor }} />
                    <span className="truncate text-xs">
                      {contactData.website.replace("https://", "")}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Linkedin className="w-4 h-4 flex-shrink-0" style={{ color: cardStyle.accentColor }} />
                  <span className="truncate text-xs">
                    {contactData.linkedin.replace("https://", "")}
                  </span>
                </div>
              </div>

              {/* Social Links */}
              {(contactData.socialLinks || []).length > 0 && (
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(contactData.socialLinks || []).map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 ${buttonRadiusClass} transition-all duration-200 hover:shadow-md`}
                        style={{
                          backgroundColor: `${cardStyle.accentColor}10`,
                          color: cardStyle.accentColor,
                        }}
                        title={link.platform}
                      >
                        {getSocialIcon(link.platform)}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  className={`flex items-center justify-center gap-2 h-10 ${buttonRadiusClass} border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200`}
                  onClick={() => window.location.href = `tel:${contactData.phone}`}
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">Call</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`flex items-center justify-center gap-2 h-10 ${buttonRadiusClass} border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200`}
                  onClick={() => window.location.href = `mailto:${contactData.email}`}
                >
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Email</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`flex items-center justify-center gap-2 h-10 ${buttonRadiusClass} border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200`}
                  onClick={() => window.open(contactData.linkedin, "_blank")}
                >
                  <Linkedin className="w-4 h-4" />
                  <span className="hidden sm:inline">LinkedIn</span>
                </Button>
              </div>

              {/* QR Code section */}
              <div className="mb-6 p-4 rounded-2xl border border-slate-200/50 backdrop-blur-sm" style={{ backgroundColor: `${cardStyle.accentColor}08` }}>
                <div className="flex items-center justify-center mb-3">
                  <span className="text-sm font-medium text-slate-700">
                    Save this contact
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-center">
                  <div ref={qrRef} className="flex items-center justify-center">
                    <QRCode
                      value={vCardData}
                      size={160}
                      level="H"
                      includeMargin={true}
                      fgColor={cardStyle.headerColor}
                      bgColor="#ffffff"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 text-center mt-2">
                  Scan to save contact to your phone
                </p>
              </div>

              {/* Download buttons */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Button
                  className={`h-10 ${buttonRadiusClass} text-white font-medium transition-all duration-200 flex items-center justify-center gap-2`}
                  style={{ backgroundColor: cardStyle.accentColor }}
                  onClick={handleDownloadVCard}
                >
                  <Download className="w-4 h-4" />
                  <span>Save</span>
                </Button>
                <Button
                  variant="outline"
                  className={`h-10 ${buttonRadiusClass} border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700 font-medium transition-all duration-200 flex items-center justify-center gap-2`}
                  onClick={handleDownloadQR}
                >
                  <Download className="w-4 h-4" />
                  <span>QR Code</span>
                </Button>
              </div>
            </div>

            {/* Footer message */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-slate-50 border-t border-slate-200/50">
              <p className="text-sm text-slate-600 text-center">
                Powered by ROKONNIQ
              </p>
            </div>
          </div>

          {/* Lead Capture Form */}
          <div className="mb-6">
            <LeadCaptureForm cardId={`shared-${contactData.name.replace(/\s+/g, '-').toLowerCase()}`} />
          </div>

          {/* Share section */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Share This Card</h2>

            {/* Copy link */}
            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Share Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={window.location.href}
                  readOnly
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 bg-slate-50"
                />
                <Button
                  onClick={handleCopyUrl}
                  className={`${buttonRadiusClass} px-4 py-2 text-white transition-all duration-200`}
                  style={{ backgroundColor: cardStyle.accentColor }}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Social share buttons */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={socialShareUrls.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 ${buttonRadiusClass} bg-blue-400 hover:bg-blue-500 text-white text-center text-sm font-medium transition-colors`}
              >
                <Twitter className="w-4 h-4 inline mr-1" />
                Twitter
              </a>
              <a
                href={socialShareUrls.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 ${buttonRadiusClass} bg-blue-700 hover:bg-blue-800 text-white text-center text-sm font-medium transition-colors`}
              >
                <Linkedin className="w-4 h-4 inline mr-1" />
                LinkedIn
              </a>
              <a
                href={socialShareUrls.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 ${buttonRadiusClass} bg-blue-600 hover:bg-blue-700 text-white text-center text-sm font-medium transition-colors`}
              >
                <Facebook className="w-4 h-4 inline mr-1" />
                Facebook
              </a>
              <a
                href={socialShareUrls.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 ${buttonRadiusClass} bg-green-500 hover:bg-green-600 text-white text-center text-sm font-medium transition-colors`}
              >
                <span className="text-sm font-bold">💬</span>
                WhatsApp
              </a>
            </div>

            {/* Email share */}
            <a
              href={socialShareUrls.email}
              className={`w-full mt-2 p-2 ${buttonRadiusClass} bg-slate-200 hover:bg-slate-300 text-slate-900 text-center text-sm font-medium transition-colors block`}
            >
              📧 Email
            </a>
          </div>

          {/* Back to home */}
          <div className="text-center mt-6">
            <Button
              variant="outline"
              onClick={() => window.location.href = "/"}
              className={`${buttonRadiusClass} border-slate-300 hover:bg-slate-100`}
            >
              Create Your Own Card
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
