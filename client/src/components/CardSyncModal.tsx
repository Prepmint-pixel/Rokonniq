import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Download, Upload, Copy, Check } from "lucide-react";
import { CardCollection } from "@/lib/cardManager";
import { exportCardData, importCardData, generateShareLink, mergeCardCollections } from "@/lib/cardSync";

interface CardSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardCollection: CardCollection;
  onImport: (collection: CardCollection) => void;
}

export default function CardSyncModal({
  isOpen,
  onClose,
  cardCollection,
  onImport,
}: CardSyncModalProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      exportCardData(cardCollection);
    } catch (error) {
      setImportError("Failed to export card data");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const importedCollection = await importCardData(file);
      const merged = mergeCardCollections(cardCollection, importedCollection);
      onImport(merged);
      onClose();
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Failed to import card data");
    } finally {
      setIsImporting(false);
    }
  };

  const handleCopyShareLink = () => {
    try {
      const link = generateShareLink(cardCollection);
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      setImportError("Failed to copy share link");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sync Card Data</DialogTitle>
          <DialogDescription>
            Export your cards to backup or import cards from another device
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Export Section */}
          <div className="border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-2">Export Cards</h3>
            <p className="text-sm text-slate-600 mb-3">
              Download your card data as a JSON file to backup or transfer to another device
            </p>
            <Button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4" />
              Export as JSON
            </Button>
          </div>

          {/* Import Section */}
          <div className="border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-2">Import Cards</h3>
            <p className="text-sm text-slate-600 mb-3">
              Upload a previously exported JSON file to restore your cards
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={handleImportClick}
              disabled={isImporting}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {isImporting ? "Importing..." : "Import from JSON"}
            </Button>
          </div>

          {/* Share Link Section */}
          <div className="border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-2">Share Link</h3>
            <p className="text-sm text-slate-600 mb-3">
              Generate a shareable link to sync cards (limited to small datasets)
            </p>
            <Button
              onClick={handleCopyShareLink}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4" />
                  Link Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Share Link
                </>
              )}
            </Button>
          </div>

          {/* Error Message */}
          {importError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{importError}</p>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> Export your cards regularly as a backup. When you import, new cards are merged with existing ones.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
