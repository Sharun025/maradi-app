/**
 * POST /api/upload
 *
 * Accepts multipart/form-data:
 *   - file: image file (required)
 *   - folder: 'master-items' | 'serials' | 'batches' (required)
 *   - itemCode: required when folder is 'master-items'
 *
 * Validates: JPEG/PNG/WEBP, max 10MB
 * Returns: { url, thumbnailUrl? }
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/with-auth";
import { uploadToSupabase } from "@/lib/upload";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  type UploadFolder,
} from "@/lib/upload";
import { ok, badRequest, serverError } from "@/lib/api-response";

const VALID_FOLDERS: UploadFolder[] = ["master-items", "serials", "batches"];

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as string | null;
    const itemCode = (formData.get("itemCode") as string) || undefined;

    if (!file || typeof file === "string") {
      return badRequest("file is required");
    }

    if (!folder || !VALID_FOLDERS.includes(folder as UploadFolder)) {
      return badRequest(
        `folder is required and must be one of: ${VALID_FOLDERS.join(", ")}`
      );
    }

    if (folder === "master-items" && !itemCode?.trim()) {
      return badRequest("itemCode is required when folder is master-items");
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return badRequest(
        `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return badRequest(
        `File too large. Maximum size: ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`
      );
    }

    const uploadFolder = folder as UploadFolder;
    const result = await uploadToSupabase(file, uploadFolder, itemCode?.trim());

    return ok({
      url: result.url,
      ...(result.thumbnailUrl && { thumbnailUrl: result.thumbnailUrl }),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    if (message.includes("Supabase is not configured")) {
      return serverError(
        "Upload service is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
      );
    }
    return badRequest(message);
  }
}
