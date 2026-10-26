import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { restaurantItems, restaurantOrderItems, restaurantOrders } from "@/lib/schema";
import { requireTenantContext } from "@/server/tenancy";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { companyIdZod } from "@/lib/schemas/company-id";
import { createNotification } from "@/lib/notify";
import { ensureBarRestaurantOrderStatusVarchar } from "@/lib/ensure-bar-restaurant-order-status";

const lineSchema = z.object({
  itemId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().int().min(0).optional(),
  notes: z.string().max(500).optional().nullable(),
});

const postSchema = z.object({
  companyId: companyIdZod,
  tableLabel: z.string().max(80).optional().nullable(),
  customerName: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["unpaid", "partially_paid", "paid"]).optional(),
  items: z.array(lineSchema).min(1),
});

const patchSchema = z.object({
  id: z.coerce.number().int().positive(),
  companyId: companyIdZod,
  status: z.enum(["unpaid", "partially_paid", "paid"]).optional(),
  tableLabel: z.string().max(80).optional().nullable(),
  customerName: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(lineSchema).min(1).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await ensureBarRestaurantOrderStatusVarchar();
    const tenant = await requireTenantContext(request.nextUrl.searchParams.get("companyId") ?? new URL(request.url).searchParams.get("companyId"), {
      module: "restaurant",
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const linkView = request.nextUrl.searchParams.get("view") === "link";

    const orderRows = linkView
      ? await db
          .select({
            id: restaurantOrders.id,
            tableLabel: restaurantOrders.tableLabel,
            customerName: restaurantOrders.customerName,
            status: restaurantOrders.status,
          })
          .from(restaurantOrders)
          .where(eq(restaurantOrders.companyId, companyId))
          .orderBy(desc(restaurantOrders.createdAt))
      : await db
          .select()
          .from(restaurantOrders)
          .where(eq(restaurantOrders.companyId, companyId))
          .orderBy(desc(restaurantOrders.createdAt));
    const ids = orderRows.map((o) => o.id);
    if (ids.length === 0) {
      return NextResponse.json({ success: true, orders: [] as unknown[] });
    }
    const lines = linkView
      ? await db
          .select({ orderId: restaurantOrderItems.orderId, lineTotal: restaurantOrderItems.lineTotal })
          .from(restaurantOrderItems)
          .where(and(eq(restaurantOrderItems.companyId, companyId), inArray(restaurantOrderItems.orderId, ids)))
      : await db
          .select()
          .from(restaurantOrderItems)
          .where(and(eq(restaurantOrderItems.companyId, companyId), inArray(restaurantOrderItems.orderId, ids)));
    const byOrder = new Map<number, Array<{ lineTotal: number }>>();
    for (const line of lines) {
      const list = byOrder.get(line.orderId) ?? [];
      list.push(line);
      byOrder.set(line.orderId, list);
    }
    return NextResponse.json({
      success: true,
      orders: orderRows.map((o) => {
        const itemLines = byOrder.get(o.id) ?? [];
        const total = itemLines.reduce((s, l) => s + l.lineTotal, 0);
        if (linkView) return { ...o, total };
        return { ...o, lineItems: itemLines, total };
      }),
    });
  } catch (e) {
    console.error("restaurant-orders GET", e);
    return NextResponse.json({ error: "Failed to list restaurant orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureBarRestaurantOrderStatusVarchar();
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const tenant = await requireTenantContext(parsed.data.companyId, {
      module: "restaurant",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const d = parsed.data;

    const lineRows: (Omit<typeof restaurantOrderItems.$inferInsert, "orderId">)[] = [];
    for (const line of d.items) {
      const [menu] = await db
        .select()
        .from(restaurantItems)
        .where(
          and(
            eq(restaurantItems.id, line.itemId),
            eq(restaurantItems.companyId, companyId),
            eq(restaurantItems.isAvailable, true)
          )
        )
        .limit(1);
      if (!menu) {
        return NextResponse.json(
          { error: `Menu item not available: ${line.itemId}` },
          { status: 400 }
        );
      }
      const unitPrice = line.unitPrice ?? menu.price;
      const lineTotal = unitPrice * line.quantity;
      lineRows.push({
        companyId,
        itemId: menu.id,
        quantity: line.quantity,
        unitPrice,
        lineTotal,
        notes: line.notes ?? null,
      });
    }

    const [order] = await db
      .insert(restaurantOrders)
      .values({
        companyId,
        status: d.status ?? "unpaid",
        tableLabel: d.tableLabel ?? null,
        customerName: d.customerName ?? null,
        notes: d.notes ?? null,
        updatedAt: new Date(),
      })
      .returning();

    await db.insert(restaurantOrderItems).values(
      lineRows.map((l) => ({ ...l, orderId: order.id }))
    );
    await createNotification({
      companyId,
      type: "restaurant",
      action: "created",
      referenceId: order.id,
      title: `Restaurant order #${order.id}${order.tableLabel ? ` · ${order.tableLabel}` : ""}`,
      metadata: { status: order.status, lineCount: lineRows.length },
    });
    try {
      const { ensureDashboardPaymentForPaidRestaurantOrder } = await import("@/lib/sync-paid-source-payments");
      await ensureDashboardPaymentForPaidRestaurantOrder(companyId, order.id, order.status);
    } catch (e) {
      console.error("ensureDashboardPaymentForPaidRestaurantOrder (POST):", e);
    }
    try {
      const { syncRevenueFromRestaurantOrder } = await import("@/lib/sync-source-revenue");
      await syncRevenueFromRestaurantOrder(companyId, order.id, order.status);
    } catch (e) {
      console.error("syncRevenueFromRestaurantOrder (POST):", e);
    }
    return NextResponse.json({ success: true, order, lineItemCount: lineRows.length });
  } catch (e) {
    console.error("restaurant-orders POST", e);
    return NextResponse.json({ error: "Failed to create restaurant order" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureBarRestaurantOrderStatusVarchar();
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const tenant = await requireTenantContext(parsed.data.companyId, {
      module: "restaurant",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const d = parsed.data;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (d.status !== undefined) updates.status = d.status;
    if (d.tableLabel !== undefined) updates.tableLabel = d.tableLabel;
    if (d.customerName !== undefined) updates.customerName = d.customerName;
    if (d.notes !== undefined) updates.notes = d.notes;
    if (Object.keys(updates).length === 1 && d.items == null) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    const [row] = await db
      .update(restaurantOrders)
      .set(updates)
      .where(and(eq(restaurantOrders.id, d.id), eq(restaurantOrders.companyId, companyId)))
      .returning();
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (d.items) {
      const lineRows: (Omit<typeof restaurantOrderItems.$inferInsert, "orderId">)[] = [];
      for (const line of d.items) {
        const [menu] = await db
          .select()
          .from(restaurantItems)
          .where(and(eq(restaurantItems.id, line.itemId), eq(restaurantItems.companyId, companyId)))
          .limit(1);
        if (!menu) {
          return NextResponse.json({ error: `Menu item not found: ${line.itemId}` }, { status: 400 });
        }
        const unitPrice = line.unitPrice ?? menu.price;
        lineRows.push({
          companyId,
          itemId: menu.id,
          quantity: line.quantity,
          unitPrice,
          lineTotal: unitPrice * line.quantity,
          notes: line.notes ?? null,
        });
      }
      await db.delete(restaurantOrderItems).where(eq(restaurantOrderItems.orderId, row.id));
      await db.insert(restaurantOrderItems).values(lineRows.map((line) => ({ ...line, orderId: row.id })));
    }
    const title =
      d.status !== undefined
        ? `Restaurant order #${row.id} status changed to ${row.status}`
        : d.tableLabel !== undefined
          ? `Restaurant order #${row.id} table changed`
          : d.customerName !== undefined
            ? `Restaurant order #${row.id} customer changed`
            : d.notes !== undefined
              ? `Restaurant order #${row.id} notes changed`
              : `Restaurant order #${row.id} details changed`;
    await createNotification({
      companyId,
      type: "restaurant",
      action: "updated",
      referenceId: row.id,
      title,
      metadata: { status: row.status },
    });
    try {
      const { ensureDashboardPaymentForPaidRestaurantOrder } = await import("@/lib/sync-paid-source-payments");
      await ensureDashboardPaymentForPaidRestaurantOrder(companyId, row.id, row.status);
    } catch (e) {
      console.error("ensureDashboardPaymentForPaidRestaurantOrder:", e);
    }
    try {
      const { syncRevenueFromRestaurantOrder } = await import("@/lib/sync-source-revenue");
      await syncRevenueFromRestaurantOrder(companyId, row.id, row.status);
    } catch (e) {
      console.error("syncRevenueFromRestaurantOrder:", e);
    }
    return NextResponse.json({ success: true, order: row });
  } catch (e) {
    console.error("restaurant-orders PATCH", e);
    const msg = e instanceof Error ? e.message : "Failed to update order";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id") ?? new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id and companyId required" }, { status: 400 });
    }
    const tenant = await requireTenantContext(request.nextUrl.searchParams.get("companyId") ?? new URL(request.url).searchParams.get("companyId"), {
      module: "restaurant",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const oid = parseInt(id, 10);
    const [existing] = await db
      .select({ id: restaurantOrders.id })
      .from(restaurantOrders)
      .where(and(eq(restaurantOrders.id, oid), eq(restaurantOrders.companyId, companyId)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    try {
      const { deleteRevenueForEntity } = await import("@/lib/sync-source-revenue");
      await deleteRevenueForEntity(companyId, "restaurant", oid);
    } catch (e) {
      console.error("deleteRevenueForEntity (restaurant):", e);
    }
    await db.delete(restaurantOrderItems).where(eq(restaurantOrderItems.orderId, oid));
    await db
      .delete(restaurantOrders)
      .where(and(eq(restaurantOrders.id, oid), eq(restaurantOrders.companyId, companyId)));
    await createNotification({
      companyId,
      type: "restaurant",
      action: "deleted",
      referenceId: oid,
      title: `Restaurant order #${oid} deleted`,
      metadata: {},
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("restaurant-orders DELETE", e);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
