import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { users } from "../lib/schema";

async function main() {
  try {
    const [row] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, 4))
      .limit(1);
    console.log("row", JSON.stringify(row));
  } catch (e) {
    const err = e as { name?: string; code?: string; message?: string; cause?: { message?: string; code?: string } };
    console.error("NAME", err?.name);
    console.error("CODE", err?.code);
    console.error("MSG", String(err?.message || err).slice(0, 1200));
    if (err?.cause) {
      console.error("CAUSE_CODE", err.cause?.code);
      console.error("CAUSE", String(err.cause?.message || err.cause).slice(0, 1200));
    }
  }
}

main();
