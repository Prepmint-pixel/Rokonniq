import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut } from "lucide-react";

interface ImageCropModalProps {
  imageUrl: string;
  onCropChange: (cropX: number, cropY: number, zoom: number) => void;
  onClose: () => void;
  initialCropX?: number;
  initialCropY?: number;
  initialZoom?: number;
}

export function ImageCropModal({
  imageUrl,
  onCropChange,
  onClose,
  initialCropX = 50,
  initialCropY = 50,
  initialZoom = 1,
}: ImageCropModalProps) {
  const [cropX, setCropX] = useState(initialCropX);
  const [cropY, setCropY] = useState(initialCropY);
  const [zoom, setZoom] = useState(initialZoom);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    // Convert pixel movement to percentage
    const percentX = (deltaX / containerWidth) * 100;
    const percentY = (deltaY / containerHeight) * 100;

    setCropX(Math.max(0, Math.min(100, cropX - percentX)));
    setCropY(Math.max(0, Math.min(100, cropY - percentY)));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove as any);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove as any);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, cropX, cropY, dragStart]);

  const handleZoomIn = () => {
    setZoom(Math.min(3, zoom + 0.2));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(1, zoom - 0.2));
  };

  const handleSave = () => {
    onCropChange(cropX, cropY, zoom);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Crop & Position Image</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 flex flex-col gap-4">
          {/* Preview Container - Simulating card header aspect ratio */}
          <div
            ref={containerRef}
            className="bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300 cursor-move"
            style={{
              aspectRatio: "16 / 9",
              position: "relative",
            }}
            onMouseDown={handleMouseDown}
          >
            <img
              src={imageUrl}
              alt="Crop preview"
              className="w-full h-full object-cover"
              style={{
                objectPosition: `${cropX}% ${cropY}%`,
                transform: `scale(${zoom})`,
                transformOrigin: `${cropX}% ${cropY}%`,
                cursor: isDragging ? "grabbing" : "grab",
              }}
              draggable={false}
            />
            {/* Crosshair overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-2 border-white rounded-full shadow-lg" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />
            </div>
          </div>

          {/* Info Text */}
          <p className="text-sm text-gray-600">
            Drag to reposition • Use zoom controls to adjust scale • This preview shows how the image will appear in your card header
          </p>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 1}
              >
                <ZoomOut size={16} />
              </Button>
              <span className="text-sm font-medium w-12 text-center">
                {zoom.toFixed(1)}x
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn size={16} />
              </Button>
            </div>

            {/* Position Display */}
            <div className="flex-1 text-sm text-gray-600">
              Position: X {cropX.toFixed(0)}% • Y {cropY.toFixed(0)}%
            </div>
          </div>

          {/* Sliders for fine-tuning */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Horizontal Position</label>
              <input
                type="range"
                min="0"
                max="100"
                value={cropX}
                onChange={(e) => setCropX(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Vertical Position</label>
              <input
                type="range"
                min="0"
                max="100"
                value={cropY}
                onChange={(e) => setCropY(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Apply Crop
          </Button>
        </div>
      </div>
    </div>
  );
}
