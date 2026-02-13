import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { requireAuth } from "@/lib/with-auth";
import { ok } from "@/lib/api-response";

/** GET /api/cart - Get current user's cart */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("error" in authResult) return authResult.error;

  const { payload } = authResult;
  const customerId = payload.userId;

  const cartItems = await prisma.cart.findMany({
    where: { customerId },
    include: {
      serial: { include: { item: true } },
    },
    orderBy: { reservedAt: "desc" },
  });

  return ok(
    cartItems.map((c) => ({
      id: c.id,
      serialId: c.serialId,
      quantity: c.quantity,
      reservedAt: c.reservedAt,
      expiresAt: c.expiresAt,
      serial: {
        ...c.serial,
        item: {
          ...c.serial.item,
          masterPrice: Number(c.serial.item.masterPrice),
        },
      },
    }))
  );
}
