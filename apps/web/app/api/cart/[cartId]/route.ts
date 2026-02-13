import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { requireAuth } from "@/lib/with-auth";
import { noContent, notFound } from "@/lib/api-response";

/** DELETE /api/cart/[cartId] - Remove item from cart */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ cartId: string }> }
) {
  const authResult = await requireAuth(req);
  if ("error" in authResult) return authResult.error;

  const { cartId } = await params;
  const customerId = authResult.payload.userId;

  const cart = await prisma.cart.findFirst({
    where: { id: cartId, customerId },
  });

  if (!cart) {
    return notFound("Cart item not found");
  }

  await prisma.cart.delete({
    where: { id: cartId },
  });

  return noContent();
}
