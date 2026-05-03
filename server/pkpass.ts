import { PKPass } from "passkit-generator";
import * as fs from "fs";
import * as path from "path";
import { getPKPassIcons } from "./pkpassIcons";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface WalletCardData {
  title: string;
  description?: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  barcode?: string;
  barcodeFormat?: "QR" | "CODE128" | "PDF417";
  points?: number;
  balance?: number;
  expiryDate?: Date;
  logoUrl?: string;
}

/**
 * Create a minimal pass.json template for PKPass
 */
function createPassTemplate(cardData: WalletCardData): Record<string, any> {
  return {
    formatVersion: 1,
    passTypeIdentifier: "pass.io.rokonniq.card",
    serialNumber: "unique-serial-number",
    teamIdentifier: process.env.APPLE_TEAM_ID || "EXAMPLE123", // Replace with your 10-char Apple Team ID
    organizationName: "ROKONNIQ",
    description: cardData.description || cardData.title,
    foregroundColor: `rgb(${hexToRgb(cardData.textColor)})`,
    backgroundColor: `rgb(${hexToRgb(cardData.backgroundColor)})`,
    labelColor: `rgb(${hexToRgb(cardData.accentColor)})`,
    generic: {
      primaryFields: [
        {
          key: "title",
          label: "Card",
          value: cardData.title,
        },
      ],
      secondaryFields: cardData.description
        ? [
            {
              key: "description",
              label: "Description",
              value: cardData.description,
            },
          ]
        : [],
      auxiliaryFields: [
        ...(cardData.points !== undefined
          ? [
              {
                key: "points",
                label: "Points",
                value: cardData.points.toString(),
              },
            ]
          : []),
        ...(cardData.balance !== undefined
          ? [
              {
                key: "balance",
                label: "Balance",
                value: `$${cardData.balance.toFixed(2)}`,
              },
            ]
          : []),
      ],
      backFields: [],
    },
    barcode: cardData.barcode
      ? {
          format: cardData.barcodeFormat || "QR",
          message: cardData.barcode,
          messageEncoding: "iso-8859-1",
        }
      : undefined,
  };
}

/**
 * Convert hex color to RGB string
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return "31, 41, 55"; // Default dark gray
  }
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `${r}, ${g}, ${b}`;
}

/**
 * Generate a PKPass file for Apple Wallet
 */
export async function generatePKPass(
  cardId: string,
  cardData: WalletCardData
): Promise<Buffer> {
  // Ensure icons are downloaded before generating pass
  try {
    await getPKPassIcons();
  } catch (error) {
    console.warn("Warning: Could not load PKPass icons, generating pass without icons", error);
  }
  try {
    // Get certificate paths
    const certPath = path.join(__dirname, "certificates", "certificate.pem");
    const keyPath = path.join(__dirname, "certificates", "key.pem");

    // Read certificates
    const certificate = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);

    // Create pass template
    const passTemplate = createPassTemplate(cardData);
    passTemplate.serialNumber = cardId;

    // Get icons
    const icons = await getPKPassIcons();

    // Create PKPass instance with template and icons
    const pass = new PKPass(
      {
        "pass.json": Buffer.from(JSON.stringify(passTemplate)),
        "icon.png": icons.icon,
        "icon@2x.png": icons["icon@2x"],
        "icon@3x.png": icons["icon@3x"],
      },
      {
        wwdr: certificate,
        signerCert: certificate,
        signerKey: key,
      }
    );

    // Generate the pass file
    const buffer = await pass.getAsBuffer();
    return buffer;
  } catch (error) {
    console.error("Error generating PKPass:", error);
    throw new Error(
      `Failed to generate PKPass: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Validate certificate files exist
 */
export function validateCertificates(): boolean {
  const certPath = path.join(__dirname, "certificates", "certificate.pem");
  const keyPath = path.join(__dirname, "certificates", "key.pem");

  return fs.existsSync(certPath) && fs.existsSync(keyPath);
}

/**
 * Get certificate info for debugging
 */
export function getCertificateInfo(): {
  hasCertificates: boolean;
  certPath: string;
  keyPath: string;
} {
  const certPath = path.join(__dirname, "certificates", "certificate.pem");
  const keyPath = path.join(__dirname, "certificates", "key.pem");

  return {
    hasCertificates: validateCertificates(),
    certPath,
    keyPath,
  };
}
