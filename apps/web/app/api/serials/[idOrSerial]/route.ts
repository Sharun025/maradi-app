import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { requireAuth } from "@/lib/with-auth";
import { ok, notFound, badRequest } from "@/lib/api-response";

/** CUID format: c + 24 alphanumeric chars */
function isLikelyCuid(str: string): boolean {
  return /^c[a-z0-9]{24}$/i.test(str);
}

/** GET /api/serials/[serialNumber] - Get serial by serialNumber or id */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSerial: string }> }
) {
  try {
    const { idOrSerial } = await params;
    const decoded = decodeURIComponent(idOrSerial);

    let serial;
    if (isLikelyCuid(decoded)) {
      serial = await prisma.serial.findUnique({
        where: { id: decoded },
        include: { item: true },
      });
    }
    if (!serial) {
      serial = await prisma.serial.findFirst({
        where: { serialNumber: decoded },
        include: { item: true },
      });
    }

    if (!serial) {
      return notFound("Serial not found");
    }

    return ok({
      ...serial,
      item: {
        ...serial.item,
        masterPrice: Number(serial.item.masterPrice),
      },
    });
  } catch {
    return badRequest("Invalid request");
  }
}

/** PUT /api/serials/[serialId] - Update serial */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSerial: string }> }
) {
  const authResult = await requireAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    const { idOrSerial } = await params;
    const serialId = decodeURIComponent(idOrSerial);

    const serial = await prisma.serial.findUnique({
      where: { id: serialId },
    });
    if (!serial) {
      return notFound("Serial not found");
    }

    const body = await req.json();
    const { batchNumber, imageUrl, quantity, status } = body as Record<
      string,
      unknown
    >;

    const updateData: Record<string, unknown> = {};
    if (batchNumber !== undefined)
      updateData.batchNumber = batchNumber == null ? null : String(batchNumber);
    if (imageUrl !== undefined)
      updateData.imageUrl = imageUrl == null ? null : String(imageUrl);
    if (quantity !== undefined) {
      const q = Number(quantity);
      if (isNaN(q) || q < 1) return badRequest("Invalid quantity");
      updateData.quantity = q;
    }
    if (status !== undefined) updateData.status = String(status);

    const updated = await prisma.serial.update({
      where: { id: serialId },
      data: updateData,
      include: { item: true },
    });

    return ok({
      ...updated,
      item: {
        ...updated.item,
        masterPrice: Number(updated.item.masterPrice),
      },
    });
  } catch {
    return badRequest("Invalid request body");
  }
}
