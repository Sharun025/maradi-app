import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { requireAdmin } from "@/lib/with-auth";
import { ok, badRequest } from "@/lib/api-response";

/** GET /api/items - List items with filters (category, subcategory, status) */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    const status = searchParams.get("status"); // isActive: "true" | "false" | "all"

    const where: Record<string, unknown> = {};

    if (category) {
      where.category = category;
    }
    if (subcategory) {
      where.subcategory = subcategory;
    }
    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        images: true,
      },
      orderBy: { itemCode: "asc" },
    });

    return ok(
      items.map((item) => ({
        ...item,
        masterPrice: Number(item.masterPrice),
        aPrice: item.aPrice ? Number(item.aPrice) : null,
        bPrice: item.bPrice ? Number(item.bPrice) : null,
        cPrice: item.cPrice ? Number(item.cPrice) : null,
      }))
    );
  } catch {
    return badRequest("Invalid query parameters");
  }
}

/** POST /api/items - Create item (admin only) */
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("error" in authResult) return authResult.error;

  try {
    const body = await req.json();
    const {
      itemCode,
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

    if (!itemCode || !itemName || !category || !inventoryType || !uom) {
      return badRequest(
        "itemCode, itemName, category, inventoryType, and uom are required"
      );
    }

    const masterPriceNum = Number(masterPrice);
    if (isNaN(masterPriceNum) || masterPriceNum < 0) {
      return badRequest("masterPrice must be a valid non-negative number");
    }

    const existing = await prisma.item.findUnique({
      where: { itemCode: String(itemCode).trim() },
    });
    if (existing) {
      return badRequest("Item with this itemCode already exists");
    }

    const item = await prisma.item.create({
      data: {
        itemCode: String(itemCode).trim(),
        itemName: String(itemName).trim(),
        category: String(category).trim(),
        subcategory: subcategory != null ? String(subcategory).trim() : null,
        hsnCode: hsnCode != null ? String(hsnCode).trim() : null,
        inventoryType: String(inventoryType).trim(),
        uom: String(uom).trim(),
        masterPrice: masterPriceNum,
        aPrice: aPrice != null ? Number(aPrice) : null,
        bPrice: bPrice != null ? Number(bPrice) : null,
        cPrice: cPrice != null ? Number(cPrice) : null,
        isActive: isActive !== false,
      },
      include: { images: true },
    });

    return ok({
      ...item,
      masterPrice: Number(item.masterPrice),
      aPrice: item.aPrice ? Number(item.aPrice) : null,
      bPrice: item.bPrice ? Number(item.bPrice) : null,
      cPrice: item.cPrice ? Number(item.cPrice) : null,
    });
  } catch (e) {
    return badRequest("Invalid request body");
  }
}
