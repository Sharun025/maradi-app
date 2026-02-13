/**
 * Image processing: resize, compress, thumbnail generation
 */

import sharp from "sharp";
import {
  ALLOWED_MIME_TYPES,
  IMAGE_OPTIONS,
  type UploadFolder,
} from "./constants";

export type ProcessedImage = {
  buffer: Buffer;
  mime: string;
  width: number;
  height: number;
};

/**
 * Resize and compress image (max 1200px width, 85% quality).
 * Returns processed buffer and metadata.
 */
export async function resizeAndCompress(
  input: Buffer,
  mime: (typeof ALLOWED_MIME_TYPES)[number]
): Promise<ProcessedImage> {
  const meta = await sharp(input).metadata();
  const width = meta.width ?? IMAGE_OPTIONS.maxWidth;
  const needsResize = width > IMAGE_OPTIONS.maxWidth;

  let pipeline = sharp(input);

  if (needsResize) {
    pipeline = pipeline.resize(IMAGE_OPTIONS.maxWidth, null, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const sharpFormat =
    mime === "image/webp"
      ? "webp"
      : mime === "image/png"
        ? "png"
        : "jpeg";

  const outputBuffer = await pipeline
    .toFormat(sharpFormat, {
      quality: IMAGE_OPTIONS.quality,
      ...(sharpFormat === "jpeg" && { mozjpeg: true }),
    })
    .toBuffer();

  const { width: outW, height: outH } = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    mime,
    width: outW ?? width,
    height: outH ?? 0,
  };
}

/**
 * Generate thumbnail (400px width).
 */
export async function createThumbnail(
  input: Buffer,
  mime: (typeof ALLOWED_MIME_TYPES)[number]
): Promise<Buffer> {
  const sharpFormat =
    mime === "image/webp"
      ? "webp"
      : mime === "image/png"
        ? "png"
        : "jpeg";

  return sharp(input)
    .resize(IMAGE_OPTIONS.thumbnailWidth, null, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .toFormat(sharpFormat, { quality: 80 })
    .toBuffer();
}
