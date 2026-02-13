import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { SerialStatus } from "@repo/shared";
import { ok } from "@/lib/api-response";

/** GET /api/serials/recent - Serials added today (for "Added Today" section) */
export async function GET(req: NextRequest) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [serials, totalAddedToday] = await Promise.all([
    prisma.serial.findMany({
      where: {
        status: SerialStatus.AVAILABLE,
        dateAdded: { gte: today, lt: tomorrow },
      },
      include: {
        item: {
          include: {
            images: { orderBy: { isMaster: "desc" }, take: 1 },
          },
        },
      },
      orderBy: { dateAdded: "desc" },
      take: 24,
    }),
    prisma.serial.count({
      where: { dateAdded: { gte: today, lt: tomorrow } },
    }),
  ]);

  return ok({
    items: serials.map((s) => ({
      ...s,
      item: {
        ...s.item,
        masterPrice: Number(s.item.masterPrice),
        thumbnailUrl: s.item.images[0]?.imageUrl ?? null,
      },
    })),
    totalAddedToday,
  });
}
