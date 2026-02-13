import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { requireAuth } from "@/lib/with-auth";
import { ok, badRequest, notFound } from "@/lib/api-response";

/** PUT /api/cart/update - Update cart item quantity */
export async function PUT(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    const body = await req.json();
    const { cartId, quantity } = body as { cartId?: string; quantity?: number };

    if (!cartId) {
      return badRequest("cartId is required");
    }

    const qty = quantity != null ? Math.max(0, Number(quantity)) : 0;
    const customerId = authResult.payload.userId;

    const cart = await prisma.cart.findFirst({
      where: { id: cartId, customerId },
      include: { serial: { include: { item: true } } },
    });

    if (!cart) {
      return notFound("Cart item not found");
    }

    if (qty === 0) {
      await prisma.cart.delete({ where: { id: cartId } });
      return ok({ id: cartId, quantity: 0, removed: true });
    }

    const updated = await prisma.cart.update({
      where: { id: cartId },
      data: { quantity: qty },
      include: { serial: { include: { item: true } } },
    });

    return ok({
      ...updated,
      serial: {
        ...updated.serial,
        item: {
          ...updated.serial.item,
          masterPrice: Number(updated.serial.item.masterPrice),
        },
      },
    });
  } catch {
    return badRequest("Invalid request body");
  }
}
