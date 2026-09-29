import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { barItems, barOrderItems, barOrders } from "@/lib/schema";
import { requireTenantContext } from "@/server/tenancy";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { companyIdZod } from "@/lib/schemas/company-id";
import { createNotification } from "@/lib/notify";
import { ensureBarRestaurantOrderStatusVarchar } from "@/lib/ensure-bar-restaurant-order-status";

const lineSchema = z.object({
  itemId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1),
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
});

export async function GET(request: NextRequest) {
  try {
    await ensureBarRestaurantOrderStatusVarchar();
    const tenant = await requireTenantContext(request.nextUrl.searchParams.get("companyId") ?? new URL(request.url).searchParams.get("companyId"), {
      module: "bar",
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;

    const orderRows = await db
      .select()
      .from(barOrders)
      .where(eq(barOrders.companyId, companyId))
      .orderBy(desc(barOrders.createdAt));
    const ids = orderRows.map((o) => o.id);
    if (ids.length === 0) {
      return NextResponse.json({ success: true, orders: [] as unknown[] });
    }
    const lines = await db
      .select({
        orderId: barOrderItems.orderId,
        quantity: barOrderItems.quantity,
        unitPrice: barOrderItems.unitPrice,
        lineTotal: barOrderItems.lineTotal,
        notes: barOrderItems.notes,
        itemName: barItems.name,
      })
      .from(barOrderItems)
      .leftJoin(barItems, eq(barOrderItems.itemId, barItems.id))
      .where(inArray(barOrderItems.orderId, ids));
    const byOrder: Record<number, (typeof lines)[number][]> = {};
    for (const line of lines) {
      (byOrder[line.orderId] = byOrder[line.orderId] || []).push(line);
    }
    return NextResponse.json({
      success: true,
      orders: orderRows.map((o) => {
        const itemLines = (byOrder[o.id] || []).map((line) => ({
          itemName: line.itemName ?? "Product",
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
          notes: line.notes,
        }));
        const total = itemLines.reduce((s, l) => s + l.lineTotal, 0);
        const itemsSold = itemLines.reduce((s, l) => s + l.quantity, 0);
        return { ...o, lineItems: itemLines, total, itemsSold };
      }),
    });
  } catch (e) {
    console.error("bar-orders GET", e);
    return NextResponse.json({ error: "Failed to list bar orders" }, { status: 500 });
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
      module: "bar",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const d = parsed.data;

    const lineRows: (Omit<typeof barOrderItems.$inferInsert, "orderId">)[] = [];
    for (const line of d.items) {
      const [menu] = await db
        .select()
        .from(barItems)
        .where(
          and(
            eq(barItems.id, line.itemId),
            eq(barItems.companyId, companyId),
            eq(barItems.isAvailable, true)
          )
        )
        .limit(1);
      if (!menu) {
        return NextResponse.json(
          { error: `Bar item not available: ${line.itemId}` },
          { status: 400 }
        );
      }
      const lineTotal = menu.price * line.quantity;
      lineRows.push({
        companyId,
        itemId: menu.id,
        quantity: line.quantity,
        unitPrice: menu.price,
        lineTotal,
        notes: line.notes ?? null,
      });
    }

    const [order] = await db
      .insert(barOrders)
      .values({
        companyId,
        status: d.status ?? "unpaid",
        tableLabel: d.tableLabel ?? null,
        customerName: d.customerName ?? null,
        notes: d.notes ?? null,
        updatedAt: new Date(),
      })
      .returning();

    await db.insert(barOrderItems).values(
      lineRows.map((l) => ({ ...l, orderId: order.id }))
    );
    await createNotification({
      companyId,
      type: "bar",
      action: "created",
      referenceId: order.id,
      title: `Bar order #${order.id}${order.tableLabel ? ` · ${order.tableLabel}` : ""}`,
      metadata: { status: order.status, lineCount: lineRows.length },
    });
    try {
      const { ensureDashboardPaymentForPaidBarOrder } = await import("@/lib/sync-paid-source-payments");
      await ensureDashboardPaymentForPaidBarOrder(companyId, order.id, order.status);
    } catch (e) {
      console.error("ensureDashboardPaymentForPaidBarOrder (POST):", e);
    }
    try {
      const { syncRevenueFromBarOrder } = await import("@/lib/sync-source-revenue");
      await syncRevenueFromBarOrder(companyId, order.id, order.status);
    } catch (e) {
      console.error("syncRevenueFromBarOrder (POST):", e);
    }
    return NextResponse.json({ success: true, order, lineItemCount: lineRows.length });
  } catch (e) {
    console.error("bar-orders POST", e);
    return NextResponse.json({ error: "Failed to create bar order" }, { status: 500 });
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
      module: "bar",
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
    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    const [row] = await db
      .update(barOrders)
      .set(updates)
      .where(and(eq(barOrders.id, d.id), eq(barOrders.companyId, companyId)))
      .returning();
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const title =
      d.status !== undefined
        ? `Bar order #${row.id} status changed to ${row.status}`
        : d.tableLabel !== undefined
          ? `Bar order #${row.id} table changed`
          : d.customerName !== undefined
            ? `Bar order #${row.id} customer changed`
            : d.notes !== undefined
              ? `Bar order #${row.id} notes changed`
              : `Bar order #${row.id} details changed`;
    await createNotification({
      companyId,
      type: "bar",
      action: "updated",
      referenceId: row.id,
      title,
      metadata: { status: row.status },
    });
    try {
      const { ensureDashboardPaymentForPaidBarOrder } = await import("@/lib/sync-paid-source-payments");
      await ensureDashboardPaymentForPaidBarOrder(companyId, row.id, row.status);
    } catch (e) {
      console.error("ensureDashboardPaymentForPaidBarOrder:", e);
    }
    try {
      const { syncRevenueFromBarOrder } = await import("@/lib/sync-source-revenue");
      await syncRevenueFromBarOrder(companyId, row.id, row.status);
    } catch (e) {
      console.error("syncRevenueFromBarOrder:", e);
    }
    return NextResponse.json({ success: true, order: row });
  } catch (e) {
    console.error("bar-orders PATCH", e);
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
      module: "bar",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const oid = parseInt(id, 10);
    const [existing] = await db
      .select({ id: barOrders.id })
      .from(barOrders)
      .where(and(eq(barOrders.id, oid), eq(barOrders.companyId, companyId)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    try {
      const { deleteRevenueForEntity } = await import("@/lib/sync-source-revenue");
      await deleteRevenueForEntity(companyId, "bar", oid);
    } catch (e) {
      console.error("deleteRevenueForEntity (bar):", e);
    }
    await db.delete(barOrderItems).where(eq(barOrderItems.orderId, oid));
    await db.delete(barOrders).where(and(eq(barOrders.id, oid), eq(barOrders.companyId, companyId)));
    await createNotification({
      companyId,
      type: "bar",
      action: "deleted",
      referenceId: oid,
      title: `Bar order #${oid} deleted`,
      metadata: {},
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("bar-orders DELETE", e);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
