import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { requireAdmin } from "@/lib/with-auth";
import { OrderStatus } from "@repo/shared";
import { ok, notFound } from "@/lib/api-response";

type ItemAction =
  | { orderItemId: string; action: "confirm" }
  | { orderItemId: string; action: "replace"; replacementSerialId: string }
  | {
      orderItemId: string;
      action: "suggest";
      replacementItemId: string;
      replacementSerialId: string;
    }
  | { orderItemId: string; action: "reject" };

/** PUT /api/orders/[orderId]/confirm - Confirm order with optional item actions (admin only) */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const authResult = await requireAdmin(req);
  if ("error" in authResult) return authResult.error;

  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return notFound("Order not found");
  }

  let body: { notes?: string; itemActions?: ItemAction[] } = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text) as typeof body;
  } catch {
    // no body or invalid JSON - proceed with simple confirm
  }

  const { notes, itemActions } = body;

  if (itemActions && Array.isArray(itemActions) && itemActions.length > 0) {
    for (const action of itemActions) {
      const item = order.items.find((i) => i.id === action.orderItemId);
      if (!item) continue;

      if (action.action === "confirm") {
        await prisma.orderItem.update({
          where: { id: action.orderItemId },
          data: { status: "fulfilled" },
        });
      } else if (action.action === "replace" && action.replacementSerialId) {
        const replacement = await prisma.serial.findUnique({
          where: { id: action.replacementSerialId },
        });
        if (replacement && replacement.itemId === item.itemId) {
          await prisma.orderItem.update({
            where: { id: action.orderItemId },
            data: {
              replacementSerialId: action.replacementSerialId,
              status: "fulfilled",
            },
          });
        }
      } else if (
        action.action === "suggest" &&
        action.replacementItemId &&
        action.replacementSerialId
      ) {
        const replacement = await prisma.serial.findUnique({
          where: { id: action.replacementSerialId },
          include: { item: true },
        });
        if (
          replacement &&
          replacement.itemId === action.replacementItemId &&
          replacement.status === "available"
        ) {
          const price = Number(replacement.item.masterPrice) * item.quantity;
          await prisma.orderItem.update({
            where: { id: action.orderItemId },
            data: {
              itemId: action.replacementItemId,
              serialId: null,
              replacementSerialId: action.replacementSerialId,
              price,
              status: "fulfilled",
            },
          });
        }
      } else if (action.action === "reject") {
        await prisma.orderItem.update({
          where: { id: action.orderItemId },
          data: { status: "cancelled" },
        });
      }
    }
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.CONFIRMED,
      confirmedBy: authResult.payload.userId,
      confirmedAt: new Date(),
      ...(notes != null && { notes }),
    },
    include: {
      customer: {
        select: { id: true, email: true, companyName: true },
      },
      items: { include: { item: true, serial: true } },
    },
  });

  return ok({
    ...updated,
    totalAmount: Number(updated.totalAmount),
    items: updated.items.map((i) => ({
      ...i,
      price: Number(i.price),
      item: {
        ...i.item,
        masterPrice: Number(i.item.masterPrice),
      },
    })),
  });
}
