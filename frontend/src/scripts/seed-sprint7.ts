import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../../.env.local") });
dotenv.config({ path: join(__dirname, "../.env.local") });
dotenv.config({ path: join(__dirname, "../../.env") });

const { seedItineraryCatalog } = await import("../features/tourism/seed-itinerary-catalog");
await seedItineraryCatalog();
console.log("Sprint 7 itinerary catalog seed complete.");
