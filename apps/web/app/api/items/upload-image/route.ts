import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@repo/database";
import { requireAdmin } from "@/lib/with-auth";
import { ok, badRequest } from "@/lib/api-response";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "items");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** POST /api/items/upload-image - Upload item image (multipart/form-data) */
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("error" in authResult) return authResult.error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const itemId = formData.get("itemId") as string | null;
    const imageType = (formData.get("imageType") as string) || "gallery";
    const isMaster = formData.get("isMaster") === "true";

    if (!file || !itemId) {
      return badRequest("file and itemId are required");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return badRequest(
        `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return badRequest("File size must be under 5MB");
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });
    if (!item) {
      return badRequest("Item not found");
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = path.extname(file.name) || ".jpg";
    const filename = `${itemId}-${Date.now()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const imageUrl = `/uploads/items/${filename}`;

    if (isMaster) {
      await prisma.itemImage.updateMany({
        where: { itemId },
        data: { isMaster: false },
      });
    }

    const image = await prisma.itemImage.create({
      data: {
        itemId,
        imageType,
        imageUrl,
        isMaster,
      },
    });

    return ok({
      id: image.id,
      itemId: image.itemId,
      imageType: image.imageType,
      imageUrl: image.imageUrl,
      isMaster: image.isMaster,
    });
  } catch (e) {
    return badRequest("Failed to upload image");
  }
}
