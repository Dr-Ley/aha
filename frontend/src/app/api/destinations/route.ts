import { NextRequest, NextResponse } from "next/server";
import { ensureSprint7Schema } from "@/server/database/ensure-sprint7";
import { listDestinations } from "@/server/services/tourism/tourism-service";

export async function GET(request: NextRequest) {
  await ensureSprint7Schema();
  const country = request.nextUrl.searchParams.get("country")?.trim();
  const publishedOnly = request.nextUrl.searchParams.get("published") === "true";
  let rows = country ? await listDestinations(country) : await listDestinations();
  if (publishedOnly) rows = rows.filter((row) => row.published);
  return NextResponse.json({
    success: true,
    destinations: rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      country: row.country,
      region: row.region,
      published: row.published,
    })),
  });
}
