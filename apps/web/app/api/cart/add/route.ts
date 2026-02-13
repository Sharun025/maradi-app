import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { requireAuth } from "@/lib/with-auth";
import { SerialStatus } from "@repo/shared";
import { ok, badRequest, notFound, conflict } from "@/lib/api-response";

/** POST /api/cart/add - Add serial to cart */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    const body = await req.json();
    const { serialId, quantity } = body as { serialId?: string; quantity?: number };

    if (!serialId) {
      return badRequest("serialId is required");
    }

    const serial = await prisma.serial.findUnique({
      where: { id: String(serialId) },
      include: { item: true },
    });

    if (!serial) {
      return notFound("Serial not found");
    }

    if (serial.status !== SerialStatus.AVAILABLE) {
      return conflict("Serial is not available");
    }

    const qty = Math.max(1, quantity ?? 1);
    const customerId = authResult.payload.userId;

    const cart = await prisma.cart.upsert({
      where: {
        customerId_serialId: { customerId, serialId: String(serialId) },
      },
      create: {
        customerId,
        serialId: String(serialId),
        quantity: qty,
      },
      update: { quantity: { increment: qty } },
      include: {
        serial: { include: { item: true } },
      },
    });

    return ok({
      ...cart,
      serial: {
        ...cart.serial,
        item: {
          ...cart.serial.item,
          masterPrice: Number(cart.serial.item.masterPrice),
        },
      },
    });
  } catch {
    return badRequest("Invalid request body");
  }
}
