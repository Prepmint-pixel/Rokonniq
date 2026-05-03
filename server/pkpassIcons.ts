import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get PKPass icons from local files
 * Icons are stored in server/certificates/ directory as PNG files
 */
export async function getPKPassIcons(): Promise<Record<string, Buffer>> {
  const certDir = path.join(__dirname, "certificates");
  const icons: Record<string, Buffer> = {};

  try {
    // Read local PNG icon files
    const iconPath = path.join(certDir, "icon.png");
    const icon2xPath = path.join(certDir, "icon@2x.png");
    const icon3xPath = path.join(certDir, "icon@3x.png");

    // Check if files exist
    if (!fs.existsSync(iconPath)) {
      throw new Error(`Icon file not found: ${iconPath}`);
    }
    if (!fs.existsSync(icon2xPath)) {
      throw new Error(`Icon file not found: ${icon2xPath}`);
    }
    if (!fs.existsSync(icon3xPath)) {
      throw new Error(`Icon file not found: ${icon3xPath}`);
    }

    // Read icon files
    icons.icon = fs.readFileSync(iconPath);
    icons["icon@2x"] = fs.readFileSync(icon2xPath);
    icons["icon@3x"] = fs.readFileSync(icon3xPath);

    // Validate PNG signatures
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

    for (const [name, buffer] of Object.entries(icons)) {
      const sig = buffer.slice(0, 4);
      if (!sig.equals(pngSignature)) {
        throw new Error(`Invalid PNG signature for ${name}`);
      }
    }

    return icons;
  } catch (error) {
    console.error("Error loading PKPass icons:", error);
    throw error;
  }
}

/**
 * Validate that icon files exist
 */
export function validateIconFiles(): boolean {
  const certDir = path.join(__dirname, "certificates");
  const iconPath = path.join(certDir, "icon.png");
  const icon2xPath = path.join(certDir, "icon@2x.png");
  const icon3xPath = path.join(certDir, "icon@3x.png");

  return (
    fs.existsSync(iconPath) &&
    fs.existsSync(icon2xPath) &&
    fs.existsSync(icon3xPath)
  );
}

/**
 * Get icon file info
 */
export function getIconFileInfo(): {
  exist: boolean;
  sizes: Record<string, number>;
} {
  const certDir = path.join(__dirname, "certificates");
  const sizes: Record<string, number> = {};

  const files = [
    { name: "icon", path: path.join(certDir, "icon.png") },
    { name: "icon@2x", path: path.join(certDir, "icon@2x.png") },
    { name: "icon@3x", path: path.join(certDir, "icon@3x.png") },
  ];

  for (const file of files) {
    if (fs.existsSync(file.path)) {
      const stats = fs.statSync(file.path);
      sizes[file.name] = stats.size;
    }
  }

  return {
    exist: validateIconFiles(),
    sizes,
  };
}
