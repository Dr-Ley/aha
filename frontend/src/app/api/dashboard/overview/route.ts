import { NextRequest, NextResponse } from "next/server";
import { loadOverviewAggregate } from "@/lib/overview-aggregate";
import { nairobiYmd } from "@/lib/nairobi-date";
import { isOverviewPeriod, overviewPeriodBounds, type OverviewPeriod } from "@/lib/overview-period";
import { requireTenantContext } from "@/server/tenancy";
import {
  companyUsesBar,
  companyUsesHotelStays,
  companyUsesRestaurant,
  companyUsesSafariTours,
  type CompanyId,
} from "@/types/company";

export async function GET(request: NextRequest) {
  try {
    const tenant = await requireTenantContext(request.nextUrl.searchParams.get("companyId"), {
      module: "overview",
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId as CompanyId;
    const periodParam = request.nextUrl.searchParams.get("period");
    const period: OverviewPeriod = isOverviewPeriod(periodParam) ? periodParam : "month";
    const today = nairobiYmd();
    const anchorParam = request.nextUrl.searchParams.get("anchor");
    const anchor = anchorParam && /^\d{4}-\d{2}-\d{2}$/.test(anchorParam) ? anchorParam : today;
    const bounds = overviewPeriodBounds(period, today, anchor);
    const overview = await loadOverviewAggregate({
      companyId,
      period,
      today,
      anchor,
      periodStart: bounds?.start ?? null,
      periodEnd: bounds?.end ?? null,
      safari: companyUsesSafariTours(companyId),
      hotel: companyUsesHotelStays(companyId),
      bar: companyUsesBar(companyId),
      restaurant: companyUsesRestaurant(companyId),
    });
    return NextResponse.json({ success: true, ...overview });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return NextResponse.json({ success: false, error: "Failed to load dashboard overview" }, { status: 500 });
  }
}
