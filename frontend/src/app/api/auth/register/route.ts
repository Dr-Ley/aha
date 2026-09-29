import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcrypt";
import { enforceRateLimit } from "@/lib/rate-limit";
import { registerBodySchema } from "@/lib/schemas/public";

export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "register", 5);
    if (limited) return limited;

    const parsed = registerBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid registration details" },
        { status: 400 }
      );
    }
    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email: normalizedEmail,
        passwordHash,
        role: "customer",
        avatar: name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      })
      .returning({ id: users.id, email: users.email, name: users.name });

    return NextResponse.json(
      { success: true, user: { id: newUser.id, email: newUser.email, name: newUser.name } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
