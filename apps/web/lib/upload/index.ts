/**
 * File upload utilities for Supabase Storage
 *
 * - uploadToSupabase(file, folder, itemCode?) → public URL
 * - Resize/compress images (max 1200px, 85% quality)
 * - Thumbnails (400px width)
 * - Supported: JPEG, PNG, WEBP
 * - Folders: master-items/{itemCode}/, serials/, batches/
 */

export {
  uploadToSupabase,
  type UploadResult,
} from "./uploadToSupabase";

export {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  IMAGE_OPTIONS,
  buildFolderPath,
  type UploadFolder,
} from "./constants";
