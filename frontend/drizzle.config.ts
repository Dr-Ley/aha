import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";


dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql", // Changed from driver: 'pg'
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
