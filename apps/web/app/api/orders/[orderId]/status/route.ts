import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { requireAdmin } from "@/lib/with-auth";
import { OrderStatus } from "@repo/shared";
import { ok, badRequest, notFound } from "@/lib/api-response";

const VALID_STATUSES = Object.values(OrderStatus);

/** PUT /api/orders/[orderId]/status - Update order status (admin only) */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const authResult = await requireAdmin(req);
  if ("error" in authResult) return authResult.error;

  try {
    const { orderId } = await params;
    const body = await req.json();
    const { status } = body as { status?: string };

    if (!status) {
      return badRequest("status is required");
    }

    if (!(VALID_STATUSES as readonly string[]).includes(status)) {
      return badRequest(
        `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return notFound("Order not found");
    }

    const updateData: { status: string; confirmedBy?: string; confirmedAt?: Date } = {
      status,
    };
    if (status === OrderStatus.CONFIRMED && !order.confirmedBy) {
      updateData.confirmedBy = authResult.payload.userId;
      updateData.confirmedAt = new Date();
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
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
  } catch {
    return badRequest("Invalid request body");
  }
}
