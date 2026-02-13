import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { requireAdmin } from "@/lib/with-auth";
import { ok, notFound, badRequest } from "@/lib/api-response";

/** GET /api/items/[itemCode] - Get single item by itemCode */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ itemCode: string }> }
) {
  try {
    const { itemCode } = await params;

    const item = await prisma.item.findUnique({
      where: { itemCode: decodeURIComponent(itemCode) },
      include: { images: true },
    });

    if (!item) {
      return notFound("Item not found");
    }

    return ok({
      ...item,
      masterPrice: Number(item.masterPrice),
      aPrice: item.aPrice ? Number(item.aPrice) : null,
      bPrice: item.bPrice ? Number(item.bPrice) : null,
      cPrice: item.cPrice ? Number(item.cPrice) : null,
    });
  } catch {
    return badRequest("Invalid request");
  }
}

/** PUT /api/items/[itemCode] - Update item */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ itemCode: string }> }
) {
  const authResult = await requireAdmin(req);
  if ("error" in authResult) return authResult.error;

  try {
    const { itemCode } = await params;
    const decoded = decodeURIComponent(itemCode);

    const body = await req.json();
    const {
      itemName,
      category,
      subcategory,
      hsnCode,
      inventoryType,
      uom,
      masterPrice,
      aPrice,
      bPrice,
      cPrice,
      isActive,
    } = body as Record<string, unknown>;

    const item = await prisma.item.findUnique({
      where: { itemCode: decoded },
    });

    if (!item) {
      return notFound("Item not found");
    }

    const updateData: Record<string, unknown> = {};
    if (itemName !== undefined) updateData.itemName = String(itemName).trim();
    if (category !== undefined) updateData.category = String(category).trim();
    if (subcategory !== undefined)
      updateData.subcategory =
        subcategory == null ? null : String(subcategory).trim();
    if (hsnCode !== undefined)
      updateData.hsnCode = hsnCode == null ? null : String(hsnCode).trim();
    if (inventoryType !== undefined)
      updateData.inventoryType = String(inventoryType).trim();
    if (uom !== undefined) updateData.uom = String(uom).trim();
    if (masterPrice !== undefined) {
      const n = Number(masterPrice);
      if (isNaN(n) || n < 0) return badRequest("Invalid masterPrice");
      updateData.masterPrice = n;
    }
    if (aPrice !== undefined)
      updateData.aPrice = aPrice == null ? null : Number(aPrice);
    if (bPrice !== undefined)
      updateData.bPrice = bPrice == null ? null : Number(bPrice);
    if (cPrice !== undefined)
      updateData.cPrice = cPrice == null ? null : Number(cPrice);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.item.update({
      where: { itemCode: decoded },
      data: updateData,
      include: { images: true },
    });

    return ok({
      ...updated,
      masterPrice: Number(updated.masterPrice),
      aPrice: updated.aPrice ? Number(updated.aPrice) : null,
      bPrice: updated.bPrice ? Number(updated.bPrice) : null,
      cPrice: updated.cPrice ? Number(updated.cPrice) : null,
    });
  } catch {
    return badRequest("Invalid request body");
  }
}
