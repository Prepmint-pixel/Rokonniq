import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, RotateCcw, Plus, Trash2, Globe, Github, Twitter, Crop } from "lucide-react";
import { useState, useRef } from "react";
import { WalletCardCustomizer } from "./WalletCardCustomizer";
import { ImageCropModal } from "./ImageCropModal";
import { THEMES } from "./themes";
import { ThemeGalleryModal } from "./ThemeGalleryModal";
import { SocialLinkReorder } from "./SocialLinkReorder";

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon?: string;
}

export interface CardStyle {
  // Background
  backgroundType: "solid" | "gradient" | "image";
  headerColor: string;
  accentColor: string;
  
  // Gradient settings
  gradientType?: "linear" | "radial";
  gradientColors?: [string, string];
  gradientRotation?: number; // 0-360 degrees
  
  // Image background settings
  backgroundImageUrl?: string; // S3 URL to background image
  backgroundImageOpacity?: number; // 0-1 opacity
  backgroundImagePosition?: "cover" | "contain" | "stretch"; // Image sizing
  backgroundImageOverlay?: string; // Overlay color for text readability
  backgroundImageOverlayOpacity?: number; // 0-1 overlay opacity
  
  // Image crop/position settings
  imageCropX?: number; // X offset as percentage (0-100)
  imageCropY?: number; // Y offset as percentage (0-100)
  imageCropZoom?: number; // Zoom level (1-3)
  
  // Font settings
  titleFont?: string; // Font family
  titleSize?: number; // Font size in px
  textFont?: string; // Font family
  textColor?: string; // Text color
  
  // Layout
  buttonStyle: "rounded" | "square" | "pill";
  frameStyle: "glassmorphism" | "solid" | "gradient" | "minimal";
  
  // Branding
  showBranding?: boolean; // Show/hide branding line
  themeId?: string; // Reference to pre-built theme
}

export interface ContactData {
  name: string;
  title: string;
  company?: string;
  email: string;
  phone: string;
  linkedin: string;
  profileImage: string;
  website?: string;
  bio?: string;
  socialLinks?: SocialLink[];
  socialLinkOrder?: string[]; // Array of social link IDs in custom order
  socialLinkVisibility?: Record<string, boolean>; // Track which links are visible
  cardStyle?: CardStyle;
}

interface CustomizationPanelProps {
  contactData: ContactData;
  onContactDataChange: (data: ContactData) => void;
  onClose: () => void;
  initialTab?: "basic" | "social" | "style" | "wallet";
}

const DEFAULT_PROFILE_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663330078692/TQa7FTf9yrF5GSDptm9S4c/profile-placeholder-NaBe9owkGZ9ozdbrALSiiV.webp";

const SOCIAL_PLATFORMS = [
  { name: "Twitter", icon: "twitter", placeholder: "https://twitter.com/yourhandle" },
  { name: "GitHub", icon: "github", placeholder: "https://github.com/yourprofile" },
  { name: "Instagram", icon: "instagram", placeholder: "https://instagram.com/yourprofile" },
  { name: "Facebook", icon: "facebook", placeholder: "https://facebook.com/yourprofile" },
  { name: "YouTube", icon: "youtube", placeholder: "https://youtube.com/@yourchannel" },
  { name: "TikTok", icon: "tiktok", placeholder: "https://tiktok.com/@yourprofile" },
];

const COLOR_PRESETS = [
  { name: "Ocean Blue", header: "#0f172a", accent: "#3b82f6" },
  { name: "Sunset Orange", header: "#7c2d12", accent: "#f97316" },
  { name: "Forest Green", header: "#14532d", accent: "#22c55e" },
  { name: "Purple Haze", header: "#3f0f5c", accent: "#a855f7" },
  { name: "Slate Gray", header: "#1e293b", accent: "#64748b" },
  { name: "Rose Pink", header: "#500724", accent: "#ec4899" },
];

const FRAME_STYLES = [
  { id: "glassmorphism", label: "Glassmorphism", description: "Modern frosted glass effect" },
  { id: "solid", label: "Solid", description: "Clean and minimal" },
  { id: "gradient", label: "Gradient", description: "Vibrant gradient background" },
  { id: "minimal", label: "Minimal", description: "Ultra-clean design" },
];

const BUTTON_STYLES = [
  { id: "rounded", label: "Rounded", description: "Soft rounded corners" },
  { id: "square", label: "Square", description: "Sharp corners" },
  { id: "pill", label: "Pill", description: "Fully rounded buttons" },
];

const GRADIENT_PRESETS = [
  { name: "Purple Haze", colors: ["#7c3aed", "#ec4899"] },
  { name: "Sunset", colors: ["#f97316", "#fbbf24"] },
  { name: "Ocean", colors: ["#0ea5e9", "#06b6d4"] },
  { name: "Forest", colors: ["#059669", "#10b981"] },
  { name: "Fire", colors: ["#dc2626", "#f97316"] },
];

const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Courier New",
  "Verdana",
  "Trebuchet MS",
  "Comic Sans MS",
];

export default function CustomizationPanel({
  contactData,
  onContactDataChange,
  onClose,
  initialTab,
}: CustomizationPanelProps) {
  const [formData, setFormData] = useState<ContactData>({
    ...contactData,
    cardStyle: contactData.cardStyle || {
      backgroundType: "solid",
      headerColor: "#0f172a",
      accentColor: "#3b82f6",
      buttonStyle: "rounded",
      frameStyle: "glassmorphism",
      titleFont: "Arial",
      titleSize: 28,
      textFont: "Arial",
      textColor: "#1f2937",
      showBranding: true,
    },
    socialLinks: contactData.socialLinks || [],
  });

  const [activeTab, setActiveTab] = useState<"basic" | "social" | "style" | "wallet">(initialTab || "basic");
  const [showCropModal, setShowCropModal] = useState(false);
  const [showThemeGallery, setShowThemeGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setFormData((prev) => ({
          ...prev,
          profileImage: imageData,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetImage = () => {
    setFormData((prev) => ({
      ...prev,
      profileImage: DEFAULT_PROFILE_IMAGE,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddSocialLink = (platform: string) => {
    const newLink: SocialLink = {
      id: Date.now().toString(),
      platform,
      url: "",
      icon: SOCIAL_PLATFORMS.find((p) => p.name === platform)?.icon,
    };
    setFormData((prev) => ({
      ...prev,
      socialLinks: [...(prev.socialLinks || []), newLink],
    }));
  };

  const handleUpdateSocialLink = (id: string, url: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: (prev.socialLinks || []).map((link) =>
        link.id === id ? { ...link, url } : link
      ),
    }));
  };

  const handleRemoveSocialLink = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: (prev.socialLinks || []).filter((link) => link.id !== id),
    }));
  };

  const handleColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setFormData((prev) => ({
      ...prev,
      cardStyle: {
        ...prev.cardStyle!,
        headerColor: preset.header,
        accentColor: preset.accent,
      },
    }));
  };

  const handleStyleChange = (key: keyof CardStyle, value: any) => {
    setFormData((prev) => ({
      ...prev,
      cardStyle: {
        ...prev.cardStyle!,
        [key]: value,
      },
    }));
  };

  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        handleStyleChange('backgroundImageUrl', imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onContactDataChange(formData);
    onClose();
  };

  const handleCancel = () => {
    setFormData(contactData);
    onClose();
  };

  const addedPlatforms = new Set((formData.socialLinks || []).map((link) => link.platform));
  const availablePlatforms = SOCIAL_PLATFORMS.filter((p) => !addedPlatforms.has(p.name));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-[#dce6f5] bg-white rounded-t-2xl">
          <h2 className="text-xl font-bold text-[#0d1e3a]">Customize Your Card</h2>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-[#eef2f9] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#3a5070]" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#dce6f5] bg-[#f4f7fc] px-6">
          <button
            onClick={() => setActiveTab("basic")}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "basic"
                ? "border-blue-600 text-[#1a4fa8]"
                : "border-transparent text-[#3a5070] hover:text-[#0d1e3a]"
            }`}
          >
            Basic Info
          </button>
          <button
            onClick={() => setActiveTab("social")}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "social"
                ? "border-blue-600 text-[#1a4fa8]"
                : "border-transparent text-[#3a5070] hover:text-[#0d1e3a]"
            }`}
          >
            Social Links
          </button>
          <button
            onClick={() => setActiveTab("style")}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "style"
                ? "border-blue-600 text-[#1a4fa8]"
                : "border-transparent text-[#3a5070] hover:text-[#0d1e3a]"
            }`}
          >
            Card Style
          </button>
          <button
            onClick={() => setActiveTab("wallet")}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "wallet"
                ? "border-blue-600 text-[#1a4fa8]"
                : "border-transparent text-[#3a5070] hover:text-[#0d1e3a]"
            }`}
          >
            Wallet Card
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <div className="space-y-6">
              {/* Profile Image Section */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-[#0d1e3a]">Profile Image</Label>
                <div className="flex flex-col items-center gap-4">
                  <img
                    src={formData.profileImage}
                    alt="Profile preview"
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-200 shadow-md"
                  />
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 flex items-center justify-center gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 flex items-center justify-center gap-2"
                      onClick={handleResetImage}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reset</span>
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold">
                  Job Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Product Designer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-semibold">
                  Company
                </Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., Acme Corporation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-semibold">
                  Bio (Optional)
                </Label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio || ""}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  className="w-full px-3 py-2 border border-[#c8d8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-semibold">
                  Website (Optional)
                </Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website || ""}
                  onChange={handleInputChange}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin" className="text-sm font-semibold">
                  LinkedIn Profile
                </Label>
                <Input
                  id="linkedin"
                  name="linkedin"
                  type="url"
                  value={formData.linkedin}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
            </div>
          )}

          {/* Social Links Tab */}
          {activeTab === "social" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#0d1e3a] mb-3">Reorder Social Links</h3>
                <SocialLinkReorder
                  socialLinks={formData.socialLinks || []}
                  socialLinkOrder={formData.socialLinkOrder}
                  socialLinkVisibility={formData.socialLinkVisibility}
                  onReorder={(newOrder) => {
                    setFormData((prev) => ({
                      ...prev,
                      socialLinkOrder: newOrder,
                    }));
                  }}
                  onVisibilityChange={(linkId, visible) => {
                    setFormData((prev) => ({
                      ...prev,
                      socialLinkVisibility: {
                        ...prev.socialLinkVisibility,
                        [linkId]: visible,
                      },
                    }));
                  }}
                  onRemove={(linkId) => handleRemoveSocialLink(linkId)}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#0d1e3a] mb-3">Edit Social Links</h3>
                <div className="space-y-3">
                  {(formData.socialLinks || []).length === 0 ? (
                    <p className="text-sm text-[#7a96b8]">No social links added yet.</p>
                  ) : (
                    (formData.socialLinks || []).map((link) => (
                      <div key={link.id} className="flex gap-2">
                        <Input
                          type="url"
                          value={link.url}
                          onChange={(e) => handleUpdateSocialLink(link.id, e.target.value)}
                          placeholder={`${link.platform} URL`}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveSocialLink(link.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {availablePlatforms.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#0d1e3a] mb-3">Add Social Links</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {availablePlatforms.map((platform) => (
                      <Button
                        key={platform.name}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddSocialLink(platform.name)}
                        className="flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{platform.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Wallet Card Tab */}
          {activeTab === "wallet" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-[#0d1e3a] mb-3">Create Digital Wallet Pass</h3>
                <p className="text-sm text-[#3a5070] mb-4">Create Apple Wallet and Google Wallet passes for your contact card.</p>
                <WalletCardCustomizer cardId="default" onSuccess={() => alert("Wallet card saved!")} />
              </div>
            </div>
          )}

          {/* Card Style Tab */}
          {activeTab === "style" && (
            <div className="space-y-6">
              {/* Color Presets */}
              <div>
                <h3 className="text-sm font-semibold text-[#0d1e3a] mb-3">Color Presets</h3>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handleColorPreset(preset)}
                      className="p-3 rounded-lg border-2 border-[#dce6f5] hover:border-blue-500 transition-colors text-center"
                    >
                      <div className="flex gap-1 mb-2 justify-center">
                        <div
                          className="w-6 h-6 rounded-full border border-[#c8d8f0]"
                          style={{ backgroundColor: preset.header }}
                        ></div>
                        <div
                          className="w-6 h-6 rounded-full border border-[#c8d8f0]"
                          style={{ backgroundColor: preset.accent }}
                        ></div>
                      </div>
                      <p className="text-xs font-medium text-[#3a5070]">{preset.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="headerColor" className="text-sm font-semibold">
                    Header Color
                  </Label>
                  <div className="flex gap-2">
                    <input
                      id="headerColor"
                      type="color"
                      value={formData.cardStyle?.headerColor || "#0f172a"}
                      onChange={(e) => handleStyleChange("headerColor", e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-[#c8d8f0]"
                    />
                    <Input
                      type="text"
                      value={formData.cardStyle?.headerColor || "#0f172a"}
                      onChange={(e) => handleStyleChange("headerColor", e.target.value)}
                      className="flex-1"
                      placeholder="#0f172a"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor" className="text-sm font-semibold">
                    Accent Color
                  </Label>
                  <div className="flex gap-2">
                    <input
                      id="accentColor"
                      type="color"
                      value={formData.cardStyle?.accentColor || "#3b82f6"}
                      onChange={(e) => handleStyleChange("accentColor", e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-[#c8d8f0]"
                    />
                    <Input
                      type="text"
                      value={formData.cardStyle?.accentColor || "#3b82f6"}
                      onChange={(e) => handleStyleChange("accentColor", e.target.value)}
                      className="flex-1"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
              </div>

              {/* Frame Styles */}
              <div>
                <h3 className="text-sm font-semibold text-[#0d1e3a] mb-3">Card Frame</h3>
                <div className="grid grid-cols-2 gap-2">
                  {FRAME_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handleStyleChange("frameStyle", style.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        formData.cardStyle?.frameStyle === style.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-[#dce6f5] hover:border-blue-300"
                      }`}
                    >
                      <p className="text-sm font-medium text-[#0d1e3a]">{style.label}</p>
                      <p className="text-xs text-[#7a96b8]">{style.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Button Styles */}
              <div>
                <h3 className="text-sm font-semibold text-[#0d1e3a] mb-3">Button Style</h3>
                <div className="grid grid-cols-3 gap-2">
                  {BUTTON_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handleStyleChange("buttonStyle", style.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        formData.cardStyle?.buttonStyle === style.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-[#dce6f5] hover:border-blue-300"
                      }`}
                    >
                      <p className="text-sm font-medium text-[#0d1e3a]">{style.label}</p>
                      <p className="text-xs text-[#7a96b8]">{style.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Type */}
              <div>
                <h3 className="text-sm font-semibold text-[#0d1e3a] mb-3">Background</h3>
                <div className="flex gap-3 mb-4">
                  {["solid", "gradient", "image"].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleStyleChange("backgroundType", type)}
                      className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        formData.cardStyle?.backgroundType === type
                          ? "border-blue-600 bg-blue-50 text-blue-900"
                          : "border-[#dce6f5] text-[#3a5070] hover:border-blue-300"
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gradient Settings */}
              {formData.cardStyle?.backgroundType === "gradient" && (
                <div className="space-y-4 p-4 bg-[#f4f7fc] rounded-lg">
                  <div>
                    <h4 className="text-sm font-semibold text-[#0d1e3a] mb-2">Gradient Type</h4>
                    <div className="flex gap-2">
                      {["linear", "radial"].map((type) => (
                        <button
                          key={type}
                          onClick={() => handleStyleChange("gradientType", type)}
                          className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                            formData.cardStyle?.gradientType === type
                              ? "border-blue-600 bg-blue-50"
                              : "border-[#dce6f5] hover:border-blue-300"
                          }`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-[#0d1e3a] mb-2">Gradient Presets</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {GRADIENT_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => handleStyleChange("gradientColors", preset.colors)}
                          className="p-3 rounded-lg border-2 border-[#dce6f5] hover:border-blue-500 transition-colors text-center"
                          style={{
                            background: `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]})`
                          }}
                        >
                          <p className="text-xs font-medium text-white drop-shadow">{preset.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">Rotation: {formData.cardStyle?.gradientRotation || 0}°</Label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={formData.cardStyle?.gradientRotation || 0}
                      onChange={(e) => handleStyleChange("gradientRotation", parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Image Background Settings */}
              {formData.cardStyle?.backgroundType === "image" && (
                <div className="space-y-4 p-4 bg-[#f4f7fc] rounded-lg">
                  <div>
                    <h4 className="text-sm font-semibold text-[#0d1e3a] mb-3">Background Image</h4>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      <button
                        onClick={() => document.getElementById('backgroundImageInput')?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1a4fa8] text-white rounded-lg hover:bg-[#0f3478] transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Image
                      </button>
                      {formData.cardStyle?.backgroundImageUrl && (
                        <>
                          <button
                            onClick={() => setShowCropModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <Crop className="w-4 h-4" />
                            Crop
                          </button>
                          <button
                            onClick={() => handleStyleChange('backgroundImageUrl', undefined)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                    <input
                      id="backgroundImageInput"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleBackgroundImageUpload(e)}
                      className="hidden"
                    />
                    {formData.cardStyle?.backgroundImageUrl && (
                      <div className="mb-4">
                        <img
                          src={formData.cardStyle.backgroundImageUrl}
                          alt="Background preview"
                          className="w-full h-32 object-cover rounded-lg border border-[#c8d8f0]"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#3a5070] mb-2 block">Image Fit</label>
                    <div className="flex gap-2">
                      {['cover', 'contain', 'stretch'].map((position) => (
                        <button
                          key={position}
                          onClick={() => handleStyleChange('backgroundImagePosition', position)}
                          className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                            formData.cardStyle?.backgroundImagePosition === position
                              ? 'border-blue-600 bg-blue-50 text-blue-900'
                              : 'border-[#dce6f5] text-[#3a5070] hover:border-blue-300'
                          }`}
                        >
                          {position.charAt(0).toUpperCase() + position.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#3a5070] mb-2 block">Image Opacity: {Math.round((formData.cardStyle?.backgroundImageOpacity || 1) * 100)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.cardStyle?.backgroundImageOpacity || 1}
                      onChange={(e) => handleStyleChange('backgroundImageOpacity', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#3a5070] mb-2 block">Overlay Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.cardStyle?.backgroundImageOverlay || '#000000'}
                        onChange={(e) => handleStyleChange('backgroundImageOverlay', e.target.value)}
                        className="w-12 h-10 rounded-lg cursor-pointer border border-[#c8d8f0]"
                      />
                      <input
                        type="text"
                        placeholder="#000000"
                        value={formData.cardStyle?.backgroundImageOverlay || '#000000'}
                        onChange={(e) => handleStyleChange('backgroundImageOverlay', e.target.value)}
                        className="flex-1 px-3 py-2 border border-[#c8d8f0] rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#3a5070] mb-2 block">Overlay Opacity: {Math.round((formData.cardStyle?.backgroundImageOverlayOpacity || 0.3) * 100)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.cardStyle?.backgroundImageOverlayOpacity || 0.3}
                      onChange={(e) => handleStyleChange('backgroundImageOverlayOpacity', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Font Settings */}
              <div className="space-y-4 p-4 bg-[#f4f7fc] rounded-lg">
                <h4 className="text-sm font-semibold text-[#0d1e3a]">Fonts</h4>
                
                <div>
                  <Label htmlFor="titleFont" className="text-sm">Title Font</Label>
                  <select
                    id="titleFont"
                    value={formData.cardStyle?.titleFont || "Arial"}
                    onChange={(e) => handleStyleChange("titleFont", e.target.value)}
                    className="w-full px-3 py-2 border border-[#c8d8f0] rounded-lg text-sm"
                  >
                    {FONT_FAMILIES.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-sm">Title Size: {formData.cardStyle?.titleSize || 28}px</Label>
                  <input
                    type="range"
                    min="16"
                    max="48"
                    value={formData.cardStyle?.titleSize || 28}
                    onChange={(e) => handleStyleChange("titleSize", parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="textFont" className="text-sm">Text Font</Label>
                  <select
                    id="textFont"
                    value={formData.cardStyle?.textFont || "Arial"}
                    onChange={(e) => handleStyleChange("textFont", e.target.value)}
                    className="w-full px-3 py-2 border border-[#c8d8f0] rounded-lg text-sm"
                  >
                    {FONT_FAMILIES.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textColor" className="text-sm">Text Color</Label>
                  <div className="flex gap-2">
                    <input
                      id="textColor"
                      type="color"
                      value={formData.cardStyle?.textColor || "#1f2937"}
                      onChange={(e) => handleStyleChange("textColor", e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-[#c8d8f0]"
                    />
                    <Input
                      type="text"
                      value={formData.cardStyle?.textColor || "#1f2937"}
                      onChange={(e) => handleStyleChange("textColor", e.target.value)}
                      className="flex-1"
                      placeholder="#1f2937"
                    />
                  </div>
                </div>
              </div>

              {/* Branding */}
              <div className="flex items-center justify-between p-3 bg-[#f4f7fc] rounded-lg">
                <Label className="text-sm font-semibold">Show Branding</Label>
                <input
                  type="checkbox"
                  checked={formData.cardStyle?.showBranding !== false}
                  onChange={(e) => handleStyleChange("showBranding", e.target.checked)}
                  className="w-5 h-5 rounded border-[#c8d8f0] cursor-pointer"
                />
              </div>

              {/* Theme Gallery */}
              <div>
                <h4 className="text-sm font-semibold text-[#0d1e3a] mb-3">Pre-built Themes</h4>
                <Button
                  onClick={() => setShowThemeGallery(true)}
                  className="w-full bg-[#1a4fa8] hover:bg-[#0f3478] text-white"
                >
                  View All Themes
                </Button>
              </div>

              {/* Reset Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleStyleChange("frameStyle", "glassmorphism");
                    handleStyleChange("buttonStyle", "rounded");
                    handleStyleChange("backgroundType", "solid");
                    handleStyleChange("headerColor", "#0f172a");
                    handleStyleChange("accentColor", "#3b82f6");
                  }}
                  className="flex-1"
                >
                  Reset Design
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Reset all card data and design to defaults? This cannot be undone.")) {
                      setFormData({
                        name: "",
                        title: "",
                        company: "",
                        email: "",
                        phone: "",
                        linkedin: "",
                        profileImage: DEFAULT_PROFILE_IMAGE,
                        website: "",
                        bio: "",
                        socialLinks: [],
                        cardStyle: {
                          backgroundType: "solid",
                          headerColor: "#0f172a",
                          accentColor: "#3b82f6",
                          buttonStyle: "rounded",
                          frameStyle: "glassmorphism",
                          titleFont: "Arial",
                          titleSize: 28,
                          textFont: "Arial",
                          textColor: "#1f2937",
                          showBranding: true,
                        },
                      });
                    }
                  }}
                  className="flex-1"
                >
                  Reset All
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-3 p-6 border-t border-[#dce6f5] bg-[#f4f7fc]">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-[#1a4fa8] hover:bg-[#0f3478] text-white">
            Save Changes
          </Button>
        </div>
      </div>
      
      {/* Image Crop Modal */}
      {showCropModal && formData.cardStyle?.backgroundImageUrl && (
        <ImageCropModal
          imageUrl={formData.cardStyle.backgroundImageUrl}
          initialCropX={formData.cardStyle.imageCropX || 50}
          initialCropY={formData.cardStyle.imageCropY || 50}
          initialZoom={formData.cardStyle.imageCropZoom || 1}
          onCropChange={(x, y, zoom) => {
            handleStyleChange('imageCropX', x);
            handleStyleChange('imageCropY', y);
            handleStyleChange('imageCropZoom', zoom);
          }}
          onClose={() => setShowCropModal(false)}
        />
      )}

      {/* Theme Gallery Modal */}
      {showThemeGallery && (
        <ThemeGalleryModal
          onThemeSelect={(theme) => {
            Object.entries(theme).forEach(([key, value]) => {
              handleStyleChange(key as any, value);
            });
            setShowThemeGallery(false);
          }}
          onClose={() => setShowThemeGallery(false)}
        />
      )}
    </div>
  );
}
