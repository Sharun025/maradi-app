import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { requireAuth } from "@/lib/with-auth";
import { SerialStatus } from "@repo/shared";
import { ok, badRequest, notFound } from "@/lib/api-response";

/** POST /api/serials/mark-sold - Mark serial(s) as sold */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    const body = await req.json();
    const { serialIds, serialId, soldTo, soldType } = body as Record<
      string,
      unknown
    >;

    const ids = serialIds ?? (serialId ? [serialId] : []);
    if (!Array.isArray(ids) || ids.length === 0) {
      return badRequest("serialIds or serialId is required");
    }

    const now = new Date();

    const results = await Promise.all(
      ids.map(async (id: string) => {
        const serial = await prisma.serial.findUnique({
          where: { id: String(id) },
        });
        if (!serial) return { id, error: "not_found" };
        if (serial.status === SerialStatus.SOLD) {
          return { id, error: "already_sold" };
        }
        await prisma.serial.update({
          where: { id: String(id) },
          data: {
            status: SerialStatus.SOLD,
            soldDate: now,
            soldTo: soldTo != null ? String(soldTo) : null,
            soldType: soldType != null ? String(soldType) : null,
          },
        });
        return { id, ok: true };
      })
    );

    const notFoundIds = results.filter((r) => r.error === "not_found").map((r) => r.id);
    const alreadySoldIds = results.filter((r) => r.error === "already_sold").map((r) => r.id);

    if (notFoundIds.length === ids.length) {
      return notFound("No serials found");
    }

    return ok({
      updated: results.filter((r) => r.ok).map((r) => r.id),
      notFound: notFoundIds,
      alreadySold: alreadySoldIds,
    });
  } catch {
    return badRequest("Invalid request body");
  }
}
