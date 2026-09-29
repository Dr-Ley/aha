import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not defined");

const sql = neon(url);

function statementsFromFile(path: string): string[] {
  const raw = readFileSync(path, "utf8");
  return raw
    .replace(/^BEGIN;$/gm, "")
    .replace(/^COMMIT;$/gm, "")
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
}

async function main() {
  const file = resolve("drizzle/0027_remove_seeded_room_types.sql");
  for (const statement of statementsFromFile(file)) {
    const preview = statement.replace(/\s+/g, " ").slice(0, 140);
    await sql.query(statement);
    console.log("ok:", preview);
  }
  const leftover = await sql`
    SELECT id, company_id, name, description
    FROM room_types
    WHERE description = 'Seeded for dashboard'
       OR (company_id = 'ewc' AND LOWER(name) IN ('tented', 'standard'))
    ORDER BY company_id, name
  `;
  const types = await sql`
    SELECT id, company_id, name, description
    FROM room_types
    ORDER BY company_id, name
  `;
  console.log(JSON.stringify({ leftover, roomTypes: types }, null, 2));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
