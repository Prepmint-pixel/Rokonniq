import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Wallet, Apple, Download, Upload, X, Eye } from "lucide-react";
import { WalletPassPreview } from "./WalletPassPreview";
interface WalletCardCustomizerProps {
  cardId: string;
  onSuccess?: () => void;
}

type WalletType = "loyalty" | "gift" | "membership" | "event" | "coupon";

export function WalletCardCustomizer({
  cardId,
  onSuccess,
}: WalletCardCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [walletType, setWalletType] = useState<WalletType>("loyalty");
  const [formData, setFormData] = useState({
    title: "My Card",
    description: "",
    backgroundColor: "#1F2937",
    textColor: "#FFFFFF",
    accentColor: "#3B82F6",
    points: 0,
    balance: 0,
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Get existing wallet card
  const { data: existingCard } = trpc.walletCards.get.useQuery({ cardId });

  // Get logo URL
  const { data: logoData } = trpc.logoUpload.getLogoUrl.useQuery({ cardId });

  // Upload logo mutation
  const { mutate: uploadLogo } = trpc.logoUpload.uploadLogo.useMutation({
    onSuccess: (data) => {
      setLogoUrl(data.url);
      setLogoFile(null);
      setIsUploadingLogo(false);
      alert("Logo uploaded successfully!");
    },
    onError: (error) => {
      setIsUploadingLogo(false);
      alert("Error uploading logo: " + (error.message || "Unknown error"));
    },
  });

  // Delete logo mutation
  const { mutate: deleteLogo } = trpc.logoUpload.deleteLogo.useMutation({
    onSuccess: () => {
      setLogoUrl(null);
      setLogoFile(null);
      alert("Logo deleted successfully!");
    },
    onError: (error) => {
      alert("Error deleting logo: " + (error.message || "Unknown error"));
    },
  });

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = () => {
    if (!logoFile) return;
    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      uploadLogo({
        cardId,
        file: new Uint8Array(buffer) as any,
        filename: logoFile.name,
        mimeType: logoFile.type,
      });
    };
    reader.readAsArrayBuffer(logoFile);
  };

  // Create/update wallet card
  const { mutate: createWalletCard, isPending: isCreating } =
    trpc.walletCards.create.useMutation({
      onSuccess: () => {
        alert("Wallet card created successfully!");
        setIsOpen(false);
        onSuccess?.();
      },
      onError: (error) => {
        alert("Error: " + (error.message || "Failed to create wallet card"));
      },
    });

  // Use existing logo if available
  useEffect(() => {
    if (logoData?.logoUrl && !logoUrl) {
      setLogoUrl(logoData.logoUrl);
    }
  }, [logoData]);

  // Generate Apple pass
  const { mutate: generateApplePass, isPending: isGeneratingApple } =
    trpc.walletCards.generateApplePass.useMutation({
      onSuccess: (data) => {
        alert("Apple Wallet pass generated! Download link: " + data.url);
      },
      onError: (error) => {
        alert("Error: " + (error.message || "Failed to generate Apple pass"));
      },
    });

  // Generate Google pass
  const { mutate: generateGooglePass, isPending: isGeneratingGoogle } =
    trpc.walletCards.generateGooglePass.useMutation({
      onSuccess: (data) => {
        alert("Google Wallet pass generated! URL: " + data.url);
      },
      onError: (error) => {
        alert("Error: " + (error.message || "Failed to generate Google pass"));
      },
    });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "points" || name === "balance" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWalletCard({
      cardId,
      type: walletType,
      title: formData.title,
      description: formData.description,
      backgroundColor: formData.backgroundColor,
      textColor: formData.textColor,
      accentColor: formData.accentColor,
      points: formData.points,
      balance: formData.balance,
      logoUrl: logoUrl || undefined,
    });
  };

  if (!isOpen) {
    return (
      <div className="space-y-2">
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
        >
          <Wallet className="w-4 h-4" />
          {existingCard ? "Edit Wallet Card" : "Create Wallet Card"}
        </Button>

        {existingCard && (
          <div className="flex gap-2">
            <Button
              onClick={() => setIsPreviewOpen(true)}
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
            <Button
              onClick={() => generateApplePass({ cardId })}
              disabled={isGeneratingApple}
              className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-gray-800"
            >
              {isGeneratingApple ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Apple className="w-4 h-4" />
                  Apple Wallet
                </>
              )}
            </Button>
            <Button
              onClick={() => generateGooglePass({ cardId })}
              disabled={isGeneratingGoogle}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {isGeneratingGoogle ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Google Wallet
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Wallet Card</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Card Type</label>
            <select
              value={walletType}
              onChange={(e) => setWalletType(e.target.value as WalletType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="loyalty">Loyalty Card</option>
              <option value="gift">Gift Card</option>
              <option value="membership">Membership Card</option>
              <option value="event">Event Ticket</option>
              <option value="coupon">Coupon</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="My Loyalty Card"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Card description..."
              rows={2}
            />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                Background
              </label>
              <input
                type="color"
                name="backgroundColor"
                value={formData.backgroundColor}
                onChange={handleChange}
                className="w-full h-10 rounded border border-gray-300 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Text</label>
              <input
                type="color"
                name="textColor"
                value={formData.textColor}
                onChange={handleChange}
                className="w-full h-10 rounded border border-gray-300 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Accent</label>
              <input
                type="color"
                name="accentColor"
                value={formData.accentColor}
                onChange={handleChange}
                className="w-full h-10 rounded border border-gray-300 cursor-pointer"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Logo</label>
            <div className="flex items-center gap-2 mb-2">
              {logoUrl && (
                <div className="flex-1 flex items-center gap-2">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="w-12 h-12 object-contain rounded border border-gray-300"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteLogo({ cardId })}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="hidden"
                id="logo-input"
              />
              <label
                htmlFor="logo-input"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Choose Logo
              </label>
              {logoFile && (
                <Button
                  type="button"
                  onClick={handleLogoUpload}
                  disabled={isUploadingLogo}
                  className="flex-1"
                >
                  {isUploadingLogo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Points/Balance */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Points</label>
              <Input
                type="number"
                name="points"
                value={formData.points}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Balance</label>
              <Input
                type="number"
                name="balance"
                value={formData.balance}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Preview */}
          <div
            className="p-4 rounded-lg text-center"
            style={{
              backgroundColor: formData.backgroundColor,
              color: formData.textColor,
            }}
          >
            <div className="font-bold text-lg">{formData.title}</div>
            {formData.description && (
              <div className="text-sm opacity-90">{formData.description}</div>
            )}
            {formData.points > 0 && (
              <div className="text-sm mt-2">Points: {formData.points}</div>
            )}
            {formData.balance > 0 && (
              <div className="text-sm">Balance: ${formData.balance}</div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Card"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {/* Wallet Pass Preview Modal */}
      <WalletPassPreview
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        cardData={{
          ...formData,
          logoUrl: logoUrl || undefined,
        }}
      />
    </div>
  );
}
