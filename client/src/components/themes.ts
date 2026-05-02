import { CardStyle } from "./CustomizationPanel";

export interface Theme {
  id: string;
  name: string;
  description: string;
  cardStyle: CardStyle;
}

export const THEMES: Theme[] = [
  {
    id: "professional",
    name: "Professional",
    description: "Clean and corporate",
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
  },
  {
    id: "creative",
    name: "Creative",
    description: "Vibrant and modern",
    cardStyle: {
      backgroundType: "gradient",
      headerColor: "#7c3aed",
      accentColor: "#ec4899",
      gradientType: "linear",
      gradientColors: ["#7c3aed", "#ec4899"],
      gradientRotation: 45,
      buttonStyle: "pill",
      frameStyle: "gradient",
      titleFont: "Georgia",
      titleSize: 32,
      textFont: "Helvetica",
      textColor: "#ffffff",
      showBranding: true,
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and clean",
    cardStyle: {
      backgroundType: "solid",
      headerColor: "#ffffff",
      accentColor: "#000000",
      buttonStyle: "square",
      frameStyle: "minimal",
      titleFont: "Helvetica",
      titleSize: 24,
      textFont: "Helvetica",
      textColor: "#000000",
      showBranding: false,
    },
  },
  {
    id: "vibrant",
    name: "Vibrant",
    description: "Bold and energetic",
    cardStyle: {
      backgroundType: "gradient",
      headerColor: "#f97316",
      accentColor: "#fbbf24",
      gradientType: "radial",
      gradientColors: ["#f97316", "#fbbf24"],
      gradientRotation: 0,
      buttonStyle: "pill",
      frameStyle: "solid",
      titleFont: "Arial",
      titleSize: 30,
      textFont: "Arial",
      textColor: "#ffffff",
      showBranding: true,
    },
  },
];
