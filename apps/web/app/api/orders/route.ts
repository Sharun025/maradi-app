import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { requireAuth } from "@/lib/with-auth";
import { OrderStatus } from "@repo/shared";
import { ok, badRequest } from "@/lib/api-response";

/** GET /api/orders - List orders with filters */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  const payload = authResult.payload;
  const isAdmin = payload.role === "admin";

  const where: Record<string, unknown> = {};

  if (!isAdmin) {
    where.customerId = payload.userId;
  } else if (customerId) {
    where.customerId = customerId;
  }

  if (status) where.status = status;
  if (fromDate || toDate) {
    where.orderDate = {};
    if (fromDate) (where.orderDate as Record<string, Date>).gte = new Date(fromDate);
    if (toDate) (where.orderDate as Record<string, Date>).lte = new Date(toDate);
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            companyName: true,
            bpCode: true,
          },
        },
        items: { include: { item: true, serial: true } },
      },
      orderBy: { orderDate: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.order.count({ where }),
  ]);

  return ok({
    items: orders.map((o) => ({
      ...o,
      totalAmount: Number(o.totalAmount),
      items: o.items.map((i) => ({
        ...i,
        price: Number(i.price),
        item: {
          ...i.item,
          masterPrice: Number(i.item.masterPrice),
        },
      })),
    })),
    total,
    limit,
    offset,
  });
}

/** POST /api/orders - Place order */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    const body = await req.json();
    const { items: orderItems, notes } = body as {
      items?: Array<{ serialId: string; quantity?: number }>;
      notes?: string;
    };

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return badRequest("items array is required");
    }

    const customerId = authResult.payload.userId;

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const order = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          orderDate: new Date(),
          status: OrderStatus.PENDING,
          totalAmount: 0,
          notes: notes ?? null,
        },
      });

      let total = 0;
      for (const oi of orderItems) {
        const serialId = String(oi.serialId);
        const qty = Math.max(1, oi.quantity ?? 1);

        const serial = await tx.serial.findUnique({
          where: { id: serialId },
          include: { item: true },
        });
        if (!serial || serial.status !== "available") {
          throw new Error(`Serial ${serialId} not available`);
        }

        const price = Number(serial.item.masterPrice) * qty;
        total += price;

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            itemId: serial.itemId,
            serialId,
            quantity: qty,
            price,
            status: "pending",
          },
        });

        await tx.serial.update({
          where: { id: serialId },
          data: { status: "reserved" },
        });
      }

      return tx.order.update({
        where: { id: order.id },
        data: { totalAmount: total },
        include: {
          customer: {
            select: { id: true, email: true, companyName: true },
          },
          items: { include: { item: true, serial: true } },
        },
      });
    });

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
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid request body";
    return badRequest(msg);
  }
}
