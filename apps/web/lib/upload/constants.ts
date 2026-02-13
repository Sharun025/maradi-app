/**
 * Upload constants: supported formats, size limits, image dimensions
 */

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const IMAGE_OPTIONS = {
  /** Max width for main image (px) */
  maxWidth: 1200,
  /** JPEG/WebP quality (0–100) */
  quality: 85,
  /** Thumbnail width (px) */
  thumbnailWidth: 400,
} as const;

/** Folder paths for organizing uploads */
export type UploadFolder = "master-items" | "serials" | "batches";

export function buildFolderPath(
  folder: UploadFolder,
  itemCode?: string
): string {
  switch (folder) {
    case "master-items":
      if (!itemCode) {
        throw new Error("itemCode required for master-items folder");
      }
      return `master-items/${itemCode}`;
    case "serials":
      return "serials";
    case "batches":
      return "batches";
    default:
      throw new Error(`Unknown folder: ${folder}`);
  }
}
