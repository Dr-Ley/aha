import { eq } from "drizzle-orm";
import { users } from "@/lib/schema";

type Selectable = {
  select(shape: Record<string, unknown>): {
    from(table: object): {
      where(condition: unknown): {
        limit(count: number): Promise<Array<Record<string, unknown>>>;
      };
    };
  };
};

/** Loads the settings editor identity without reading password_hash. */
export async function findStaffUserSummary(database: Selectable, userId: number) {
  const [user] = await database
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user ?? null;
}
