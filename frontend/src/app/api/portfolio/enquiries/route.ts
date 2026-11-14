import { NextResponse } from "next/server";
import { z } from "zod";
import { savePortfolioEnquiry } from "@/lib/portfolio-db";

const enquirySchema = z.object({
  fullName: z.string().trim().max(160),
  businessName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(255),
  presence: z.string().trim().max(512),
  message: z.string().trim().min(2).max(4000),
});

export async function POST(request: Request) {
  const parsed = enquirySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the required details" }, { status: 400 });
  try {
    const saved = await savePortfolioEnquiry(parsed.data);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("portfolio enquiry POST", error);
    return NextResponse.json({ error: "Could not save your note" }, { status: 500 });
  }
}
