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
  const file = resolve("drizzle/0026_enchoro_normalization.sql");
  const statements = statementsFromFile(file);
  for (const statement of statements) {
    const preview = statement.replace(/\s+/g, " ").slice(0, 120);
    try {
      await sql.query(statement);
      console.log("ok:", preview);
    } catch (e) {
      console.error("fail:", preview);
      throw e;
    }
  }
  const types = await sql`
    SELECT id, company_id, name, max_occupancy, base_rate
    FROM room_types
    WHERE property_id = 1 AND company_id = 'ewc'
    ORDER BY name
  `;
  const rooms = await sql`
    SELECT id, code, name, is_active, room_type_id
    FROM rooms
    WHERE property_id = 1 AND is_active = true
    ORDER BY code
  `;
  console.log(JSON.stringify({ ewcRoomTypes: types, activeEnchoroRooms: rooms }, null, 2));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
