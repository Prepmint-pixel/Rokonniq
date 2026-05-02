import React, { ReactNode } from "react";
import { User, Grid3x3, Palette, Sparkles } from "lucide-react";

interface ROKONNIQDashboardLayoutProps {
  children: ReactNode;
  onProfileClick?: () => void;
  onBlocksClick?: () => void;
  onDesignClick?: () => void;
  onThemesClick?: () => void;
  activeTab?: "profile" | "blocks" | "design" | "themes";
}

/**
 * ROKONNIQ Dashboard Layout
 * Features a left sidebar with icon buttons and full-width action buttons
 */
export default function WiseryDashboardLayout({
  children,
  onProfileClick,
  onBlocksClick,
  onDesignClick,
  onThemesClick,
  activeTab,
}: ROKONNIQDashboardLayoutProps) {
  const getIconButtonClass = (isActive: boolean) => {
    return `w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
      isActive
        ? "bg-black text-white shadow-lg"
        : "bg-white text-black border border-slate-200 hover:bg-slate-50"
    }`;
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Sidebar */}
      <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6">
        {/* Profile Button */}
        <button
          onClick={onProfileClick}
          className={getIconButtonClass(activeTab === "profile")}
          title="Profile"
        >
          <User className="w-6 h-6" />
        </button>

        {/* Blocks Button */}
        <button
          onClick={onBlocksClick}
          className={getIconButtonClass(activeTab === "blocks")}
          title="Blocks"
        >
          <Grid3x3 className="w-6 h-6" />
        </button>

        {/* Design Button */}
        <button
          onClick={onDesignClick}
          className={getIconButtonClass(activeTab === "design")}
          title="Design"
        >
          <Palette className="w-6 h-6" />
        </button>

        {/* Themes Button */}
        <button
          onClick={onThemesClick}
          className={getIconButtonClass(activeTab === "themes")}
          title="Themes"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
