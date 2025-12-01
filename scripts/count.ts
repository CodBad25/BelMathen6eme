import { drizzle } from "drizzle-orm/mysql2";
import { resources } from "../drizzle/schema";
const db = drizzle(process.env.DATABASE_URL!);
const allResources = await db.select().from(resources);
console.log(`Total: ${allResources.length} ressources`);
process.exit(0);
