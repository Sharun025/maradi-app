import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { SerialStatus } from "@repo/shared";
import { ok } from "@/lib/api-response";

/** GET /api/items/browse - List items with available count, for customer browsing */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
    const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

    const where: Record<string, unknown> = { isActive: true };

    if (category) where.category = category;
    if (subcategory) where.subcategory = subcategory;

    if (minPrice != null || maxPrice != null) {
      where.masterPrice = {};
      if (minPrice != null)
        (where.masterPrice as Record<string, number>).gte = Number(minPrice);
      if (maxPrice != null)
        (where.masterPrice as Record<string, number>).lte = Number(maxPrice);
    }

    const [items, counts] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          images: {
            orderBy: { isMaster: "desc" },
            take: 1,
          },
        },
        orderBy: { itemCode: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.serial.groupBy({
        by: ["itemId"],
        where: { status: SerialStatus.AVAILABLE },
        _count: true,
      }),
    ]);

    const countMap = new Map(counts.map((c) => [c.itemId, c._count]));

    return ok(
      items.map((item) => ({
        ...item,
        masterPrice: Number(item.masterPrice),
        aPrice: item.aPrice ? Number(item.aPrice) : null,
        bPrice: item.bPrice ? Number(item.bPrice) : null,
        cPrice: item.cPrice ? Number(item.cPrice) : null,
        thumbnailUrl: item.images[0]?.imageUrl ?? null,
        availableCount: countMap.get(item.id) ?? 0,
      }))
    );
  } catch {
    return ok([]);
  }
}
