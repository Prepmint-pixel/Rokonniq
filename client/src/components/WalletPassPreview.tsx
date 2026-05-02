import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Apple, Smartphone } from "lucide-react";

interface WalletPassPreviewProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cardData: {
    title: string;
    description?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    logoUrl?: string;
    points?: number;
    balance?: number;
  };
}

export function WalletPassPreview({
  isOpen,
  onOpenChange,
  cardData,
}: WalletPassPreviewProps) {
  const bgColor = cardData.backgroundColor || "#1F2937";
  const textColor = cardData.textColor || "#FFFFFF";
  const accentColor = cardData.accentColor || "#3B82F6";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Wallet Pass Preview</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="apple" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="apple" className="flex items-center gap-2">
              <Apple className="w-4 h-4" />
              Apple Wallet
            </TabsTrigger>
            <TabsTrigger value="google" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Google Wallet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="apple" className="flex justify-center py-8">
            <div className="w-full max-w-sm">
              {/* iPhone Frame */}
              <div className="bg-black rounded-3xl p-3 shadow-2xl" style={{ aspectRatio: "9/19.5" }}>
                <div className="bg-gray-900 rounded-2xl w-full h-full overflow-hidden flex flex-col items-center justify-center p-4">
                  {/* Status Bar */}
                  <div className="w-full text-white text-xs mb-4 text-center">
                    <div className="flex justify-between px-4 mb-2">
                      <span>9:41</span>
                      <span>📶 📡 🔋</span>
                    </div>
                  </div>

                  {/* Apple Wallet Pass */}
                  <div
                    className="w-full rounded-2xl shadow-lg overflow-hidden"
                    style={{
                      backgroundColor: bgColor,
                      color: textColor,
                      aspectRatio: "16/10",
                    }}
                  >
                    <div className="p-6 h-full flex flex-col justify-between">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm opacity-75">LOYALTY CARD</div>
                          <div className="text-2xl font-bold">{cardData.title}</div>
                        </div>
                        {cardData.logoUrl && (
                          <img
                            src={cardData.logoUrl}
                            alt="Logo"
                            className="w-12 h-12 rounded-lg"
                          />
                        )}
                      </div>

                      {/* Middle Content */}
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-xs opacity-75">POINTS</div>
                          <div className="text-3xl font-bold">{cardData.points || 0}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-75">BALANCE</div>
                          <div className="text-3xl font-bold">${cardData.balance || 0}</div>
                        </div>
                      </div>

                      {/* Footer - Barcode placeholder */}
                      <div className="flex justify-center">
                        <div
                          className="w-32 h-8 rounded"
                          style={{ backgroundColor: accentColor, opacity: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Wallet App Label */}
                  <div className="mt-4 text-white text-xs text-center">Wallet</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="google" className="flex justify-center py-8">
            <div className="w-full max-w-sm">
              {/* Android Frame */}
              <div className="bg-black rounded-3xl p-2 shadow-2xl" style={{ aspectRatio: "9/19.5" }}>
                <div className="bg-gray-900 rounded-2xl w-full h-full overflow-hidden flex flex-col items-center justify-center p-4">
                  {/* Status Bar */}
                  <div className="w-full text-white text-xs mb-4 text-center">
                    <div className="flex justify-between px-4 mb-2">
                      <span>9:41</span>
                      <span>📶 📡 🔋</span>
                    </div>
                  </div>

                  {/* Google Wallet Pass */}
                  <div
                    className="w-full rounded-xl shadow-lg overflow-hidden"
                    style={{
                      backgroundColor: bgColor,
                      color: textColor,
                      aspectRatio: "16/10",
                    }}
                  >
                    <div className="p-6 h-full flex flex-col justify-between">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs opacity-75 font-semibold">LOYALTY</div>
                          <div className="text-xl font-bold">{cardData.title}</div>
                          {cardData.description && (
                            <div className="text-xs opacity-75 mt-1">{cardData.description}</div>
                          )}
                        </div>
                        {cardData.logoUrl && (
                          <img
                            src={cardData.logoUrl}
                            alt="Logo"
                            className="w-10 h-10 rounded"
                          />
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs opacity-75">Points Balance</div>
                          <div className="text-2xl font-bold">{cardData.points || 0}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-75">Account Balance</div>
                          <div className="text-2xl font-bold">${cardData.balance || 0}</div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex justify-center">
                        <div
                          className="w-24 h-6 rounded"
                          style={{ backgroundColor: accentColor, opacity: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Google Pay Label */}
                  <div className="mt-4 text-white text-xs text-center">Google Pay</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-xs text-gray-500 text-center mt-4">
          This is a preview of how your pass will appear in Apple Wallet and Google Wallet.
          Actual appearance may vary slightly based on device and wallet version.
        </div>
      </DialogContent>
    </Dialog>
  );
}
