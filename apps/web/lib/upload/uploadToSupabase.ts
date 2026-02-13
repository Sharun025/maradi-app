/**
 * Upload files to Supabase Storage with image processing
 */

import { supabase } from "./supabase";
import { resizeAndCompress, createThumbnail } from "./image-processor";
import {
  ALLOWED_MIME_TYPES,
  buildFolderPath,
  type UploadFolder,
} from "./constants";

const BUCKET = "uploads";
const EXT_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export interface UploadResult {
  url: string;
  thumbnailUrl?: string;
}

/**
 * Upload file to Supabase Storage.
 * - Resizes/compresses images (max 1200px, 85% quality)
 * - Generates thumbnail (400px width)
 * - Returns public URL(s)
 *
 * @param file - File or Buffer with image data
 * @param folder - master-items | serials | batches
 * @param itemCode - Required when folder is master-items
 * @returns Public URL and optional thumbnail URL
 */
export async function uploadToSupabase(
  file: File | { buffer: Buffer; type: string; name?: string },
  folder: UploadFolder,
  itemCode?: string
): Promise<UploadResult> {
  if (!supabase) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const mime = file.type as (typeof ALLOWED_MIME_TYPES)[number];
  if (!ALLOWED_MIME_TYPES.includes(mime)) {
    throw new Error(
      `Unsupported format. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  const basePath = buildFolderPath(folder, itemCode);
  const timestamp = Date.now();
  const ext = EXT_MAP[mime] ?? ".jpg";

  let inputBuffer: Buffer;
  if (file instanceof File) {
    inputBuffer = Buffer.from(await file.arrayBuffer());
  } else {
    inputBuffer = file.buffer;
  }

  const { buffer, mime: outMime } = await resizeAndCompress(inputBuffer, mime);
  const extOut = EXT_MAP[outMime] ?? ext;
  const mainPath = `${basePath}/${timestamp}${extOut}`;

  const { error: mainError } = await supabase.storage
    .from(BUCKET)
    .upload(mainPath, buffer, {
      contentType: outMime,
      upsert: false,
    });

  if (mainError) {
    throw new Error(`Upload failed: ${mainError.message}`);
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(mainPath);
  const url = urlData.publicUrl;

  // Generate and upload thumbnail
  let thumbnailUrl: string | undefined;
  try {
    const thumbBuffer = await createThumbnail(inputBuffer, mime);
    const thumbPath = `${basePath}/${timestamp}_thumb${extOut}`;

    const { error: thumbError } = await supabase.storage
      .from(BUCKET)
      .upload(thumbPath, thumbBuffer, {
        contentType: outMime,
        upsert: false,
      });

    if (!thumbError) {
      const { data: thumbUrlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(thumbPath);
      thumbnailUrl = thumbUrlData.publicUrl;
    }
  } catch {
    // Thumbnail is optional; proceed without it
  }

  return { url, thumbnailUrl };
}
