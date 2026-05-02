// ROKONNIQ Storage — Cloudinary
// Replaces the original Forge/S3 implementation.
// Keeps the same exported function signatures so no other files need changing.
//
// Required env vars:
//   CLOUDINARY_CLOUD_NAME
//   CLOUDINARY_API_KEY
//   CLOUDINARY_API_SECRET

import { v2 as cloudinary } from "cloudinary";

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary config missing: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET"
    );
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

function keyToPublicId(relKey: string): { folder: string; publicId: string } {
  const clean = relKey.replace(/^\/+/, "");
  const lastSlash = clean.lastIndexOf("/");
  const folder   = lastSlash === -1 ? "rokonniq" : `rokonniq/${clean.slice(0, lastSlash)}`;
  const filename = lastSlash === -1 ? clean : clean.slice(lastSlash + 1);
  const publicId = filename.replace(/\.[^.]+$/, "");
  const hash = Math.random().toString(36).slice(2, 10);
  return { folder, publicId: `${publicId}_${hash}` };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  getCloudinaryConfig();
  const { folder, publicId } = keyToPublicId(relKey);
  const buffer  = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  const base64  = buffer.toString("base64");
  const dataUri = `data:${contentType};base64,${base64}`;
  const resourceType = contentType.startsWith("image/") ? "image" : "raw";

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    public_id: publicId,
    resource_type: resourceType,
    overwrite: true,
  });

  const key = `${folder.replace("rokonniq/", "")}/${publicId}`;
  return { key, url: result.secure_url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  getCloudinaryConfig();
  const { folder, publicId } = keyToPublicId(relKey);
  const url = cloudinary.url(`${folder}/${publicId}`, { secure: true });
  return { key: relKey, url };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const { url } = await storageGet(relKey);
  return url;
}
