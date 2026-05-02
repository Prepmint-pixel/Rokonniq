/**
 * Contact data structure for wallet generation
 */
export interface ContactData {
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedin: string;
  profileImage?: string;
  website?: string;
  bio?: string;
  address?: string;
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

/**
 * Generate Apple Wallet (.pkpass) file for a contact card
 * Note: This requires proper Apple certificates and team identifiers
 */
export async function generateAppleWalletPass(
  contactData: ContactData,
  cardId: string
): Promise<Buffer> {
  try {
    // For now, return a placeholder buffer
    // In production, you would use passkit-generator with proper certificates
    const vCardData = generateVCard(contactData);
    return Buffer.from(vCardData, "utf-8");
  } catch (error) {
    console.error("Error generating Apple Wallet pass:", error);
    throw new Error("Failed to generate Apple Wallet pass");
  }
}

/**
 * Generate Google Wallet JWT for a contact card
 * Note: This requires proper Google Wallet service account credentials
 */
export async function generateGoogleWalletJWT(
  contactData: ContactData,
  cardId: string
): Promise<string> {
  try {
    // For now, return a placeholder JWT
    // In production, you would use google-wallet SDK with proper credentials
    const payload = {
      cardId,
      name: contactData.name,
      title: contactData.title,
      email: contactData.email,
      phone: contactData.phone,
      timestamp: new Date().toISOString(),
    };

    // Encode as base64 for demonstration
    return Buffer.from(JSON.stringify(payload)).toString("base64");
  } catch (error) {
    console.error("Error generating Google Wallet JWT:", error);
    throw new Error("Failed to generate Google Wallet JWT");
  }
}

/**
 * Generate vCard format for contact information
 */
export function generateVCard(contactData: ContactData): string {
  // Parse full name into first and last name
  const nameParts = contactData.name.trim().split(/\s+/);
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : contactData.name;

  // Format address for vCard (ADR field: PO Box;Extended Address;Street;Locality;Region;Postal Code;Country)
  const addressLine = contactData.address || "";

  return `BEGIN:VCARD
VERSION:3.0
N:${lastName};${firstName};;;
FN:${contactData.name}
TITLE:${contactData.title}
EMAIL:${contactData.email}
TEL:${contactData.phone}
ADR:;;${addressLine};;;;
URL:${contactData.linkedin}
NOTE:${contactData.bio || ""}
END:VCARD`;
}

/**
 * Generate wallet pass URL for sharing
 */
export function generateWalletShareUrl(
  cardId: string,
  platform: "apple" | "google"
): string {
  if (platform === "apple") {
    return `/api/wallet/apple/${cardId}`;
  } else {
    return `/api/wallet/google/${cardId}`;
  }
}
