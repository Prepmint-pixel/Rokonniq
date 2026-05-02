import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, Apple } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ContactData {
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedin: string;
  profileImage?: string;
  website?: string;
  bio?: string;
  socialLinks?: Array<{
    id: string;
    platform: string;
    url: string;
  }>;
  cardStyle?: {
    headerColor: string;
    buttonStyle: string;
    frameStyle: string;
    accentColor: string;
  };
}

interface WalletButtonsProps {
  contactData: ContactData;
  cardId: string;
  buttonRadius?: string;
  accentColor?: string;
}

/**
 * Wallet integration buttons for adding contact cards to Apple Wallet and Google Wallet
 */
export default function WalletButtons({
  contactData,
  cardId,
  buttonRadius = "rounded-xl",
  accentColor = "#3b82f6",
}: WalletButtonsProps) {
  const [isLoadingApple, setIsLoadingApple] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  const generateApplePass = trpc.wallet.generateApplePass.useMutation();
  const generateGooglePass = trpc.wallet.generateGooglePass.useMutation();

  const handleAddToAppleWallet = async () => {
    setIsLoadingApple(true);
    try {
      const result = await generateApplePass.mutateAsync({
        contactData,
        cardId,
      });

      if (result.success && result.buffer) {
        // Convert base64 to blob
        const binaryString = atob(result.buffer);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], {
          type: "application/vnd.apple.pkpass",
        });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename || "contact.pkpass";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error adding to Apple Wallet:", error);
      alert("Failed to generate Apple Wallet pass. Please try again.");
    } finally {
      setIsLoadingApple(false);
    }
  };

  const handleAddToGoogleWallet = async () => {
    setIsLoadingGoogle(true);
    try {
      const result = await generateGooglePass.mutateAsync({
        contactData,
        cardId,
      });

      if (result.success && result.addToGoogleWalletUrl) {
        // Open Google Wallet in new window
        window.open(result.addToGoogleWalletUrl, "_blank");
      }
    } catch (error) {
      console.error("Error adding to Google Wallet:", error);
      alert("Failed to generate Google Wallet pass. Please try again.");
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  return (
    <div className="flex gap-3 w-full">
      {/* Apple Wallet Button */}
      <Button
        onClick={handleAddToAppleWallet}
        disabled={isLoadingApple || isLoadingGoogle}
        className={`flex-1 flex items-center justify-center gap-2 h-10 ${buttonRadius} text-white font-medium transition-all duration-200 hover:shadow-lg`}
        style={{
          backgroundColor: isLoadingApple ? "#999" : accentColor,
          opacity: isLoadingApple || isLoadingGoogle ? 0.7 : 1,
        }}
      >
        {isLoadingApple ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            <Apple className="w-4 h-4" />
            <span className="hidden sm:inline">Apple Wallet</span>
            <span className="sm:hidden">Apple</span>
          </>
        )}
      </Button>

      {/* Google Wallet Button */}
      <Button
        onClick={handleAddToGoogleWallet}
        disabled={isLoadingApple || isLoadingGoogle}
        className={`flex-1 flex items-center justify-center gap-2 h-10 ${buttonRadius} text-white font-medium transition-all duration-200 hover:shadow-lg`}
        style={{
          backgroundColor: isLoadingGoogle ? "#999" : accentColor,
          opacity: isLoadingApple || isLoadingGoogle ? 0.7 : 1,
        }}
      >
        {isLoadingGoogle ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Google Wallet</span>
            <span className="sm:hidden">Google</span>
          </>
        )}
      </Button>
    </div>
  );
}
