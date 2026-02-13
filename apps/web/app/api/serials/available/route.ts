import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { SerialStatus } from "@repo/shared";
import { ok } from "@/lib/api-response";

/** GET /api/serials/available - List available serials for customers */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  const category = searchParams.get("category");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  const where: Record<string, unknown> = { status: SerialStatus.AVAILABLE };

  if (itemId) {
    where.itemId = itemId;
  }
  if (category) {
    where.item = { category };
  }

  const [serials, total] = await Promise.all([
    prisma.serial.findMany({
      where,
      include: { item: true },
      take: limit,
      skip: offset,
      orderBy: { dateAdded: "desc" },
    }),
    prisma.serial.count({ where }),
  ]);

  return ok({
    items: serials.map((s) => ({
      ...s,
      item: {
        ...s.item,
        masterPrice: Number(s.item.masterPrice),
      },
    })),
    total,
    limit,
    offset,
  });
}
