import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  Linkedin,
  Share2,
  Download,
  QrCode,
  Globe,
  Twitter,
  Github,
  Instagram,
  Facebook,
  Youtube,
  Zap,
  BarChart3,
  Inbox,
  User,
  Grid3x3,
  Palette,
  Sparkles,
  ChevronDown,
  ExternalLink,
  LogOut,
  CreditCard,
} from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { QRCodeSVG as QRCode } from "qrcode.react";
import CustomizationPanel, {
  ContactData,
  CardStyle,
  SocialLink,
} from "@/components/CustomizationPanel";
import CardSelector from "@/components/CardSelector";
import CardCreationModal from "@/components/CardCreationModal";
import CardSharingModal from "@/components/CardSharingModal";
import CardSyncModal from "@/components/CardSyncModal";
import WalletButtons from "@/components/WalletButtons";
import {
  loadCards,
  saveCards,
  getActiveCard,
  createCard,
  updateCardData,
  deleteCard,
  switchCard,
  duplicateCard,
  setPrimaryCard,
  Card,
  CardCollection,
} from "@/lib/cardManager";
import { useCardPersistence } from "@/hooks/useCardPersistence";

const DEFAULT_PROFILE_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663330078692/TQa7FTf9yrF5GSDptm9S4c/profile-placeholder-NaBe9owkGZ9ozdbrALSiiV.webp";

// Generate vCard format for contact information
const generateVCard = (contactData: ContactData): string => {
  return `BEGIN:VCARD
VERSION:3.0
FN:${contactData.name}
TITLE:${contactData.title}
ORG:${contactData.company || ""}
EMAIL:${contactData.email}
TEL:${contactData.phone}
URL:${contactData.linkedin}
END:VCARD`;
};

// Map social platform names to icons
const getSocialIcon = (platform: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    Twitter: <Twitter className="w-5 h-5" />,
    GitHub: <Github className="w-5 h-5" />,
    Instagram: <Instagram className="w-5 h-5" />,
    Facebook: <Facebook className="w-5 h-5" />,
    YouTube: <Youtube className="w-5 h-5" />,
    TikTok: <span className="text-sm font-bold">TK</span>,
  };
  return iconMap[platform] || <Globe className="w-5 h-5" />;
};

const getSocialColor = (platform: string): string => {
  const colorMap: Record<string, string> = {
    Twitter: "#1DA1F2",
    GitHub: "#333333",
    Instagram: "#E4405F",
    Facebook: "#1877F2",
    YouTube: "#FF0000",
    TikTok: "#000000",
  };
  return colorMap[platform] || "#6B7280";
};

// Get background style for card header
const getBackgroundStyle = (cardStyle: CardStyle | any) => {
  if (cardStyle?.backgroundType === "image" && cardStyle?.backgroundImageUrl) {
    const bgPosition = cardStyle.backgroundImagePosition || "cover";
    const imageOpacity = cardStyle.backgroundImageOpacity || 1;
    return {
      backgroundImage: `url(${cardStyle.backgroundImageUrl})`,
      backgroundSize:
        bgPosition === "cover"
          ? "cover"
          : bgPosition === "contain"
            ? "contain"
            : "100% 100%",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      opacity: imageOpacity,
    };
  }
  if (cardStyle?.backgroundType === "gradient" && cardStyle?.gradientColors) {
    const [color1, color2] = cardStyle.gradientColors;
    const rotation = cardStyle.gradientRotation || 0;
    if (cardStyle.gradientType === "radial") {
      return { background: `radial-gradient(circle, ${color1}, ${color2})` };
    }
    return {
      background: `linear-gradient(${rotation}deg, ${color1}, ${color2})`,
    };
  }
  return { backgroundColor: cardStyle?.headerColor || "#0f172a" };
};

// Get button radius classes based on buttonStyle
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

export default function Home() {
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [cardCollection, setCardCollection] = useState<CardCollection>(() =>
    loadCards()
  );
  const [showCustomization, setShowCustomization] = useState(false);
  const [customizationTab, setCustomizationTab] = useState<
    "basic" | "social" | "style" | "wallet"
  >("basic");
  const [showCardCreation, setShowCardCreation] = useState(false);
  const [showCardSharing, setShowCardSharing] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<
    "profile" | "blocks" | "design" | "themes" | null
  >(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enable database persistence for authenticated users
  const { saveCardToServer, cardsLoading } = useCardPersistence(
    cardCollection,
    setCardCollection
  );

  // Save card collection to localStorage immediately, debounce server save
  useEffect(() => {
    saveCards(cardCollection);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (saveCardToServer) {
        saveCardToServer(cardCollection);
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [cardCollection, saveCardToServer]);

  const activeCard = getActiveCard(cardCollection);

  // Note: Early return is after all hooks have been called
  if (!activeCard) {
    return <div>Loading...</div>;
  }

  const contactData = activeCard.data;
  const vCardData = generateVCard(contactData);

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
    element.setAttribute(
      "download",
      `${contactData.name.replace(/\s+/g, "_")}.vcf`
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleContactDataChange = (newData: ContactData) => {
    setCardCollection(updateCardData(cardCollection, activeCard.id, newData));
  };

  const handleSelectCard = (cardId: string) => {
    setCardCollection(switchCard(cardCollection, cardId));
  };

  const handleCreateCard = (
    name: string,
    purpose: string,
    description?: string
  ) => {
    setCardCollection(createCard(cardCollection, name, purpose, description));
  };

  const handleDeleteCard = (cardId: string) => {
    setCardCollection(deleteCard(cardCollection, cardId));
  };

  const handleDuplicateCard = (cardId: string) => {
    setCardCollection(duplicateCard(cardCollection, cardId));
  };

  const handleSetPrimary = (cardId: string) => {
    setCardCollection(setPrimaryCard(cardCollection, cardId));
  };

  const openCustomizationPanel = (
    tab: "basic" | "social" | "style" | "wallet"
  ) => {
    setCustomizationTab(tab);
    setShowCustomization(true);
  };

  const handleSidebarClick = (
    tab: "profile" | "blocks" | "design" | "themes"
  ) => {
    setActiveSidebarTab(tab);
    const tabMap: Record<string, "basic" | "social" | "style" | "wallet"> = {
      profile: "basic",
      blocks: "social",
      design: "style",
      themes: "wallet",
    };
    openCustomizationPanel(tabMap[tab]);
  };

  const cardStyle = contactData.cardStyle || {
    backgroundType: "solid" as const,
    headerColor: "#0f172a",
    buttonStyle: "rounded" as const,
    frameStyle: "glassmorphism" as const,
    accentColor: "#3b82f6",
    titleFont: "Arial",
    titleSize: 28,
    textFont: "Arial",
    textColor: "#1f2937",
    showBranding: true,
  };

  const buttonRadiusClass = getButtonRadiusClass(cardStyle.buttonStyle);

  // Ordered and visible social links
  const orderedSocialLinks = (() => {
    const links = contactData.socialLinks || [];
    const order = contactData.socialLinkOrder;
    const visibility = contactData.socialLinkVisibility;
    let ordered = links;
    if (order && order.length > 0) {
      ordered = order
        .map((id) => links.find((l) => l.id === id))
        .filter(Boolean) as SocialLink[];
      const remaining = links.filter((l) => !order.includes(l.id));
      ordered = [...ordered, ...remaining];
    }
    if (visibility) {
      ordered = ordered.filter(
        (l) => visibility[l.id] === undefined || visibility[l.id] === true
      );
    }
    return ordered;
  })();

  return (
    <div className="flex min-h-screen bg-[#f4f7fc]">
      {/* ===== LEFT SIDEBAR (desktop) ===== */}
      <div className="hidden md:flex w-[62px] rk-sidebar flex-col items-center py-4 gap-2 flex-shrink-0">
        {/* Logo */}
        <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 text-white flex items-center justify-center font-bold text-base mb-3 hover:bg-white/25 transition-colors">
          R
        </div>

        {/* Editor navigation */}
        <SidebarIconButton
          icon={<User className="w-5 h-5" />}
          label="Profile"
          isActive={activeSidebarTab === "profile"}
          onClick={() => handleSidebarClick("profile")}
        />
        <SidebarIconButton
          icon={<Grid3x3 className="w-5 h-5" />}
          label="Social Links"
          isActive={activeSidebarTab === "blocks"}
          onClick={() => handleSidebarClick("blocks")}
        />
        <SidebarIconButton
          icon={<Palette className="w-5 h-5" />}
          label="Card Design"
          isActive={activeSidebarTab === "design"}
          onClick={() => handleSidebarClick("design")}
        />
        <SidebarIconButton
          icon={<Sparkles className="w-5 h-5" />}
          label="Wallet Pass"
          isActive={activeSidebarTab === "themes"}
          onClick={() => handleSidebarClick("themes")}
        />

        <div className="flex-1" />

        {/* Feature navigation */}
        <Link href="/analytics">
          <SidebarNavButton
            icon={<BarChart3 className="w-5 h-5" />}
            label="Analytics"
          />
        </Link>
        <Link href="/crm">
          <SidebarNavButton
            icon={<Inbox className="w-5 h-5" />}
            label="CRM"
          />
        </Link>
        <Link href="/workflows">
          <SidebarNavButton
            icon={<Zap className="w-5 h-5" />}
            label="Workflows"
          />
        </Link>
        <Link href="/pricing">
          <SidebarNavButton
            icon={<CreditCard className="w-5 h-5" />}
            label="Pricing"
          />
        </Link>

        {/* User account */}
        <div className="relative group">
          <button
            className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/30 hover:border-white/50 transition-colors flex items-center justify-center bg-white/20"
            title={user?.name || "Account"}
          >
            {user?.name ? (
              <span className="text-xs font-semibold text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User className="w-4 h-4 text-slate-500" />
            )}
          </button>
          <div className="absolute bottom-0 left-full ml-3 hidden group-hover:flex flex-col bg-white border border-[#dce6f5] rounded-xl shadow-lg shadow-blue-200/40 py-1.5 min-w-[160px] z-50">
            {user && (
              <div className="px-3 py-2 border-b border-[#eef2f9] mb-1">
                <p className="text-xs font-medium text-[#0d1e3a] truncate">{user.name}</p>
                <p className="text-[11px] text-[#7a96b8] truncate">{user.email}</p>
              </div>
            )}
            <Link href="/subscription">
              <button className="w-full text-left px-3 py-1.5 text-xs text-[#3a5070] hover:bg-[#eef2f9] flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5" />
                Subscription
              </button>
            </Link>
            {isAuthenticated && (
              <button
                onClick={logout}
                className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 flex items-center gap-2 mt-0.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 overflow-auto bg-[#f4f7fc]">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 rk-topbar">
          <div className="flex items-center justify-between px-4 md:px-6 h-14">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-[#0d1e3a] text-sm md:text-base truncate max-w-[200px]">
                {activeCard.name}
              </span>
              <span className="text-xs text-[#7a96b8] hidden sm:inline">
                {cardCollection.cards.length} card
                {cardCollection.cards.length !== 1 ? "s" : ""}
              </span>
              {cardsLoading && (
                <span className="text-[11px] text-[#7a96b8] hidden sm:flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
                  Saving…
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile editor icons */}
              <div className="flex md:hidden gap-1">
                <button
                  onClick={() => handleSidebarClick("profile")}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7a96b8] hover:bg-[#eef2f9] transition-colors"
                >
                  <User className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSidebarClick("blocks")}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7a96b8] hover:bg-[#eef2f9] transition-colors"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSidebarClick("design")}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7a96b8] hover:bg-[#eef2f9] transition-colors"
                >
                  <Palette className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setShowSync(true)}
                className="h-8 px-3 rounded-lg text-xs font-medium text-[#3a5070] border border-[#dce6f5] hover:border-[#3b82f6] hover:text-[#1a4fa8] hover:bg-[#eef2f9] transition-all hidden sm:flex items-center gap-1.5"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
                Sync
              </button>

              <Button
                onClick={() => setShowCardSharing(true)}
                size="sm"
                className="h-8 rounded-lg text-xs font-medium text-white shadow-sm rk-btn-primary"
                style={{ backgroundColor: cardStyle.accentColor }}
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Card Selector */}
        <CardSelector
          cards={cardCollection.cards}
          activeCardId={cardCollection.activeCardId}
          onSelectCard={handleSelectCard}
          onCreateCard={() => setShowCardCreation(true)}
          onDeleteCard={handleDeleteCard}
          onDuplicateCard={handleDuplicateCard}
          onSetPrimary={handleSetPrimary}
        />

        {/* Card Preview Area */}
        <div className="flex justify-center px-4 py-8 rk-preview-bg relative">
          <div className="w-full max-w-sm">
            {/* Phone-style card preview */}
            <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/10 border border-[#dce6f5] overflow-hidden">
              {/* Card Header / Banner */}
              <div
                className="relative h-28 overflow-hidden"
                style={getBackgroundStyle(cardStyle)}
              >
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl" />
                </div>
              </div>

              {/* Profile Section */}
              <div className="relative px-5 pb-5">
                <div className="flex justify-center -mt-14 mb-4">
                  <img
                    src={contactData.profileImage || DEFAULT_PROFILE_IMAGE}
                    alt="Profile"
                    className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                </div>

                {/* Name & Title */}
                <div className="text-center mb-1">
                  <h1
                    className="font-bold leading-tight"
                    style={{
                      fontSize: `${cardStyle.titleSize || 24}px`,
                      fontFamily: cardStyle.titleFont || "inherit",
                      color: cardStyle.textColor || "#1f2937",
                    }}
                  >
                    {contactData.name}
                  </h1>
                  <p
                    className="text-sm font-medium mt-0.5"
                    style={{
                      color: cardStyle.accentColor,
                      fontFamily: cardStyle.textFont || "inherit",
                    }}
                  >
                    {contactData.title}
                  </p>
                  {contactData.company && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {contactData.company}
                    </p>
                  )}
                </div>

                {/* Bio */}
                {contactData.bio && (
                  <p className="text-xs text-slate-500 text-center mt-2 mb-3 leading-relaxed">
                    {contactData.bio}
                  </p>
                )}

                {/* Divider */}
                <div className="my-4">
                  <div
                    className="h-px"
                    style={{
                      backgroundImage: `linear-gradient(to right, transparent, ${cardStyle.accentColor}30, transparent)`,
                    }}
                  />
                </div>

                {/* ===== FULL-WIDTH STACKED ACTION BUTTONS ===== */}
                <div className="space-y-2.5 mb-4">
                  {contactData.phone && (
                    <FullWidthLinkButton
                      icon={<Phone className="w-4 h-4" />}
                      label="Call"
                      sublabel={contactData.phone}
                      iconBg={`${cardStyle.accentColor}15`}
                      iconColor={cardStyle.accentColor}
                      radiusClass={buttonRadiusClass}
                      onClick={() =>
                        (window.location.href = `tel:${contactData.phone}`)
                      }
                    />
                  )}

                  {contactData.email && (
                    <FullWidthLinkButton
                      icon={<Mail className="w-4 h-4" />}
                      label="Email"
                      sublabel={contactData.email}
                      iconBg={`${cardStyle.accentColor}15`}
                      iconColor={cardStyle.accentColor}
                      radiusClass={buttonRadiusClass}
                      onClick={() =>
                        (window.location.href = `mailto:${contactData.email}`)
                      }
                    />
                  )}

                  {contactData.website && (
                    <FullWidthLinkButton
                      icon={<Globe className="w-4 h-4" />}
                      label="Website"
                      sublabel={contactData.website.replace("https://", "")}
                      iconBg={`${cardStyle.accentColor}15`}
                      iconColor={cardStyle.accentColor}
                      radiusClass={buttonRadiusClass}
                      onClick={() =>
                        window.open(contactData.website, "_blank")
                      }
                    />
                  )}

                  {contactData.linkedin && (
                    <FullWidthLinkButton
                      icon={<Linkedin className="w-4 h-4" />}
                      label="LinkedIn"
                      sublabel={contactData.linkedin.replace("https://", "")}
                      iconBg="#0A66C210"
                      iconColor="#0A66C2"
                      radiusClass={buttonRadiusClass}
                      onClick={() =>
                        window.open(contactData.linkedin, "_blank")
                      }
                    />
                  )}

                  {/* Social Links - Full Width Stacked */}
                  {orderedSocialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full flex items-center gap-3 px-4 py-3 ${buttonRadiusClass} border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all duration-200 group`}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: `${getSocialColor(link.platform)}15`,
                          color: getSocialColor(link.platform),
                        }}
                      >
                        {getSocialIcon(link.platform)}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800">
                          {link.platform}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {link.url.replace("https://", "")}
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[#c8d8f0] group-hover:text-[#7a96b8] flex-shrink-0" />
                    </a>
                  ))}
                </div>

                {/* Wallet Buttons */}
                <div className="mb-4">
                  <WalletButtons
                    contactData={contactData}
                    cardId={activeCard.id}
                    buttonRadius={buttonRadiusClass}
                    accentColor={cardStyle.accentColor}
                  />
                </div>

                {/* QR Code Toggle */}
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  {showQR ? "Hide QR Code" : "Show QR Code"}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${showQR ? "rotate-180" : ""}`}
                  />
                </button>

                {/* QR Code Section (collapsible) */}
                {showQR && (
                  <div className="mt-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-xs font-medium text-slate-500">
                        Scan to save contact
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-center">
                      <div
                        ref={qrRef}
                        className="flex items-center justify-center"
                      >
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
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs rounded-lg"
                        onClick={handleDownloadQR}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download QR
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs rounded-lg"
                        onClick={handleDownloadVCard}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Save vCard
                      </Button>
                    </div>
                  </div>
                )}

                {/* Share & Save Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button
                    className={`h-10 ${buttonRadiusClass} text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2`}
                    style={{ backgroundColor: cardStyle.accentColor }}
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `${contactData.name} - Contact Card`,
                          text: "Check out my digital contact card",
                          url: window.location.href,
                        });
                      } else {
                        handleDownloadQR();
                      }
                    }}
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    className={`h-10 ${buttonRadiusClass} border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2`}
                    onClick={handleDownloadVCard}
                  >
                    <Download className="w-4 h-4" />
                    Save
                  </Button>
                </div>

                {/* Branding */}
                {cardStyle.showBranding !== false && (
                  <div className="text-center mt-4">
                    <p className="text-[10px] text-slate-400">
                      Powered by ROKONNIQ
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile bottom nav */}
            <div className="flex md:hidden justify-center gap-6 mt-6">
              <Link href="/analytics">
                <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-[10px]">Analytics</span>
                </button>
              </Link>
              <Link href="/crm">
                <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                  <Inbox className="w-5 h-5" />
                  <span className="text-[10px]">CRM</span>
                </button>
              </Link>
              <Link href="/workflows">
                <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                  <Zap className="w-5 h-5" />
                  <span className="text-[10px]">Workflows</span>
                </button>
              </Link>
              {isAuthenticated && (
                <button
                  onClick={logout}
                  className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-[10px]">Sign out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== MODALS ===== */}

      {showCustomization && (
        <CustomizationPanel
          contactData={contactData}
          onContactDataChange={handleContactDataChange}
          onClose={() => {
            setShowCustomization(false);
            setActiveSidebarTab(null);
          }}
          initialTab={customizationTab}
        />
      )}

      <CardCreationModal
        isOpen={showCardCreation}
        onClose={() => setShowCardCreation(false)}
        onCreateCard={handleCreateCard}
      />

      {activeCard && (
        <CardSharingModal
          isOpen={showCardSharing}
          onClose={() => setShowCardSharing(false)}
          card={activeCard}
        />
      )}

      <CardSyncModal
        isOpen={showSync}
        onClose={() => setShowSync(false)}
        cardCollection={cardCollection}
        onImport={(imported) => {
          setCardCollection(imported);
          saveCards(imported);
        }}
      />
    </div>
  );
}

/* ===== HELPER COMPONENTS ===== */

function SidebarIconButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
        isActive
          ? "bg-white/18 text-white before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-[22px] before:bg-cyan-300 before:rounded-r-sm"
          : "text-white/45 hover:bg-white/12 hover:text-white/85"
      }`}
      title={label}
    >
      {icon}
      <span className="absolute left-full ml-3 px-2 py-1 text-xs font-medium bg-[#0d1e3a] text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
        {label}
      </span>
    </button>
  );
}

function SidebarNavButton({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      className="w-9 h-9 rounded-lg flex items-center justify-center text-white/45 hover:text-white/85 hover:bg-white/10 transition-all group relative"
      title={label}
    >
      {icon}
      <span className="absolute left-full ml-3 px-2 py-1 text-xs font-medium bg-[#0d1e3a] text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
        {label}
      </span>
    </button>
  );
}

function FullWidthLinkButton({
  icon,
  label,
  sublabel,
  iconBg,
  iconColor,
  radiusClass,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  iconBg: string;
  iconColor: string;
  radiusClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 ${radiusClass} border border-[#eef2f9] hover:border-[#c8d8f0] bg-white hover:bg-[#f8fbff] transition-all duration-200 group hover:shadow-sm`}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="text-left flex-1 min-w-0">
        <div className="text-sm font-medium text-[#1e293b]">{label}</div>
        <div className="text-xs text-[#94a3b8] truncate">{sublabel}</div>
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-[#c8d8f0] group-hover:text-[#7a96b8] flex-shrink-0" />
    </button>
  );
}
