import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { requireAuth } from "@/lib/with-auth";
import { ok, notFound, forbidden } from "@/lib/api-response";

/** GET /api/orders/[orderId] - Get single order */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const authResult = await requireAuth(req);
  if ("error" in authResult) return authResult.error;

  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: {
        select: { id: true, email: true, companyName: true, bpCode: true },
      },
      items: { include: { item: true, serial: true } },
    },
  });

  if (!order) {
    return notFound("Order not found");
  }

  const isAdmin = authResult.payload.role === "admin";
  if (!isAdmin && order.customerId !== authResult.payload.userId) {
    return forbidden("Access denied");
  }

  return ok({
    ...order,
    totalAmount: Number(order.totalAmount),
    items: order.items.map((i) => ({
      ...i,
      price: Number(i.price),
      item: {
        ...i.item,
        masterPrice: Number(i.item.masterPrice),
      },
    })),
  });
}
