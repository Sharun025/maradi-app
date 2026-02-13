import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { requireAuth } from "@/lib/with-auth";
import { SerialStatus } from "@repo/shared";
import { ok, badRequest, notFound } from "@/lib/api-response";

/** POST /api/serials - Scan QR, add serial to inventory */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    const body = await req.json();
    const {
      itemId,
      serialNumber,
      batchNumber,
      quantity,
      imageUrl,
    } = body as Record<string, unknown>;

    if (!itemId || !serialNumber) {
      return badRequest("itemId and serialNumber are required");
    }

    const item = await prisma.item.findUnique({
      where: { id: String(itemId) },
    });
    if (!item) {
      return notFound("Item not found");
    }

    const qty = quantity != null ? Math.max(1, Number(quantity)) : 1;

    const serial = await prisma.serial.create({
      data: {
        itemId: String(itemId),
        serialNumber: String(serialNumber).trim(),
        batchNumber: batchNumber != null ? String(batchNumber) : null,
        quantity: qty,
        status: SerialStatus.AVAILABLE,
        addedBy: authResult.payload.userId,
        imageUrl: imageUrl != null ? String(imageUrl) : null,
      },
      include: { item: true },
    });

    return ok({
      ...serial,
      item: {
        ...serial.item,
        masterPrice: Number(serial.item.masterPrice),
      },
    });
  } catch (e) {
    return badRequest("Invalid request body");
  }
}
