import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  avatar: string | null;
};

function toRecord(row: typeof users.$inferSelect): UserRecord {
  return {
    id: String(row.id),
    email: row.email,
    passwordHash: row.passwordHash,
    name: row.name,
    role: row.role,
    avatar: row.avatar,
  };
}

function numericId(userId: number | string): number | null {
  const numeric = typeof userId === "number" ? userId : Number(userId);
  if (!Number.isInteger(numeric) || numeric <= 0) return null;
  return numeric;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function findUserById(userId: number | string): Promise<UserRecord | null> {
  const id = numericId(userId);
  if (id == null) return null;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ? toRecord(rows[0]) : null;
}
