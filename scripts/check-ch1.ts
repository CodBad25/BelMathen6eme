import { drizzle } from "drizzle-orm/mysql2";
import { resources } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);
const ch1 = await db.select().from(resources).where(eq(resources.chapterId, "chapitre-1"));
console.log(`Chapitre 1: ${ch1.length} ressources`);
console.log(ch1.map(r => `- ${r.title} (${r.visible})`).join('\n'));
process.exit(0);
